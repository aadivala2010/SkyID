# SkyID

SkyID is a mobile-first aircraft finder for iPhone. It combines the local camera view, GPS, device orientation, and nearby aircraft positions with geometry—never image recognition or AI.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Demo Mode works without credentials or internet aircraft data. On iPhone, camera and motion access require a secure HTTPS page.

## Modes

- **Demo:** moving simulated aircraft around the current or simulated location.
- **Live:** anonymous nearby state vectors from the free OpenSky Network endpoint, with an automatic and clearly labeled Demo fallback.

Camera frames stay on the device. Precise location is not stored.

## Checks

```bash
npm test
npm run lint
npm run build
```
