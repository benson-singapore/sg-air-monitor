# SG Air

[简体中文](README.zh-CN.md)

SG Air is a responsive, installable web app for viewing Singapore's latest PM2.5 readings. It shows the national average and readings for the North, South, East, West, and Central regions. Select a regional card to focus the map and main reading on that region; select the main reading to return to the national average.

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

## Project structure

- `src/App.jsx` — data fetching, regional display, and map interactions
- `src/styles.css` — application styles and responsive layout
- `public/manifest.webmanifest` — installable app metadata
- `public/sw.js` — service worker and app-shell caching
