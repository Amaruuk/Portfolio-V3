package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func galleryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	items := getGalleryItemsFromTags(vars["tags"])

	templateData := struct {
		Location     string
		GalleryItems []*galleryItem
	}{
		Location:     "Gallery",
		GalleryItems: items,
	}

	if err := viewTemplate.ExecuteTemplate(w, "view", templateData); err != nil {
		http.Error(w, "Failed to execute template", http.StatusInternalServerError)
		log.Print(err)
	}
}

func galleryAPIHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	items := getGalleryItemsFromTags(vars["tags"])

	if err := viewTemplate.ExecuteTemplate(w, "gallery", items); err != nil {
		http.Error(w, "Failed to execute template", http.StatusInternalServerError)
		log.Print(err)
	}
}
