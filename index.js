// index.js - api

const http = require('http');
const dns = require('dns');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/api/analyze', (req, res) => {
  const url = req.body.url;
  const options = {
    method: 'HEAD',
    timeout: 5000,
  };

  http.request(url, options, (httpResponse) => {
    const isUp = httpResponse.statusCode >= 200 && httpResponse.statusCode < 400;
    if (!isUp) {
      return res.json({ isUp: false, ipAddress: null, uptime: 0 });
    }

  dns.lookup(url, (dnsError, ipAddress) => {
    if (dnsError) {
      console.error(`Failed to lookup IP address for ${url}: ${dnsError}`);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const uptime = Math.floor(Math.random() * 100);
    return res.json({ isUp: true, ipAddress, uptime });
  });
  }).on('error', (error) => {
    console.error(`Failed to request ${url}: ${error}`);
    return res.json({ isUp: false, ipAddress: null, uptime: 0 });
  }).end();
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
