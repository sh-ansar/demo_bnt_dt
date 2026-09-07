export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  res.status(200).json({
    googleMapsApiKey:
      process.env.GOOGLE_MAPS_API_KEY || "",

    googleMapsMapId:
      process.env.GOOGLE_MAPS_MAP_ID ||
      "DEMO_MAP_ID",

    center: {
      lat: 41.6438169,
      lng: 41.6605911
    },

    zoom: 17
  });
}
