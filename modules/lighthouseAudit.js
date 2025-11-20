// lighthouseAudit.js
// Performance metrics using Lighthouse

const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');

async function runLighthouseAudit(url, options = {}) {
  let chrome = null;
  
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });

    // Run Lighthouse
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...options
    });

    // Extract key metrics
    const lhr = result.lhr;
    const categories = lhr.categories;
    
    // Performance metrics
    const performance = {
      score: Math.round(categories.performance?.score * 100) || 0,
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue || null,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue || null,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || null,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue || null,
        speedIndex: lhr.audits['speed-index']?.numericValue || null,
        timeToInteractive: lhr.audits['interactive']?.numericValue || null,
      }
    };

    // Accessibility score
    const accessibility = {
      score: Math.round(categories.accessibility?.score * 100) || 0
    };

    // Best practices score
    const bestPractices = {
      score: Math.round(categories['best-practices']?.score * 100) || 0
    };

    // SEO score
    const seo = {
      score: Math.round(categories.seo?.score * 100) || 0
    };

    return {
      performance,
      accessibility,
      bestPractices,
      seo,
      fetchTime: lhr.fetchTime
    };
  } catch (error) {
    console.error('Lighthouse audit error:', error.message);
    return null;
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

module.exports = runLighthouseAudit;

