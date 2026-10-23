/* Zero-install local server: node serve.cjs (open http://localhost:4173).
   Serves this project only, regardless of the caller's working directory. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
  // Also supports /nutty-adventure/ for project-subpath verification.
  pathname=pathname.replace(/^\/nutty-adventure(?=\/)/,'');
  const target=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(target,(err,body)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);});
});
server.listen(port,'127.0.0.1',()=>console.log(`Nutty Adventure is ready: http://localhost:${port}`));
