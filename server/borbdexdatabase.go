package main

import (
	"io/ioutil"
	"log"
	"sync"

	"github.com/fsnotify/fsnotify"
	"gopkg.in/yaml.v3"
)

type Borb struct {
	Title string `yaml:"Title"`
	File  string `yaml:"File"`
	DOB   string `yaml:"DOB"`
	ID    string `yaml:"ID"`
}

type Borbdex struct {
	Borbs []*Borb `yaml:"Borbs"`
}

var borbdexLock sync.Mutex
var borbdex Borbdex

func loadBorbdex() error {
	borbdexLock.Lock()
	defer borbdexLock.Unlock()

	log.Println("Loading borbs.")

	b, err := ioutil.ReadFile("borbs/borbdex.yaml")
	if err != nil {
		return err
	}

	err = yaml.Unmarshal(b, &borbdex)
	if err != nil {
		return err
	}

	return nil
}

func watchBorbdex() {
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
					loadBorbdex()
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					log.Fatal(err)
					return
				}
			}
		}
	}()

	err = watcher.Add("borbs/borbdex.yaml")
	if err != nil {
		log.Fatal(err)
	}
	<-done

}
