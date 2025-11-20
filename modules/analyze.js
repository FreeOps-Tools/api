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
    makeHttpRequest(urlToAnalyze, {}, (responseDetails, latencyMs, httpRequestError) => {
      if (httpRequestError || !responseDetails) {
        console.error(`Failed to request ${urlToAnalyze}: ${httpRequestError || 'Unknown error'}`);
        return res.json({ isUp: false, ipAddress: null, uptime: 0, latencyMs: 0, dnsLookupMs: 0 });
      }

      const isUp =
        responseDetails.statusCode >= 200 && responseDetails.statusCode < 400;
      if (!isUp) {
        return res.json({
          isUp: false,
          ipAddress: null,
          uptime: 0,
          latencyMs,
          dnsLookupMs: 0,
          statusCode: responseDetails.statusCode,
        });
      }

      performDnsLookup(hostname, ({ ipAddress, lookupMs, error: dnsLookupError }) => {
        if (dnsLookupError) {
          console.error(`Failed to lookup IP address for ${urlToAnalyze}: ${dnsLookupError}`);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Calculate uptime baseline on successful check
        const uptime = 100;

        console.log(
          `isUp: ${isUp}, ipAddress: ${ipAddress}, uptime: ${uptime}%, latencyMs: ${latencyMs}, dnsLookupMs: ${lookupMs}`
        );
        return res.json({
          isUp: true,
          ipAddress,
          uptime,
          latencyMs,
          dnsLookupMs: lookupMs,
          statusCode: responseDetails.statusCode,
        });
      });
    });
  } catch (error) {
    console.error(`Error analyzing URL: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
}

module.exports = analyzeURL;
