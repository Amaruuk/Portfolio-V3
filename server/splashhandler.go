package main

import (
	"log"
	"net/http"
)

func splashHandler(w http.ResponseWriter, r *http.Request) {
	templateData := struct {
		Location string
	}{
		Location: "Splash",
	}

	if err := viewTemplate.ExecuteTemplate(w, "view", templateData); err != nil {
		http.Error(w, "Failed to execute template", http.StatusInternalServerError)
		log.Print(err)
	}
}
