package main

import (
	"encoding/json"
	"fmt"
	"hash/crc64"
	"image"

	_ "image/gif"
	"image/jpeg"
	_ "image/png"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
	"golang.org/x/image/draw"
)

type galleryItem struct {
	Title        string
	Description  string
	File         string
	Year         string
	Tags         []string
	Unmuted      bool
	NoAutoplay   bool
	ShowControls bool
	checksum     uint64 // Checksum used for thumbnail processing.
	Thumbnail    string
}

func (g galleryItem) Ext() string {
	return filepath.Ext(g.File)
}

type galleryDatabase struct {
	Items []*galleryItem
}

var databaseLock sync.Mutex
var database galleryDatabase

func loadDatabase() error {
	databaseLock.Lock()
	defer databaseLock.Unlock()
	if database.Items == nil {
		database.Items = make([]*galleryItem, 0)
	}
	log.Println("Loading gallery.")

	b, err := ioutil.ReadFile("art/gallery.json")
	if err != nil {
		return err
	}

	err = json.Unmarshal(b, &database)
	if err != nil {
		return err
	}

	err = checkThumbnails()
	if err != nil {
		return err
	}

	return nil
}

func checkThumbnails() error {
	var errors []error
	log.Println("Checking thumbnails.")
	todoThumbs := make(map[uint64]string, 0)
	availableThumbs := make([]uint64, 0)

	if err := os.MkdirAll("thumbs", 0755); err != nil {
		return err
	}

	log.Println(" - Getting CRC64s.")
	for _, item := range database.Items {
		// Skip webms and gifs, I suppose. Also if thumbnail is defined, skip.
		if item.Ext() == ".webm" || item.Ext() == ".gif" || item.Thumbnail != "" {
			continue
		}
		p := filepath.Join("art", item.File)
		f, err := os.OpenFile(p, os.O_RDONLY, 0)
		defer f.Close()
		if err != nil {
			errors = append(errors, err)
			continue
		}
		h := crc64.New(crc64.MakeTable(crc64.ISO))
		io.Copy(h, f)
		item.checksum = h.Sum64()
		todoThumbs[item.checksum] = p
	}

	log.Println(" - Checking thumbnails for (re)creation.")
	files, err := os.ReadDir("./thumbs")
	if err != nil {
		return err
	}

	for _, e := range files {
		n := strings.TrimSuffix(e.Name(), filepath.Ext(e.Name()))
		crc, err := strconv.ParseUint(n, 10, 64)
		if err != nil {
			errors = append(errors, err)
			continue
		}
		delete(todoThumbs, crc)
		availableThumbs = append(availableThumbs, crc)
	}

	log.Printf(" - Building %d thumbnails.", len(todoThumbs))
	for crc, p := range todoThumbs {
		f, err := os.OpenFile(p, os.O_RDONLY, 0)
		if err != nil {
			errors = append(errors, err)
			continue
		}
		defer f.Close()
		img, _, err := image.Decode(f)
		if err != nil {
			errors = append(errors, err)
			continue
		}

		// Cap to 400 height and shrink others accordingly.
		height := 400
		diff := float64(height) / float64(img.Bounds().Dy())
		if diff < 1.0 {
			width := int(float64(img.Bounds().Dx()) * diff)
			dst := image.NewRGBA(image.Rect(0, 0, width, height))
			draw.CatmullRom.Scale(dst, dst.Bounds(), img, img.Bounds(), draw.Over, nil)

			f, err := os.Create(filepath.Join("thumbs", fmt.Sprintf("%d.jpg", crc)))
			if err != nil {
				errors = append(errors, err)
				continue
			}
			defer f.Close()
			err = jpeg.Encode(f, dst, nil)
			if err != nil {
				errors = append(errors, err)
				continue
			}
			availableThumbs = append(availableThumbs, crc)
		}
	}

	// Assign thumbs.
	for _, crc := range availableThumbs {
		for _, entry := range database.Items {
			if entry.checksum == crc {
				entry.Thumbnail = fmt.Sprintf("%d.jpg", crc)
			}
		}
	}

	if len(errors) > 0 {
		log.Printf(" - %d errors:", len(errors))
		for _, err := range errors {
			log.Println(err)
		}
	}

	return nil
}

func watchDatabase() {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	done := make(chan bool)
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Op&fsnotify.Write == fsnotify.Write {
					loadDatabase()
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					log.Fatal(err)
					return
				}
			}
		}
	}()

	err = watcher.Add("art/gallery.json")
	if err != nil {
		log.Fatal(err)
	}
	<-done
}

func getGalleryItemsFromTags(tags string) []*galleryItem {
	searchTags := strings.Split(tags, "+")
	items := make([]*galleryItem, 0)

	for _, item := range database.Items {
		matches := 0
		for _, searchTag := range searchTags {
			if containsString(searchTag, item.Tags) {
				matches++
			}
		}
		if matches == len(searchTags) {
			if !itemExistsWithin(item, items) {
				items = append(items, item)
			}
		}
	}

	// Now sort by year.
	sort.Slice(items, func(i, j int) bool {
		a, _ := strconv.Atoi(items[i].Year)
		b, _ := strconv.Atoi(items[j].Year)
		return a > b
	})

	return items
}

func containsString(search string, strings []string) bool {
	for _, entry := range strings {
		if entry == search {
			return true
		}
	}
	return false
}

func itemExistsWithin(item *galleryItem, items []*galleryItem) bool {
	for _, entry := range items {
		if item == entry {
			return true
		}
	}
	return false
}
