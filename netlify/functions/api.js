/**
 * netlify/functions/api.js
 * ----------------------------------------------------------------
 * Wraps the exact same Express app used in local dev (server/index.js)
 * with serverless-http so all /api/* routes work identically on
 * Netlify Functions. See netlify.toml for the redirect that maps
 * /api/* → /.netlify/functions/api/*.
 * ----------------------------------------------------------------
 */

const serverless = require("serverless-http");
const app = require("../../server/index.js");

exports.handler = serverless(app);
