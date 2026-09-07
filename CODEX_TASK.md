# BNT Enterprise — Codex implementation task

## Goal
Refactor the current BNT prototype into a coherent multi-page static web application that deploys cleanly to Vercel. Preserve the working Report Studio v5 functionality and integrate it into the new shell instead of replacing it with empty/demo pages.

The dispatcher/digital-twin page is the only page that should contain Google Maps. Other modules must open as their own real pages/routes and must not be simulated via query-string click hacks.

## Current problems to fix
1. Navigation is structurally broken: links from the dispatcher jump to `/?module=...` and depend on DOM text matching. Remove this router hack.
2. The dispatcher map is visually overloaded: too many tank circles at low zoom, misaligned polygons, and labels overlap the satellite imagery.
3. Some map geometry is calibrated from screen pixels instead of real coordinates. In Google Maps mode, all visible objects must be native Google Maps overlays (`Circle`, `Polygon`, `Polyline`, `Marker`/`AdvancedMarkerElement`) anchored to lat/lng so they stay in place on pan/zoom.
4. The digital twin must be map-only. Analytics, equipment, TOiR, logistics, procurement, reports, templates, builder, data, mailings and sync must each be separate page modules.
5. The old Report Studio v5 is known-good and must be preserved. Do not rewrite it blindly. Reuse/adapt its working code.
6. Avoid dead buttons, `alert()` placeholders, and navigation that reloads into an empty page.
7. All pages must share one consistent shell/design system: sidebar, topbar, cards, typography, status badges, tables, buttons, responsive behavior.
8. Static deployment to Vercel must work without a backend. Google Maps key may come from `/api/config` on Vercel; fallback must still render a useful map preview when key is missing.

## Required target pages
Use actual pages, not query-parameter routing:

- `/index.html` -> executive/management landing or redirect to dispatcher
- `/dispatcher.html` -> digital twin + Google Maps only
- `/equipment.html` -> equipment list, filters, asset cards, drill-down
- `/equipment-detail.html?id=...` -> asset passport / metrics / linked nodes / history / costs / predictive block
- `/analytics.html` -> predictive analytics, risk ranking, scenario comparison, what-if
- `/toir.html` -> TOiR forms and work orders
- `/logistics.html` -> wagon supply, incoming volumes, capacity constraints, downtime avoidance
- `/procurement.html` -> critical spares, warehouse coverage, tenders, suppliers
- `/reports.html` -> Report Studio v5 reports
- `/templates.html` -> Report Studio v5 templates
- `/builder.html` -> Report Studio v5 report builder
- `/data.html` -> Report Studio v5 data module
- `/mailings.html` -> Report Studio v5 schedules/mailings
- `/sync.html` -> Report Studio v5 synchronization

With `cleanUrls: true`, Vercel can expose these without `.html` while keeping static HTML internally.

## Shared structure
Create/normalize:

```
assets/
  css/
    tokens.css
    layout.css
    components.css
    pages/
  js/
    shell.js
    navigation.js
    ui.js
    data/
    pages/
      dispatcher.js
      equipment.js
      analytics.js
      toir.js
      logistics.js
      procurement.js
      reports.js
  images/
  icons/
legacy/
  report-studio-v5/
docs/
```

Do not duplicate large CSS blocks per page. Create shared tokens/layout/components and page-level CSS only where needed.

## Dispatcher requirements
The dispatcher page must look like a professional enterprise operations center, but remain readable.

### Google Maps
Use the terminal location centered around:
- lat: `41.6438169`
- lng: `41.6605911`
- satellite map

Map behavior:
- native Google overlays in API mode
- circles/polygons/markers scale naturally with map zoom
- cluster or hide minor labels at lower zoom
- show more detail progressively at higher zoom

Suggested zoom logic:
- zoom <= 16: show only major zones + 5–8 critical facility markers
- zoom 17–18: show tank park boundaries, main tanks, pump stations, rail rack, warehouse, pier, primary pipeline routes
- zoom >= 19: show all tank outlines, tank IDs, valves, cabinets, sensors, maintenance markers

### Layer controls
Each must really toggle a dedicated overlay group:
- Zones
- Tanks
- Pipelines
- Equipment
- Risks
- TOiR
- Logistics
- Procurement / critical spares

### Map overlays
Use visually conservative outlines:
- tank circles: thin cyan/blue line, low fill opacity
- only high-risk tanks get red outline
- section polygons: low opacity, no thick giant rectangles cutting unrelated areas
- pipelines: 3–5 px; animated flow is acceptable but subtle
- markers: compact, with labels shown only when appropriate for current zoom

### Object interaction
Clicking an object opens a right-side drawer only for quick context:
- name/status
- load
- wear
- downtime risk
- next TO
- repair cost
- predictive recommendation
- links to full pages: Equipment detail / Analytics / TOiR / Procurement

Full modules must open as their own pages.

## Equipment requirements
Preserve/reference the existing prototype behavior:
- asset list with filters
- all-assets table
- location/category/status/internal no./age/last service/next service filters
- asset passport
- photo
- linked nodes
- accumulated repair spend
- repair history
- next TO
- predictive repair date
- wear based on actual workload

Use realistic demo assets: pump N-101, N-102, valves, cabinet, tank P-3, compressor, loading stand, sensor.

## Analytics requirements
Must be an independent page with readable typography.
Include:
- downtime forecast
- top equipment risk ranking
- predicted repair windows
- wear by workload
- maintenance budget forecast
- availability forecast
- planned incoming volumes vs available tank capacity
- scenarios:
  - baseline
  - +12% throughput
  - transfer some wagons
  - delayed critical spares
  - combine repair windows
- what-if interactions

## Logistics requirements
Independent page:
- weekly wagon plan
- confirmed/in-transit/unloading/planned
- incoming volume by product
- tank free capacity
- queue forecast
- warnings when planned incoming volume creates downtime/capacity risk
- scenario actions that visibly update KPIs/table state

## Procurement requirements
Independent page:
- critical spare parts
- current stock / minimum stock
- lead time
- linked equipment
- risk impact
- open tenders
- suppliers
- warehouse coverage
- recommended urgent purchasing actions

## TOiR requirements
Independent page. Forms are a module, not the entire product.
Include working prototype forms/modals for:
- new asset
- repair request
- work order
- repair history filter
- spare parts
- repair quality
- employee rating

## Report Studio v5 integration
A folder containing the old working v5 report prototype will be placed in this repository. Detect it and preserve its working logic.

Do not simply iframe the entire old app as the final solution unless necessary as a temporary step. Prefer to extract/reuse its report data, tables, filters, templates and builder behavior inside the shared new shell.

At minimum, reports/templates/builder/data/mailings/sync must all work after the refactor.

## Data and state
Use shared demo-data JS/JSON modules. Avoid copy-pasted hardcoded duplicate values across pages.

Recommended:
- `assets/js/data/assets.js`
- `assets/js/data/operations.js`
- `assets/js/data/scenarios.js`
- `assets/js/data/procurement.js`
- `assets/js/data/logistics.js`

## Navigation
No `module-router.js` DOM-text matching in final code.
No `/?module=...` navigation.
Use explicit relative/absolute page links.

Examples:
- Dispatcher -> `/dispatcher`
- Analytics -> `/analytics`
- Equipment -> `/equipment`
- Reports -> `/reports`

## Vercel
Keep static deployment simple.
Suggested `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {"source":"/dispatcher","destination":"/dispatcher.html"},
    {"source":"/equipment","destination":"/equipment.html"},
    {"source":"/analytics","destination":"/analytics.html"},
    {"source":"/toir","destination":"/toir.html"},
    {"source":"/logistics","destination":"/logistics.html"},
    {"source":"/procurement","destination":"/procurement.html"},
    {"source":"/reports","destination":"/reports.html"},
    {"source":"/templates","destination":"/templates.html"},
    {"source":"/builder","destination":"/builder.html"},
    {"source":"/data","destination":"/data.html"},
    {"source":"/mailings","destination":"/mailings.html"},
    {"source":"/sync","destination":"/sync.html"}
  ]
}
```

Keep `/api/config` for Google Maps config if already present.

## Quality bar / acceptance criteria
Before finishing:
1. Every sidebar item opens a real page and never throws the user into an empty state.
2. Browser refresh on every page still works.
3. No console errors during normal navigation.
4. Google Maps page remains usable at zoom 16–21.
5. Native overlays remain geographically anchored while panning/zooming.
6. No tank-circle spam at low zoom.
7. Typography is readable on 1440p and 1920p screens.
8. No accidental horizontal scroll.
9. No hidden/dead buttons for primary actions.
10. Report Studio v5 functions still work.
11. `node --check` succeeds on JS files where applicable.
12. `vercel dev` serves every target route.
13. The app feels like one product, not unrelated demos.

## Implementation order
1. Inventory the repository and identify current app + legacy v5 folder.
2. Create shared shell/design tokens.
3. Create real page files/routes.
4. Move dispatcher-only map code to dispatcher page.
5. Fix Google overlay architecture and zoom-dependent visibility.
6. Restore/adapt Report Studio v5 pages.
7. Connect equipment/analytics/TOiR/logistics/procurement pages.
8. Remove query-router hacks and dead code only after real links work.
9. Run a route/navigation/console regression pass.
10. Commit as a coherent refactor.

## Important constraints
- Do not delete working legacy functionality just to simplify the codebase.
- Do not convert this into a backend-heavy application.
- Do not invent a geodetically exact plant layout; visually inferred tank geometry is prototype-only.
- Preserve the current clean white/blue enterprise visual language, but reduce visual clutter on the map.
