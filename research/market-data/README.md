# Market Data

This directory contains research-only market datasets used for product discovery and planning.

## Contents

- `unegui/`: current extracted listing snapshots and scraper run logs
- `archive/`: historical category snapshots retained for comparison

## Data Handling Rules

- Treat all files here as research inputs, not runtime application data.
- Keep source provenance (origin, scrape date, scope) intact.
- Do not wire these files into production runtime paths.
