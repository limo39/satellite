package client

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetTLE(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/tle/25544" {
			t.Errorf("Expected path /tle/25544, got %s", r.URL.Path)
		}
		fmt.Fprintln(w, `{"info": {"satid": 25544, "satname": "SPACE STATION"}, "tle": "1 25544U..."}`)
	}))
	defer ts.Close()

	oldBaseURL := baseURL
	baseURL = ts.URL
	defer func() { baseURL = oldBaseURL }()

	c := NewClient("test-api-key")
	tle, err := c.GetTLE(25544)
	if err != nil {
		t.Fatalf("GetTLE failed: %v", err)
	}

	if tle.Info.SatID != 25544 {
		t.Errorf("Expected SatID 25544, got %d", tle.Info.SatID)
	}
}

func TestGetPositions(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		expectedPath := fmt.Sprintf("/positions/25544/40.000000/-74.000000/100.000000/1")
		if r.URL.Path != expectedPath {
			t.Errorf("Expected path %s, got %s", expectedPath, r.URL.Path)
		}
		fmt.Fprintln(w, `{"info": {"satid": 25544}, "positions": [{"satlatitude": 10.0, "satlongitude": 20.0}]}`)
	}))
	defer ts.Close()

	oldBaseURL := baseURL
	baseURL = ts.URL
	defer func() { baseURL = oldBaseURL }()

	c := NewClient("test-api-key")
	positions, err := c.GetPositions(25544, 40.0, -74.0, 100.0, 1)
	if err != nil {
		t.Fatalf("GetPositions failed: %v", err)
	}

	if len(positions.Positions) != 1 {
		t.Errorf("Expected 1 position, got %d", len(positions.Positions))
	}
}
