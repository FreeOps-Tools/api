const http = require('http');
const https = require('https');

function makeHttpRequest(urlToAnalyze, options, callback) {
  const protocol = urlToAnalyze.startsWith('https://') ? https : http;

  const request = protocol.request(urlToAnalyze, options, (response) => {
    callback(response);
  });

  request.on('error', (error) => {
    callback(null, error);
  });

  request.end();
}

module.exports = makeHttpRequest;
