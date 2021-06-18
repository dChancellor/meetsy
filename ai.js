const { deepaiAPIKey } = require("./config");
const deepai = require("deepai"); // OR include deepai.min.js as a script tag in your HTML

deepai.setApiKey(deepaiAPIKey);

async function runDeepAI(text) {
  return deepai.callStandardApi("text-generator", { text });
}

module.exports = runDeepAI;
