---
version: 1
slug: "areconpy-web-frontend-src-app-tsx"
primary_target: "AreconPy-web/frontend/src/App.tsx"
related_targets: []
---

# Surface: BOQ comparison page (upload, run, result)

Mode: Operate. Audience: estimators and tender reviewers checking one tender at a desk. Task: upload a tender
folder or zip, follow a ~6 minute run, read the workbook sheet by sheet, download the Excel file. Constraints:
same sheets, columns and statuses as boq_comparison.xlsx; the machine-read review note always visible; local only;
jobs deleted after 24 h. User sketch: sheet tabs above one framed results area, download above the result.

Unresolved: sign-in, hosting, multi-user job list (later).

## Direction contract

THESIS: The comparison read like a checked tender schedule; it refuses the white-card SaaS table and dashboard tiles.

OWN-WORLD: File-cover buff band (#c8b07e) over a cool near-white ground, ink #1d2230, violet stamp-pad ink #5b3fa6 for state marks and selection, red-tape #b3261e for errors; status fills exactly the workbook's (C6EFCE, DDEBF7, FFEB9C, F2F2F2). Source Sans 3 for everything, tabular numerals; Barlow Condensed caps only inside stamps. Ruled schedule table: 2px ink rule under headers, hairlines between rows, one size, rank by weight and case.

STORY: The reviewer sees which tender this is, that it is machine-read and must be checked, then works through the sheets and takes the Excel file away.

FIRST VIEWPORT: Buff band 72px: product mark, tender name and counts, Download Excel (primary, ink) and Check another tender at right. Under it the violet double-ruled stamp MACHINE-READ · REVIEW BEFORE USE beside one sentence. Sheet tabs with row counts; a search and status/part filters; the table fills the rest, header sticky.

FORM: Stamped Tender Schedule, candidate 5 of 7. seed:47dfa0bfe78d29f4. Signature move: run stages and outcomes as stamp impressions (RECEIVED, READING DRAWINGS, MATCHING, READY FOR REVIEW / RUN FAILED), struck one after another. Raises: one-size table (timetable), tabular data density (datamatics), no card shells (metro), table owns the viewport (feed), failures stamped with their log kept (wallet).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
