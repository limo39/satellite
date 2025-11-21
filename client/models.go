package client

type Info struct {
	SatID             int    `json:"satid"`
	SatName           string `json:"satname"`
	TransactionsCount int    `json:"transactionscount"`
	PassesCount       int    `json:"passescount,omitempty"`
	Category          string `json:"category,omitempty"`
	SatCount          int    `json:"satcount,omitempty"`
}

type TLE struct {
	Info Info   `json:"info"`
	TLE  string `json:"tle"`
}

type Position struct {
	SatLatitude  float64 `json:"satlatitude"`
	SatLongitude float64 `json:"satlongitude"`
	SatAltitude  float64 `json:"sataltitude"`
	Azimuth      float64 `json:"azimuth"`
	Elevation    float64 `json:"elevation"`
	RA           float64 `json:"ra"`
	Dec          float64 `json:"dec"`
	Timestamp    int64   `json:"timestamp"`
}

type SatellitePositions struct {
	Info      Info       `json:"info"`
	Positions []Position `json:"positions"`
}

type Pass struct {
	StartAz        float64 `json:"startAz"`
	StartAzCompass string  `json:"startAzCompass"`
	StartEl        float64 `json:"startEl,omitempty"`
	StartUTC       int64   `json:"startUTC"`
	MaxAz          float64 `json:"maxAz"`
	MaxAzCompass   string  `json:"maxAzCompass"`
	MaxEl          float64 `json:"maxEl,omitempty"`
	MaxUTC         int64   `json:"maxUTC"`
	EndAz          float64 `json:"endAz"`
	EndAzCompass   string  `json:"endAzCompass"`
	EndEl          float64 `json:"endEl,omitempty"`
	EndUTC         int64   `json:"endUTC"`
	Mag            float64 `json:"mag,omitempty"`
	Duration       int     `json:"duration,omitempty"`
}

type VisualPasses struct {
	Info   Info   `json:"info"`
	Passes []Pass `json:"passes"`
}

type RadioPasses struct {
	Info   Info   `json:"info"`
	Passes []Pass `json:"passes"`
}

type SatelliteAbove struct {
	SatID         int     `json:"satid"`
	SatName       string  `json:"satname"`
	IntDesignator string  `json:"intDesignator"`
	LaunchDate    string  `json:"launchDate"`
	SatLat        float64 `json:"satlat"`
	SatLng        float64 `json:"satlng"`
	SatAlt        float64 `json:"satalt"`
}

type Above struct {
	Info  Info             `json:"info"`
	Above []SatelliteAbove `json:"above"`
}
