const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT || 8080);
const ROUTES = {
  "/":"index.html", "/dispatcher":"dispatcher.html", "/digital-twin":"dispatcher.html",
  "/equipment":"equipment.html", "/equipment-detail":"equipment-detail.html", "/analytics":"analytics.html",
  "/toir":"toir.html", "/logistics":"logistics.html", "/procurement":"procurement.html",
  "/reports":"reports.html", "/templates":"templates.html", "/builder":"builder.html",
  "/data":"data.html", "/mailings":"mailings.html", "/sync":"sync.html"
};
const MIME={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon",".txt":"text/plain; charset=utf-8"};

function loadConfig(){
  const fallback={googleMapsApiKey:"",googleMapsMapId:"DEMO_MAP_ID",center:{lat:41.6438169,lng:41.6605911},zoom:17};
  const file=path.join(ROOT,"config.local.json");
  if(!fs.existsSync(file)) return fallback;
  try { const raw=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"").trim(); return {...fallback,...JSON.parse(raw)}; }
  catch(error){ console.warn("config.local.json ignored:",error.message); return fallback; }
}
function sendFile(res,file){
  if(!file||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});return res.end("404 Not Found");}
  const ext=path.extname(file).toLowerCase();
  res.writeHead(200,{"Content-Type":MIME[ext]||"application/octet-stream","Cache-Control":[".html",".js",".css",".json",".svg"].includes(ext)?"no-store":"public, max-age=60"});
  fs.createReadStream(file).pipe(res);
}
const server=http.createServer((req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host||"localhost"}`);let pathname=decodeURIComponent(url.pathname);
    if(pathname==="/api/config"){res.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});return res.end(JSON.stringify(loadConfig()));}
    if(pathname.length>1&&pathname.endsWith("/"))pathname=pathname.slice(0,-1);
    if(ROUTES[pathname])return sendFile(res,path.join(ROOT,ROUTES[pathname]));
    const file=path.resolve(ROOT,pathname.replace(/^\/+/,""));if(!file.startsWith(ROOT)){res.writeHead(403);return res.end("Forbidden");}
    return sendFile(res,file);
  }catch(error){console.error(error);res.writeHead(500);res.end("500 Internal Server Error");}
});
server.on("error",error=>{if(error.code==="EADDRINUSE"){console.error(`Port ${PORT} is already in use.`);process.exit(1);}throw error;});
server.listen(PORT,"127.0.0.1",()=>{console.log(`BNT Enterprise: http://localhost:${PORT}/`);console.log(`Dispatcher:     http://localhost:${PORT}/dispatcher`);});
