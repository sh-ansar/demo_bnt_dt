# Diagnostic notes from the current dispatcher screenshot

The current dispatcher is a useful visual proof of concept, but it should not be treated as the final application architecture.

## Main visible issues
- Multiple section polygons are too large and visually cut across unrelated roads/buildings.
- Tank circles are all visible at once, producing excessive clutter at the current zoom.
- Several circles/markers are clearly not centered on the physical tanks they are meant to represent.
- Large thick route lines dominate the map and compete with labels and operational markers.
- Risk rings, tank circles and facility labels all use similar visual priority, so the eye has no hierarchy.
- Bottom KPI cards cover a significant portion of the site and reduce usable map area.
- The current page contains navigation for all modules although only the dispatcher/map is actually implemented there.
- The real application modules should live on separate pages.

## Corrective principles
- Use zoom-dependent level of detail.
- Keep low-opacity section boundaries.
- Show only critical asset labels at medium zoom.
- Reveal tank IDs and minor equipment at high zoom.
- Keep Google Maps native geometry tied to lat/lng.
- Use the drawer only as a quick inspection tool; full modules must open separately.
