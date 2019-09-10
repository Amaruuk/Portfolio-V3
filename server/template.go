package main

import (
	"fmt"
	"html/template"
	"log"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
)

var viewTemplate *template.Template
var viewTemplateLock sync.Mutex

func buildTemplates() (err error) {
	viewTemplateLock.Lock()
	defer viewTemplateLock.Unlock()
	fmt.Println("(Re)Building templates.")
	if viewTemplate, err = template.ParseGlob("templates/**.gohtml"); err != nil {
		return err
	}
	return nil
}

func watchTemplates() {
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
					buildTemplates()
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					log.Fatal(err)
					return
				}
			}
		}
	}()

	matches, err := filepath.Glob("templates/**.gohtml")

	if err != nil {
		log.Fatal(err)
	}

	for _, match := range matches {
		if err := watcher.Add(match); err != nil {
			log.Fatal(err)
		}
	}

	<-done
}
