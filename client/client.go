package client

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var baseURL = "https://api.n2yo.com/rest/v1/satellite"

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) get(path string, target interface{}) error {
	url := fmt.Sprintf("%s%s&apiKey=%s", baseURL, path, c.apiKey)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API request failed with status: %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

func (c *Client) GetTLE(id int) (*TLE, error) {
	var result TLE
	err := c.get(fmt.Sprintf("/tle/%d", id), &result)
	return &result, err
}

func (c *Client) GetPositions(id int, lat, lng, alt float64, sec int) (*SatellitePositions, error) {
	var result SatellitePositions
	path := fmt.Sprintf("/positions/%d/%f/%f/%f/%d", id, lat, lng, alt, sec)
	err := c.get(path, &result)
	return &result, err
}

func (c *Client) GetVisualPasses(id int, lat, lng, alt float64, days, minVis int) (*VisualPasses, error) {
	var result VisualPasses
	path := fmt.Sprintf("/visualpasses/%d/%f/%f/%f/%d/%d", id, lat, lng, alt, days, minVis)
	err := c.get(path, &result)
	return &result, err
}

func (c *Client) GetRadioPasses(id int, lat, lng, alt float64, days, minEl int) (*RadioPasses, error) {
	var result RadioPasses
	path := fmt.Sprintf("/radiopasses/%d/%f/%f/%f/%d/%d", id, lat, lng, alt, days, minEl)
	err := c.get(path, &result)
	return &result, err
}

func (c *Client) GetAbove(lat, lng, alt float64, cat, radius int) (*Above, error) {
	var result Above
	path := fmt.Sprintf("/above/%f/%f/%f/%d/%d", lat, lng, alt, cat, radius)
	err := c.get(path, &result)
	return &result, err
}
