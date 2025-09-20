// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const livereload = require("livereload");

const publicDir = path.join(__dirname, "public");


const liveServer = livereload.createServer();
liveServer.watch(publicDir);


const server = http.createServer((req, res) => {
  try {
    let reqUrl = decodeURIComponent(req.url.split("?")[0]);
    if (reqUrl === "/") reqUrl = "/index.html";

    const filePath = path.join(publicDir, reqUrl);
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(400);
      return res.end("400 Bad Request");
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404);
        return res.end("404 Not Found");
      }

      if (stats.isDirectory()) {
        const indexFile = path.join(filePath, "index.html");
        return fs.readFile(indexFile, (err2, buf) => {
          if (err2) {
            res.writeHead(404);
            return res.end("404 Not Found");
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          let content = buf.toString();
          // Inject livereload script before </body>
          content = content.replace(
            /<\/body>/,
            `<script src="http://localhost:35729/livereload.js"></script></body>`
          );
          res.end(content);
        });
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".ico": "image/x-icon",
      };
      const contentType = contentTypeMap[ext] || "application/octet-stream";

      fs.readFile(filePath, (err2, data) => {
        if (err2) {
          res.writeHead(500);
          return res.end("500 Server Error");
        }

        let content = data;
        // Inject livereload script for HTML files
        if (ext === ".html") {
          content = data.toString().replace(
            /<\/body>/,
            `<script src="http://localhost:35729/livereload.js"></script></body>`
          );
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      });
    });
  } catch (e) {
    res.writeHead(500);
    res.end("500 Server Error");
  }
});


const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("message", (msg) => {
    console.log("Received from client:", msg);
    socket.emit("message", { from: "server", text: `Echo: ${msg}` });
  });

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, reason);
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
