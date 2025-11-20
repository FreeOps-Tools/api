const https = require('https');
const tls = require('tls');

function checkSSLCertificate(hostname, port = 443, callback) {
  let certRetrieved = false;
  
  // Use tls.connect for more reliable certificate retrieval
  const socket = tls.connect({
    host: hostname,
    port: port,
    rejectUnauthorized: false, // We want to check even if cert is invalid
    servername: hostname, // Important for SNI
  }, () => {
    try {
      const cert = socket.getPeerCertificate(true);
      
      if (cert && cert.valid_to) {
        certRetrieved = true;
        const expirationDate = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        callback(null, {
          expirationDate: expirationDate.toISOString(),
          daysUntilExpiry: daysUntilExpiry,
          isValid: expirationDate > now,
          issuer: cert.issuer ? (cert.issuer.CN || JSON.stringify(cert.issuer)) : null,
          subject: cert.subject ? (cert.subject.CN || hostname) : hostname,
        });
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(null, null);
    } finally {
      if (!socket.destroyed) {
        socket.end();
      }
    }
  });

  socket.on('error', (error) => {
    if (!certRetrieved) {
      // If we can't get the certificate, return null (might be HTTP or connection issue)
      callback(null, null);
    }
  });

  socket.on('timeout', () => {
    if (!certRetrieved) {
      socket.destroy();
      callback(null, null);
    }
  });

  socket.setTimeout(5000);
}

module.exports = checkSSLCertificate;

