# AreconPy-web — BOQ check page

The web page for the drawing-to-BOQ comparison: upload a tender folder or .zip, follow the run, view the
comparison workbook sheet by sheet and download the Excel file. React + TypeScript (Vite).

This repository is the **frontend only**. The comparison and its API live in the **AreconPy** repository
(`areconpy-web`); the page calls it over HTTP. The two are started and deployed separately.

## Run locally

Start the API first, in the AreconPy repository:

```bash
.venv/Scripts/areconpy-web          # http://127.0.0.1:8000
```

Then the page, here:

```bash
npm install                         # once
npm start                           # http://localhost:5173; /api calls go to the API
```

## Build for hosting

```bash
npm run build                       # writes dist/: static files for any static host
npm run preview                     # serves dist/ locally on http://localhost:4173 to check it
```

Settings (see `.env.example`; copy it to `.env`, which is not committed):

- `VITE_API_URL`: the API's address when the page is hosted at a different address, e.g.
  `https://boq-api.example.com`. Read at build time. Leave empty when one address serves both (a reverse
  proxy sending `/api` to the API). On the API side, add the page's address to `ARECON_WEB_ORIGINS`.
- `ARECON_API`: where `npm start` and `npm run preview` pass `/api` locally (default http://127.0.0.1:8000).

The page needs nothing else from the server: fonts and icons are bundled, nothing is fetched from outside.

## What the page does

- Upload: drop or pick a folder (Chrome/Edge folder upload) or a .zip; upload progress.
- Run: stages shown as stamps (Received, Reading drawings, Matching, Ready for review), elapsed time; a failed
  run shows its error and the end of its log. The job id is in the address, so a refresh reopens it.
- Result: one tab per workbook sheet with row counts, search, status and part filters, sticky header, the item
  column pinned while scrolling sideways, rows expand on click; Download Excel above; drawings the run could
  not read are listed under a "Drawings not read" stamp. A "machine-read, review before use" note is always
  shown.

## Layout

```
src/
  api.ts          API calls (base address from VITE_API_URL)
  App.tsx         upload -> run -> result, job id in the address
  UploadPanel.tsx folder / .zip picking and dropping
  RunPanel.tsx    run stages as stamps, failure with log
  SheetTable.tsx  one sheet: filters, table, row expansion
  styles.css      all design tokens and styles (see ../DESIGN.md)
.impeccable/      design direction notes (not shipped to the browser)
```

Design system: `DESIGN.md` beside this repository (`Desktop\AreconAi\DESIGN.md`). Licences: React and Vite
(MIT), Lucide icons (ISC), Source Sans 3 and Barlow Condensed fonts (SIL OFL), all bundled.
