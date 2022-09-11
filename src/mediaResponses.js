const fs = require('fs');
const path = require('path');

const getPositions = (request) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');
  return positions;
};

const respond = (start, end, total, response) => {
  const chunksize = (end - start) + 1;

  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': 'video/mp4',
  });
};

const doStream = (stream, response) => {
  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });
};

const readFile = (file, request, response) => {
  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const positions = getPositions(request);
    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    respond(start, end, total, response);

    const stream = fs.createReadStream(file, { start, end });
    doStream(stream, response);
    return stream;
  });
};

const getParty = (request, response) => {
  const file = path.resolve(__dirname, '../client/party.mp4');
  readFile(file, request, response);
};

const getBird = (request, response) => {
  const file = path.resolve(__dirname, '../client/bird.mp4');
  readFile(file, request, response);
};

const getBling = (request, response) => {
  const file = path.resolve(__dirname, '../client/bling.mp3');
  readFile(file, request, response);
};

module.exports.getParty = getParty;
module.exports.getBird = getBird;
module.exports.getBling = getBling;
