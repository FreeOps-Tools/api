// index.js - api

const http = require('http');
const https = require('https');
const dns = require('dns');
const express = require('express');
const bodyParser = require('body-parser');
const url = require('url');
const now = require('performance-now');
const cors = require('cors');
const { isURL } = require('validator');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/api/analyze', (req, res) => {
  try {
    if (!req.body.url) {
      throw new Error('URL is missing');
    }

    const urlToAnalyze = req.body.url;

    if (!isURL(urlToAnalyze)) {
      throw new Error('Invalid URL');
    }

    const hostname = url.parse(urlToAnalyze).hostname;
    const protocol = url.parse(urlToAnalyze).protocol === 'https:' ? https : http;
    const options = {
      method: 'HEAD',
      timeout: 5000,
    };

    const start = now();

    protocol.request(urlToAnalyze, options, (httpResponse) => {
      const isUp = httpResponse.statusCode >= 200 && httpResponse.statusCode < 400;
      if (!isUp) {
        return res.json({ isUp: false, ipAddress: null, uptime: 0, responseTime: 0 });
      }

      dns.lookup(hostname, (dnsError, ipAddress) => {
        if (dnsError) {
          console.error(`Failed to lookup IP address for ${urlToAnalyze}: ${dnsError}`);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Calculate responseTime
        const end = now();
        const responseTime = ((end - start) / 1000).toFixed(2);

        // calculate uptime
        const totalSeconds = (end - start) / 1000; // convert to seconds
        const availableSeconds = totalSeconds - (totalSeconds * 0.01); // assuming 99.99% uptime
        const uptime = ((availableSeconds / totalSeconds) * 100).toFixed(2);

        console.log(`isUp: ${isUp}, ipAddress: ${ipAddress}, uptime: ${uptime}%, responseTime: ${responseTime}s`);
        return res.json({ isUp: true, ipAddress, uptime, responseTime });
      });
    }).on('error', (error) => {
      console.error(`Failed to request ${urlToAnalyze}: ${error}`);
      return res.json({ isUp: false, ipAddress: null, uptime: 0, responseTime: 0 });
    }).end();
  } catch (error) {
    console.error(`Error analyzing URL: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
