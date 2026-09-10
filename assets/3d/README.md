# Dispatcher 3D integration

Source scene: https://batumi-terminal-3d.spry-tide-6642.chatgpt.site/
Imported 2026-09-10 at the project owner's request. The scene and its Three.js dependencies are self-hosted. No requests to the source site occur at runtime.

`terminal-scene.js` preserves the supplied model geometry and animation, and mounts it into a container using ResizeObserver. `hierarchy.js` builds the navigation tree. `dispatcher-3d.js` drives the shared side panel and keeps selection, camera focus, highlighting and URL in sync.

Zones and equipment placement are illustrative. Registered assets reuse `BNT_DATA.assets` without changing their metrics. Other tanks and equipment are explicitly marked as demonstration entities and do not link to fabricated passports. P-3 is mapped to model tank 3 for this demo. Zone membership and pump positioning require validation against a real plant register before operational use. Fill sliders only alter scene memory; they do not change the registry.

Three.js and OrbitControls are MIT licensed (see vendor/LICENSE). Vendor modules are the exact versions served with the source model; retain them as a matched set.

Entry: `/dispatcher`. Deep link example: `/dispatcher?object=pump101`.

Validation: JavaScript syntax checks; 22 HTTP route/dependency smoke checks; hierarchy integrity, unique paths, 55 tank nodes, registry values and P-3 to pump/valve links checked. Browser verification is recorded in the delivery report.
