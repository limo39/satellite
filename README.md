# 🛰️ Satellite Tracker

Real-time 3D satellite tracking with interactive Earth visualization.

## Setup

1. Get an API key from [n2yo.com/api](https://n2yo.com/api)

2. Create `.env` file:
```bash
echo "N2YO_API_KEY=your-api-key-here" > .env
```

3. Run the server:
```bash
go run main.go
```

4. Open `http://localhost:8080`

## Features

- 🌍 Interactive 3D Earth globe
- 🛰️ Real-time satellite positions
- 🎮 Mouse controls (drag to rotate, scroll to zoom)
- 📡 Track multiple satellites simultaneously

## API Endpoints

- `GET /tle/{id}` - Satellite TLE data
- `GET /positions/{id}` - Future positions
- `GET /visualpasses/{id}` - Visual passes
- `GET /radiopasses/{id}` - Radio passes
- `GET /above` - Satellites above location

## Tech Stack

Go, Three.js, N2YO API