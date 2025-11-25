package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/limo39/satellite/client"
)

var n2yoClient *client.Client

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	apiKey := os.Getenv("N2YO_API_KEY")
	if apiKey == "" {
		log.Fatal("N2YO_API_KEY environment variable is required")
	}

	n2yoClient = client.NewClient(apiKey)

	// Serve static files (CSS, JS, images, etc.) with correct MIME types
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Also serve files from root for backward compatibility
	http.HandleFunc("/styles.css", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/styles.css")
	})
	http.HandleFunc("/scripts.js", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/scripts.js")
	})
	http.HandleFunc("/jet.png", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/jet.png")
	})

	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/tle/", handleTLE)
	http.HandleFunc("/positions/", handlePositions)
	http.HandleFunc("/visualpasses/", handleVisualPasses)
	http.HandleFunc("/radiopasses/", handleRadioPasses)
	http.HandleFunc("/above/", handleAbove)

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, "static/index.html")
}

func handleTLE(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/tle/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid satellite ID", http.StatusBadRequest)
		return
	}

	tle, err := n2yoClient.GetTLE(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, tle)
}

func parseCommonParams(r *http.Request) (float64, float64, float64, error) {
	query := r.URL.Query()
	lat, err := strconv.ParseFloat(query.Get("lat"), 64)
	if err != nil {
		return 0, 0, 0, err
	}
	lng, err := strconv.ParseFloat(query.Get("lng"), 64)
	if err != nil {
		return 0, 0, 0, err
	}
	alt, err := strconv.ParseFloat(query.Get("alt"), 64)
	if err != nil {
		return 0, 0, 0, err
	}
	return lat, lng, alt, nil
}

func handlePositions(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/positions/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid satellite ID", http.StatusBadRequest)
		return
	}

	lat, lng, alt, err := parseCommonParams(r)
	if err != nil {
		http.Error(w, "Invalid parameters: lat, lng, alt are required", http.StatusBadRequest)
		return
	}

	secStr := r.URL.Query().Get("sec")
	sec, err := strconv.Atoi(secStr)
	if err != nil {
		sec = 1 // Default to 1 second
	}

	positions, err := n2yoClient.GetPositions(id, lat, lng, alt, sec)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, positions)
}

func handleVisualPasses(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/visualpasses/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid satellite ID", http.StatusBadRequest)
		return
	}

	lat, lng, alt, err := parseCommonParams(r)
	if err != nil {
		http.Error(w, "Invalid parameters: lat, lng, alt are required", http.StatusBadRequest)
		return
	}

	daysStr := r.URL.Query().Get("days")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 1
	}

	minVisStr := r.URL.Query().Get("min_vis")
	minVis, err := strconv.Atoi(minVisStr)
	if err != nil {
		minVis = 1
	}

	passes, err := n2yoClient.GetVisualPasses(id, lat, lng, alt, days, minVis)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, passes)
}

func handleRadioPasses(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/radiopasses/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid satellite ID", http.StatusBadRequest)
		return
	}

	lat, lng, alt, err := parseCommonParams(r)
	if err != nil {
		http.Error(w, "Invalid parameters: lat, lng, alt are required", http.StatusBadRequest)
		return
	}

	daysStr := r.URL.Query().Get("days")
	days, err := strconv.Atoi(daysStr)
	if err != nil {
		days = 1
	}

	minElStr := r.URL.Query().Get("min_el")
	minEl, err := strconv.Atoi(minElStr)
	if err != nil {
		minEl = 10
	}

	passes, err := n2yoClient.GetRadioPasses(id, lat, lng, alt, days, minEl)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, passes)
}

func handleAbove(w http.ResponseWriter, r *http.Request) {
	lat, lng, alt, err := parseCommonParams(r)
	if err != nil {
		http.Error(w, "Invalid parameters: lat, lng, alt are required", http.StatusBadRequest)
		return
	}

	catStr := r.URL.Query().Get("cat")
	cat, err := strconv.Atoi(catStr)
	if err != nil {
		cat = 0 // Default category
	}

	radiusStr := r.URL.Query().Get("radius")
	radius, err := strconv.Atoi(radiusStr)
	if err != nil {
		radius = 90 // Default radius
	}

	above, err := n2yoClient.GetAbove(lat, lng, alt, cat, radius)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, above)
}
