const dns = require('dns');

function performDnsLookup(hostname, callback) {
  dns.lookup(hostname, (error, ipAddress) => {
    if (error) {
      callback(null, error);
    } else {
      callback(ipAddress);
    }
  });
}

module.exports = performDnsLookup;
