package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type Borb struct {
	Title string `yaml:"Title"`
	File  string `yaml:"File"`
	DOB   string `yaml:"DOB"`
}

type Borbdex struct {
	Borbs []*Borb `yaml:"Borbs"`
}

func main() {
	if len(os.Args) == 1 {
		fmt.Println("Please provide the borbdex directory path")
		return
	}
	var borbdex Borbdex

	fmt.Println("Reading borbdex (if it exists)")
	b, err := ioutil.ReadFile(filepath.Join(os.Args[1], "borbdex.yaml"))
	if err == nil {
		err = yaml.Unmarshal(b, &borbdex)
		if err != nil {
			log.Fatal(err)
		}
	}
	fmt.Println("Scanning for borb images and adding as borbdex entries if no entry matches the file name.")
	files, err := os.ReadDir(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	added := 0
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".png") {
			continue
		}
		exists := false
		for _, entry := range borbdex.Borbs {
			if entry.File == file.Name() {
				exists = true
				break
			}
		}
		if !exists {
			//info, _ := file.Info()

			borbdex.Borbs = append(borbdex.Borbs, &Borb{
				Title: file.Name()[:len(file.Name())-4],
				File:  file.Name(),
				//DOB:   fmt.Sprintf("%s", info.ModTime()),
			})
			added++
		}
	}

	fmt.Printf("Found %d new borbs!\n", added)

	b, err = yaml.Marshal(&borbdex)
	if err != nil {
		log.Fatal(err)
	}
	err = ioutil.WriteFile(filepath.Join(os.Args[1], "borbdex.yaml"), b, 0755)
	if err != nil {
		log.Fatal(err)
	}
}
