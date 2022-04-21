package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	r := mux.NewRouter()
	// Set up our logic handlers.
	r.HandleFunc("/", splashHandler)
	r.HandleFunc("/gallery", galleryHandler)
	r.HandleFunc("/gallery/", galleryHandler)
	r.HandleFunc("/gallery/{tags}", galleryHandler)
	r.HandleFunc("/gallery/{tags}/", galleryHandler)
	r.HandleFunc("/api/gallery/{tags}", galleryAPIHandler)
	r.HandleFunc("/api/gallery/", galleryAPIHandler)
	r.HandleFunc("/api/gallery", galleryAPIHandler)
	// Set up our static path handlers.
	r.PathPrefix("/art/").Handler(http.StripPrefix("/art/", http.FileServer(http.Dir("./art/"))))
	r.PathPrefix("/thumbs/").Handler(http.StripPrefix("/thumbs/", http.FileServer(http.Dir("./thumbs/"))))
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	h := cors.Default().Handler(r)

	// Build our templates.
	if err := buildTemplates(); err != nil {
		log.Fatal(err)
	}
	// Run our template watcher.
	go watchTemplates()

	// Load our database.
	if err := loadDatabase(); err != nil {
		log.Fatal(err)
	}
	// Run our database file watcher.
	go watchDatabase()

	srv := &http.Server{
		Handler:      h,
		Addr:         "127.0.0.1:8000",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Println("Portfolio v3 now kickin' it.")

	log.Fatal(srv.ListenAndServe())
}
