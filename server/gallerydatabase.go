package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
)

type galleryItem struct {
	Title       string
	Description string
	File        string
	Year        string
	Tags        []string
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
