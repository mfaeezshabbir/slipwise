// Load .env (if present) and expose API_URL to Expo
// This file runs when the Expo CLI starts.
const os = require('os');
try {
  require('dotenv').config();
} catch (e) {
  // noop if dotenv isn't installed
}

const appJson = require('./app.json');

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.keys(nets)) {
    for (const net of nets[iface]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// API URL: in production use the provided env value; in development
// default to the machine local IP so physical devices can reach the dev server.
const LOCAL_API = `http://${getLocalIp()}:4000`;

// Detect production:
// 1. Explicit NODE_ENV=production in .env (checked after dotenv.config() loads it)
// 2. OR API_URL is set to a non-localhost/non-IP domain (heuristic for production URLs)
const envApiUrl = process.env.API_URL;
const isProductionUrl =
  envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.match(/\d+\.\d+\.\d+\.\d+/);
const isProd = process.env.NODE_ENV === 'production' || isProductionUrl;

let API_URL;
if (isProd) {
  // Production: use the provided API_URL from .env or fail
  if (!envApiUrl) {
    console.warn(
      'WARNING: NODE_ENV=production but API_URL not set in .env. Defaulting to localhost.'
    );
    API_URL = 'http://localhost:4000';
  } else {
    API_URL = envApiUrl;
  }
} else {
  // Development: use local IP so devices can reach dev server
  API_URL = LOCAL_API;
}

process.env.API_URL = API_URL;

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo?.extra || {}),
      apiUrl: API_URL,
    },
  },
};
