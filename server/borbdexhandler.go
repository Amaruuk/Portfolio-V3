package main

import (
	"log"
	"net/http"
)

func borbdexHandler(w http.ResponseWriter, r *http.Request) {
	borbdexData := struct {
		Location string
		Borbs    []*Borb
	}{
		Location: "Borbdex",
		Borbs:    borbdex.Borbs,
	}

	if err := viewTemplate.ExecuteTemplate(w, "borbdex", borbdexData); err != nil {
		http.Error(w, "Failed to execute template", http.StatusInternalServerError)
		log.Print(err)
	}
}
