const http =
  require("http");

const fs =
  require("fs");

const path =
  require("path");

const root =
  __dirname;

const port =
  Number(
    process.env.PORT || 8080
  );

const mime = {

  ".html":
    "text/html; charset=utf-8",

  ".js":
    "application/javascript; charset=utf-8",

  ".css":
    "text/css; charset=utf-8",

  ".json":
    "application/json; charset=utf-8",

  ".svg":
    "image/svg+xml",

  ".png":
    "image/png",

  ".jpg":
    "image/jpeg",

  ".jpeg":
    "image/jpeg"
};

function readLocalConfig() {

  const file =
    path.join(
      root,
      "config.local.json"
    );

  if (!fs.existsSync(file)) {

    return {
      googleMapsApiKey: "",
      googleMapsMapId:
        "DEMO_MAP_ID",

      center: {
        lat: 41.6438169,
        lng: 41.6605911
      },

      zoom: 17
    };
  }

  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
        .replace(/^\uFEFF/, "")
    );
  }
  catch (_) {
    return {
      googleMapsApiKey: "",
      googleMapsMapId: "DEMO_MAP_ID",
      center: { lat: 41.6438169, lng: 41.6605911 },
      zoom: 17
    };
  }
}

const server =
  http.createServer(
    (req, res) => {

      const url =
        new URL(
          req.url,
          "http://localhost"
        );

      if (
        url.pathname ===
        "/api/config"
      ) {

        const config =
          readLocalConfig();

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json; charset=utf-8",

            "Cache-Control":
              "no-store"
          }
        );

        res.end(
          JSON.stringify(config)
        );

        return;
      }

      let requestPath =
        decodeURIComponent(
          url.pathname
        );

      if (
        requestPath === "/"
      ) {
        requestPath =
          "/index.html";
      }

      if (requestPath === "/digital-twin") {
        res.writeHead(308, { Location: "/dispatcher" });
        res.end();
        return;
      }

      if (!path.extname(requestPath)) {
        requestPath += ".html";
      }

      const filePath =
        path.normalize(
          path.join(
            root,
            requestPath
          )
        );

      if (
        !filePath.startsWith(root)
      ) {

        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      if (
        !fs.existsSync(filePath) ||
        fs.statSync(filePath)
          .isDirectory()
      ) {

        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext =
        path.extname(filePath)
          .toLowerCase();

      res.writeHead(
        200,
        {
          "Content-Type":
            mime[ext] ||
            "application/octet-stream"
        }
      );

      fs.createReadStream(
        filePath
      )
      .pipe(res);
    }
  );

server.listen(
  port,
  () => {

    console.log("");
    console.log(
      "BNT Enterprise v8"
    );

    console.log(
      "Main:"
    );

    console.log(
      `http://localhost:${port}`
    );

    console.log(
      "Digital Twin:"
    );

    console.log(
      `http://localhost:${port}/digital-twin`
    );

    console.log("");
  }
);
