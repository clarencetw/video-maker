const express = require('express');
const cors = require('cors');
const fs = require('fs');
// const M3U8FileParser = require('m3u8-file-parser');
const path = require('path');
const vttToJson = require('vtt-to-json');
const app = express();
const PORT = 6000;

console.log(path.join(__dirname)); // C:\users\Mayvis\Desktop\code\video-maker

// allow cross domain, fix CORS problem
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors());

app.get('/api/vtt', function (req, res) {
  const data = fs.readFileSync('assets/demo.vtt');
  vttToJson(data.toString())
    .then(data => res.send(data));
});

app.get('/api/video', function (req, res) {
  const content = fs.readFileSync('assets/stream/playlist.m3u8', {encoding: 'utf-8'});
  res.send(content);
});

app.get('/video', function (req, res) {
  const path = 'assets/stream/playlist.m3u8';
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res)
  }
});

app.listen(PORT);