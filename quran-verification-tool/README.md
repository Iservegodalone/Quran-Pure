# Quran Verification Tool

Ein webbasiertes Werkzeug zur visuellen Verifikation von Quran-Textpassagen gegen PDF-Quelldokumente. Bild-Schnipsel werden auf gerenderte PDF-Seiten gelegt und pixelgenau verglichen, um Uebereinstimmungen und Abweichungen farblich hervorzuheben.

## Features

- **PDF-Anzeige** -- PDF-Dateien laden, Seiten navigieren, zoomen und pannen
- **Schnipsel-Verwaltung** -- Bild-Schnipsel hochladen, frei positionieren, skalieren und sperren
- **Verifikationsmodus** -- Pixel-fuer-Pixel-Vergleich zwischen PDF-Inhalt und Schnipseln:
  - Lila: uebereinstimmende Textpixel
  - Blau: nur im PDF vorhanden
  - Rot: nur im Schnipsel vorhanden
- **Transparenzregler** -- Globale Deckkraft der Schnipsel stufenlos anpassen
- **Sitzung speichern/laden** -- Gesamten Arbeitsstand als JSON-Datei exportieren und wieder importieren

## Tech Stack

- React 19 + TypeScript
- Vite
- pdf.js (PDF-Rendering)

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Oeffnet den Vite-Dev-Server mit Hot Module Replacement.

## Build

```bash
npm run build
```

Kompiliert TypeScript und erstellt den Produktions-Build im `dist/`-Verzeichnis.

```bash
npm run preview
```

Startet eine lokale Vorschau des Produktions-Builds.

## Benutzung

1. **PDF laden** -- Klick auf *PDF laden* und eine PDF-Datei auswaehlen
2. **Schnipsel hochladen** -- Klick auf *Schnipsel* und ein oder mehrere Bilder auswaehlen
3. **Positionieren** -- Schnipsel per Drag & Drop auf der PDF-Seite platzieren, mit den Anfassern skalieren
4. **Sperren** -- Schloss-Symbol klicken, um versehentliches Verschieben zu verhindern
5. **Verifizieren** -- *Verifikation*-Schalter aktivieren, um den farbcodierten Abgleich zu sehen
6. **Speichern** -- *Speichern* exportiert die gesamte Sitzung als JSON; *Laden* stellt sie wieder her

## Projektstruktur

```
src/
  App.tsx              Hauptkomponente mit State-Management
  types.ts             TypeScript-Interfaces (SnippetData, SaveState)
  components/
    Toolbar.tsx        Werkzeugleiste (Dateioperationen, Navigation, Verifikation)
    Workspace.tsx      Canvas-Bereich mit PDF-Rendering und Verifikationslogik
    SnippetOverlay.tsx Einzelner Schnipsel mit Drag/Resize-Handles
```

## Lizenz

Privat -- nicht zur Weiterverbreitung bestimmt.
