const dns = require('dns');
const now = require('performance-now');

function performDnsLookup(hostname, callback) {
  const start = now();
  dns.lookup(hostname, (error, ipAddress) => {
    const lookupMs = Number((now() - start).toFixed(2));
    if (error) {
      callback({ error, lookupMs });
    } else {
      callback({ ipAddress, lookupMs });
    }
  });
}

module.exports = performDnsLookup;
