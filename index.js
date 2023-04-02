// index.js - api

const http = require('http');
const https = require('https'); // add https module
const dns = require('dns');
const express = require('express');
const bodyParser = require('body-parser');
const url = require('url');

const app = express();
app.use(bodyParser.json());

app.post('/api/analyze', (req, res) => {
  // const url = req.body.url;
  // Extract the hostname from the URL
  const hostname = url.parse(req.body.url).hostname;
  const protocol = url.parse(req.body.url).protocol === 'https:' ? https : http; // use https module if URL starts with https
  const options = {
    method: 'HEAD',
    timeout: 5000,
  };

  protocol.request(req.body.url, options, (httpResponse) => {
    const isUp = httpResponse.statusCode >= 200 && httpResponse.statusCode < 400;
    if (!isUp) {
      return res.json({ isUp: false, ipAddress: null, uptime: 0 });
    }

    dns.lookup(hostname, (dnsError, ipAddress) => {
      if (dnsError) {
        console.error(`Failed to lookup IP address for ${req.body.url}: ${dnsError}`);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const uptime = Math.floor(Math.random() * 100);
      console.log(`isUp: ${isUp}, ipAddress: ${ipAddress}, uptime: ${uptime}`);
      return res.json({ isUp: true, ipAddress, uptime });
    });
  }).on('error', (error) => {
    console.error(`Failed to request ${req.body.url}: ${error}`);
    return res.json({ isUp: false, ipAddress: null, uptime: 0 });
  }).end();
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

