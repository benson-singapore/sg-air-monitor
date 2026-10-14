<p align="center">
  <img src="public/sg-air-lockup.png" alt="SG Air logo" width="180" />
</p>

<h1 align="center">SG Air</h1>

<p align="center">Singapore PM2.5, at a glance.</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=20232A" alt="React" />
  <img src="https://img.shields.io/badge/Vite-Tooling-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/D3.js-Maps-F9A03C?logo=d3.js&logoColor=white" alt="D3.js" />
  <img src="https://img.shields.io/badge/Web-PWA-2563EB" alt="Web and PWA" />
  <a href="https://data.gov.sg/"><img src="https://img.shields.io/badge/Data.gov.sg-PM2.5-15803D" alt="Singapore Data.gov.sg PM2.5" /></a>
</p>

<p align="center"><a href="README.zh-CN.md">简体中文</a></p>

SG Air is a responsive air-quality dashboard for checking the latest PM2.5 readings across Singapore. It brings the national average, five regional readings, and a geographic overview together in a compact interface designed for quick checks on mobile and desktop.

The experience pairs clear numeric readings with regional status labels, a color-coded map, and a calm glass-panel visual style. Its SG Air identity is carried through a custom SVG mark and a coordinated set of browser, PWA, and Apple touch icons.

## Highlights

- **National and regional overview:** See the national average alongside readings for the North, South, East, West, and Central regions.
- **Interactive regional map:** Select a regional card to focus the main reading and map marker on that area. Select the main reading to return to the national view.
- **At-a-glance status:** Readings are grouped into Normal, Elevated, High, and Very High bands. Map colors, status chips, and the page theme respond to the selected reading.
- **Responsive interface:** The dashboard adapts to narrow screens and larger displays, with compact region cards and a dedicated national summary.
- **Clear connection state:** Loading, syncing, and offline states help explain when readings are being retrieved or unavailable.
- **Installable and resilient shell:** A web manifest and service worker support home-screen installation and cache the app shell for return visits. Live readings still require a network connection.

## Data

Readings come from the [Singapore Government Data API](https://api.data.gov.sg/v1/environment/pm25). The app refreshes automatically every 15 minutes and also provides a manual refresh button. Display times use Singapore time. When the API does not provide a national reading, the app calculates an average from the available regional readings.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

To create and preview a production build:

```sh
npm run build
npm run preview
```

## Install as an app

The app includes a web manifest and service worker. Open it in a supported browser and use the browser's **Install app** or **Add to Home Screen** option. Previously loaded app files can be served from cache when offline; live PM2.5 readings still require a network connection.

## Brand and app icons

SG Air uses a small, coordinated icon set so its identity stays recognizable in the page header, browser chrome, and on a device home screen:

- `public/icons/air-logo.svg` — scalable SVG mark used in the dashboard header and as the SVG favicon
- `public/icons/sg-air-icon-192.png` — standard 192 × 192 browser and app icon
- `public/icons/sg-air-icon-512.png` — 512 × 512 PWA icon, configured for standard and maskable use
- `public/icons/apple-touch-icon.png` — icon for adding SG Air to an Apple device's home screen
- `public/sg-air-lockup.png` — SG Air logo lockup asset
- `public/icons/sg-air-icon-source.png` — source artwork for the app icon
- `docs/sg-air-logo-options.png` — logo direction reference sheet

## Project structure

- `src/App.jsx` — data fetching, regional display, and map interactions
- `src/styles.css` — application styles and responsive layout
- `public/manifest.webmanifest` — installable app metadata
- `public/sw.js` — service worker and app-shell caching
