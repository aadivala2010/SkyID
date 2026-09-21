# SkyID

SkyID is a mobile-first aircraft finder for iPhone. It combines the local camera view, GPS, device orientation, and nearby aircraft positions with geometry—never image recognition or AI.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. On iPhone, use the deployed HTTPS page so camera, location, and motion permissions can work.

## Live data

SkyID uses your current location to request anonymous nearby state vectors from the free OpenSky Network endpoint. There is no simulated traffic or fallback data.

Camera frames stay on the device. Precise location is not stored.

## Checks

```bash
npm test
npm run lint
npm run build
```
