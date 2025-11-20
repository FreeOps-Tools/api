const http = require('http');
const https = require('https');
const now = require('performance-now');

function makeHttpRequest(urlToAnalyze, options = {}, callback) {
  const protocol = urlToAnalyze.startsWith('https://') ? https : http;
  const requestOptions = {
    method: 'GET',
    timeout: 8000,
    ...options,
  };

  const start = now();
  const request = protocol.request(urlToAnalyze, requestOptions, (response) => {
    // consume the response to ensure the 'end' event fires for timing accuracy
    response.on('data', () => {});

    response.on('end', () => {
      const latencyMs = Number((now() - start).toFixed(2));
      callback(
        {
          statusCode: response.statusCode,
          headers: response.headers,
        },
        latencyMs
      );
    });
  });

  request.on('timeout', () => {
    request.destroy(new Error('Request timed out'));
  });

  request.on('error', (error) => {
    callback(null, 0, error);
  });

  request.end();
}

module.exports = makeHttpRequest;
