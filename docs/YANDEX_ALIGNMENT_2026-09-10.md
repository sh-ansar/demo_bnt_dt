# Digital twin: screenshot alignment, 2026-09-10

Source: the owner's uploaded 1216 x 730 Yandex satellite screenshot and the coordinate chain in the supplied map URL. The live Yandex page was not available to the inspection tool. The screenshot is a reference, not a texture downloaded at runtime.

## Geometry and scale

`assets/3d/site-plan.js` is the common plan data: 80 modeled circular tank footprints, 24 principal building footprints, 15 tank-park envelopes, roads, shoreline and selected-area outline. These counts describe the visualization, not a verified asset inventory. Existing tank IDs 1-55 and P-3/pump registry links are retained; added footprints get new IDs. The selected-area outline is not a surveyed property or security boundary.

Eight visible vertices of the supplied coordinate chain were fitted against screenshot pixels. The fit residual is approximately 0.38 screenshot pixels, which measures the calibration fit, not real-world survey accuracy. Local scale is approximately 1.785 m/pixel east-west and 1.795 m/pixel north-south. All plan geometry uses 0.25 scene units per metre.

Rail tank cars are modeled at approximately 12 m long and 3.12 m wide; road tankers at approximately 10.7 m long and 2.6 m body width. The rail gauge is represented at approximately 1.52 m. These are illustrative vehicle dimensions, not assertions about the vehicles photographed on site. The moving consist stays on its route and reverses instead of splitting across a wraparound boundary.

## Deliberate approximations

Building heights, building-use labels, tank heights, detailed facades, equipment positions and process-pipe connections are illustrative. A top-down screenshot does not establish those facts. Cards explicitly mark estimated building heights and ask for passport verification. The scene is an interactive procedural model, not photogrammetry, BIM, a surveyed as-built model or an operational control system.

Surface textures are deterministic local procedural textures. No external satellite tiles or texture service is requested at runtime. Tank fill remains a demo-only visual adjustment, with a cutaway shell on selection; it does not modify the underlying asset registry.

## Validation before publication

The updated `node tests/dispatcher-3d.test.mjs` runs on Node 24+. It exercises the actual Three.js scene with an injected non-GPU renderer: hierarchy selections, finite camera positions, unrelated equipment visibility, empty/full fill, pump raycasting and cleanup.

A Chromium browser run additionally rendered the scene, exercised the sidebar and 0/100 percent fill, and reported no page errors or console errors in that run. Desktop and 390-pixel mobile layouts were inspected; the mobile page had no horizontal overflow. These checks do not establish performance on every device or engineering accuracy.

Entry point: `/digital-twin`; the existing `/dispatcher` redirect is retained. `План участка` provides a north-up overview for comparison with the reference image. Other business modules and their data are not changed by this release.
