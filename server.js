const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);

const PORT =
  Number(process.env.PORT || 8080);

const ROUTES = {
  "/": "dispatcher.html",

  "/dispatcher": "dispatcher.html",

  // backwards compatibility only
  "/digital-twin": "dispatcher.html",

  "/equipment": "equipment.html",
  "/equipment-detail": "equipment-detail.html",

  "/analytics": "analytics.html",

  "/toir": "toir.html",

  "/logistics": "logistics.html",

  "/procurement": "procurement.html",

  "/reports": "reports.html",

  "/templates": "templates.html",

  "/builder": "builder.html",

  "/data": "data.html",

  "/mailings": "mailings.html",

  "/sync": "sync.html"
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data));
}

function loadConfig() {

  const localConfig =
    path.join(
      ROOT,
      "config.local.json"
    );

  let config = {
    googleMapsApiKey: "",
    googleMapsMapId: "DEMO_MAP_ID",

    center: {
      lat: 41.6438169,
      lng: 41.6605911
    },

    zoom: 17
  };

  if (
    fs.existsSync(localConfig)
  ) {

    try {

      config = {
        ...config,
        ...JSON.parse(
          fs.readFileSync(
            localConfig,
            "utf8"
          )
        )
      };

    }
    catch (error) {

      console.error(
        "config.local.json:",
        error.message
      );
    }
  }

  if (
    process.env.GOOGLE_MAPS_API_KEY
  ) {
    config.googleMapsApiKey =
      process.env.GOOGLE_MAPS_API_KEY;
  }

  if (
    process.env.GOOGLE_MAPS_MAP_ID
  ) {
    config.googleMapsMapId =
      process.env.GOOGLE_MAPS_MAP_ID;
  }

  return config;
}

function safeFilePath(requestPath) {

  const decoded =
    decodeURIComponent(
      requestPath
    );

  const relative =
    decoded.replace(
      /^\/+/,
      ""
    );

  const resolved =
    path.resolve(
      ROOT,
      relative
    );

  if (
    !resolved.startsWith(ROOT)
  ) {
    return null;
  }

  return resolved;
}

function serveFile(
  filePath,
  res
) {

  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {

    res.writeHead(
      404,
      {
        "Content-Type":
          "text/plain; charset=utf-8"
      }
    );

    res.end(
      "404 Not Found"
    );

    return;
  }

  const stat =
    fs.statSync(filePath);

  if (
    stat.isDirectory()
  ) {

    const index =
      path.join(
        filePath,
        "index.html"
      );

    if (
      fs.existsSync(index)
    ) {
      return serveFile(
        index,
        res
      );
    }

    res.writeHead(404);
    res.end("404 Not Found");

    return;
  }

  const ext =
    path.extname(
      filePath
    )
    .toLowerCase();

  res.writeHead(
    200,
    {
      "Content-Type":
        MIME[ext] ||
        "application/octet-stream",

      "Cache-Control":
        ext === ".html"
          ? "no-store"
          : "public, max-age=60"
    }
  );

  fs.createReadStream(
    filePath
  )
  .pipe(res);
}

const server =
  http.createServer(
    (req, res) => {

      try {

        const url =
          new URL(
            req.url,
            `http://${req.headers.host || "localhost"}`
          );

        let pathname =
          url.pathname;

        // -----------------------------------
        // Runtime configuration
        // -----------------------------------

        if (
          pathname ===
          "/api/config"
        ) {

          return sendJson(
            res,
            200,
            loadConfig()
          );
        }


        // -----------------------------------
        // Clean application routes
        // -----------------------------------

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              ROUTES,
              pathname
            )
        ) {

          return serveFile(
            path.join(
              ROOT,
              ROUTES[pathname]
            ),
            res
          );
        }


        // -----------------------------------
        // Also support /analytics/
        // -----------------------------------

        if (
          pathname.length > 1 &&
          pathname.endsWith("/")
        ) {

          const clean =
            pathname.slice(
              0,
              -1
            );

          if (
            Object.prototype
              .hasOwnProperty
              .call(
                ROUTES,
                clean
              )
          ) {

            return serveFile(
              path.join(
                ROOT,
                ROUTES[clean]
              ),
              res
            );
          }
        }


        // -----------------------------------
        // Static files
        // -----------------------------------

        const filePath =
          safeFilePath(
            pathname
          );

        return serveFile(
          filePath,
          res
        );

      }
      catch (error) {

        console.error(error);

        res.writeHead(
          500,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end(
          "500 Internal Server Error"
        );
      }
    }
  );


server.on(
  "error",
  error => {

    if (
      error.code ===
      "EADDRINUSE"
    ) {

      console.error("");
      console.error(
        `Port ${PORT} is already in use.`
      );

      console.error(
        "Stop the previous server or use another port."
      );

      console.error("");

      process.exit(1);
    }

    throw error;
  }
);


server.listen(
  PORT,
  "127.0.0.1",
  () => {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      " BNT Enterprise"
    );

    console.log(
      "======================================"
    );

    console.log("");

    console.log(
      `Dispatcher:        http://localhost:${PORT}/dispatcher`
    );

    console.log(
      `Equipment:         http://localhost:${PORT}/equipment`
    );

    console.log(
      `Analytics:         http://localhost:${PORT}/analytics`
    );

    console.log(
      `TOiR:              http://localhost:${PORT}/toir`
    );

    console.log(
      `Logistics:         http://localhost:${PORT}/logistics`
    );

    console.log(
      `Procurement:       http://localhost:${PORT}/procurement`
    );

    console.log(
      `Reports:           http://localhost:${PORT}/reports`
    );

    console.log("");
  }
);
