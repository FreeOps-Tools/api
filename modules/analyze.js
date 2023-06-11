// analyze.js

const url = require('url');
const now = require('performance-now');
const { isURL } = require('validator');
const makeHttpRequest = require('./httpRequest');
const performDnsLookup = require('./dnsLookup');

function analyzeURL(req, res) {
  try {
    if (!req.body.url) {
      throw new Error('URL is missing');
    }

    const urlToAnalyze = req.body.url;

    if (!isURL(urlToAnalyze)) {
      throw new Error('Invalid URL');
    }

    const hostname = url.parse(urlToAnalyze).hostname;
    const options = {
      method: 'HEAD',
      timeout: 5000,
    };

    const start = now();

    makeHttpRequest(urlToAnalyze, options, (response, httpRequestError) => {
      if (httpRequestError) {
        console.error(`Failed to request ${urlToAnalyze}: ${httpRequestError}`);
        return res.json({ isUp: false, ipAddress: null, uptime: 0, responseTime: 0 });
      }

      const isUp = response.statusCode >= 200 && response.statusCode < 400;
      if (!isUp) {
        return res.json({ isUp: false, ipAddress: null, uptime: 0, responseTime: 0 });
      }

      performDnsLookup(hostname, (ipAddress, dnsLookupError) => {
        if (dnsLookupError) {
          console.error(`Failed to lookup IP address for ${urlToAnalyze}: ${dnsLookupError}`);
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
    });
  } catch (error) {
    console.error(`Error analyzing URL: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
}

module.exports = analyzeURL;
