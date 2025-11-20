// analyze.js

const url = require('url');
const now = require('performance-now');
const { isURL } = require('validator');
const makeHttpRequest = require('./httpRequest');
const performDnsLookup = require('./dnsLookup');
const checkSSLCertificate = require('./sslCheck');

function analyzeURL(req, res) {
  try {
    if (!req.body.url) {
      throw new Error('URL is missing');
    }

    let urlToAnalyze = req.body.url.trim();
    const originalUrl = urlToAnalyze;
    const parsedUrl = url.parse(urlToAnalyze);
    const hadProtocol = !!parsedUrl.protocol;
    
    // If no protocol, try HTTPS first
    if (!hadProtocol) {
      urlToAnalyze = `https://${urlToAnalyze}`;
    }

    // Validate the URL
    if (!isURL(urlToAnalyze)) {
      throw new Error('Invalid URL');
    }

    const hostname = url.parse(urlToAnalyze).hostname;
    const isHttps = urlToAnalyze.startsWith('https://');
    
    // Try the request
    makeHttpRequest(urlToAnalyze, {}, (responseDetails, latencyMs, httpRequestError) => {
      // If HTTPS failed and we added the protocol (no protocol originally), try HTTP as fallback
      if (httpRequestError && isHttps && !hadProtocol) {
        const httpUrl = urlToAnalyze.replace('https://', 'http://');
        return makeHttpRequest(httpUrl, {}, (httpResponseDetails, httpLatencyMs, httpError) => {
          if (httpError || !httpResponseDetails) {
            return res.json({ 
              isUp: false, 
              ipAddress: null, 
              uptime: 0, 
              latencyMs: 0, 
              dnsLookupMs: 0,
              statusCode: null,
              protocol: 'http',
              sslInfo: null
            });
          }
          processResponse(httpResponseDetails, httpLatencyMs, hostname, 'http', res);
        });
      }
      
      if (httpRequestError || !responseDetails) {
        console.error(`Failed to request ${urlToAnalyze}: ${httpRequestError || 'Unknown error'}`);
        return res.json({ 
          isUp: false, 
          ipAddress: null, 
          uptime: 0, 
          latencyMs: 0, 
          dnsLookupMs: 0,
          statusCode: null,
          protocol: isHttps ? 'https' : 'http',
          sslInfo: null
        });
      }
      
      processResponse(responseDetails, latencyMs, hostname, isHttps ? 'https' : 'http', res);
    });

    function processResponse(responseDetails, latencyMs, hostname, protocol, res) {
      const isUp = responseDetails.statusCode >= 200 && responseDetails.statusCode < 400;
      if (!isUp) {
        return res.json({
          isUp: false,
          ipAddress: null,
          uptime: 0,
          latencyMs,
          dnsLookupMs: 0,
          statusCode: responseDetails.statusCode,
          protocol: protocol,
          sslInfo: null
        });
      }

      performDnsLookup(hostname, ({ ipAddress, lookupMs, error: dnsLookupError }) => {
        if (dnsLookupError) {
          console.error(`Failed to lookup IP address: ${dnsLookupError}`);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Check SSL certificate if HTTPS
        if (protocol === 'https') {
          checkSSLCertificate(hostname, 443, (sslError, sslInfo) => {
            const uptime = 100;
            const response = {
              isUp: true,
              ipAddress,
              uptime,
              latencyMs,
              dnsLookupMs: lookupMs,
              statusCode: responseDetails.statusCode,
              protocol: protocol,
              sslInfo: sslInfo
            };
            
            console.log(
              `isUp: ${isUp}, ipAddress: ${ipAddress}, uptime: ${uptime}%, latencyMs: ${latencyMs}, dnsLookupMs: ${lookupMs}, protocol: ${protocol}, sslInfo: ${sslInfo ? JSON.stringify(sslInfo) : 'null'}`
            );
            return res.json(response);
          });
        } else {
          // HTTP - no SSL info
          const uptime = 100;
          const response = {
            isUp: true,
            ipAddress,
            uptime,
            latencyMs,
            dnsLookupMs: lookupMs,
            statusCode: responseDetails.statusCode,
            protocol: protocol,
            sslInfo: null
          };
          
          console.log(
            `isUp: ${isUp}, ipAddress: ${ipAddress}, uptime: ${uptime}%, latencyMs: ${latencyMs}, dnsLookupMs: ${lookupMs}, protocol: ${protocol}`
          );
          return res.json(response);
        }
      });
    }
  } catch (error) {
    console.error(`Error analyzing URL: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
}

module.exports = analyzeURL;
