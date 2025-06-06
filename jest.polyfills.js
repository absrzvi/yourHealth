// Add essential polyfills required for web APIs in Node.js environment
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Add URL and URLSearchParams if they're not available (might be needed by undici)
if (!global.URL) {
  const { URL } = require('url');
  global.URL = URL;
}

if (!global.URLSearchParams) {
  const { URLSearchParams } = require('url');
  global.URLSearchParams = URLSearchParams;
}
