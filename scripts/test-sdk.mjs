#!/usr/bin/env node
/**
 * Test script for @docnexus/api-client (API Platform SDK).
 * Run: node scripts/test-sdk.mjs
 * Optional env: API_KEY — if set, runs a live health check against SDK default URL.
 */

import { call, createPlatformClient, ENDPOINT_REGISTRY, DocnexusClient } from "../dist/index.mjs";

const API_KEY = process.env.API_KEY || "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log("1. Checking exports...");
assert(typeof call === "function", "call is a function");
assert(typeof createPlatformClient === "function", "createPlatformClient is a function");
assert(ENDPOINT_REGISTRY && typeof ENDPOINT_REGISTRY === "object", "ENDPOINT_REGISTRY exists");
assert(typeof DocnexusClient === "function", "DocnexusClient exists");

const names = Object.keys(ENDPOINT_REGISTRY);
assert(names.includes("v5/search"), "v5/search in registry");
assert(names.includes("v5/profile/us/:npi"), "v5/profile/us/:npi in registry");
assert(names.includes("api/query"), "api/query in registry");
console.log("   Endpoint names:", names.join(", "));

console.log("2. createPlatformClient...");
const client = createPlatformClient({ apiKey: "test-key" });
assert(typeof client.call === "function", "client.call exists");
assert(Array.isArray(client.getEndpointNames()), "getEndpointNames returns array");
console.log("   getEndpointNames():", client.getEndpointNames().length, "endpoints");

console.log("3. call() with unknown endpoint throws...");
let threw = false;
try {
  await call({ apiKey: "x", endpointName: "invalid/path" });
} catch (e) {
  threw = true;
  assert(e.message.includes("Unknown endpoint"), "error mentions unknown endpoint");
}
assert(threw, "call with unknown endpoint threw");

console.log("4. call() v5/profile/us/:npi without npi throws...");
threw = false;
try {
  await call({
    apiKey: "x",
    endpointName: "v5/profile/us/:npi",
    payload: {},
  });
} catch (e) {
  threw = true;
  assert(e.message.includes("Missing path parameter") || e.message.includes("npi"), "error mentions npi");
}
assert(threw, "call without npi threw");

console.log("5. DocnexusClient instantiation...");
const docClient = new DocnexusClient({ apiKey: "x" });
assert(docClient && typeof docClient.health === "function", "DocnexusClient has health method");

if (API_KEY) {
  console.log("6. Live test (API_KEY set)...");
  try {
    const health = await call({
      apiKey: API_KEY,
      endpointName: "v5/health",
    });
    console.log("   v5/health:", health);
  } catch (e) {
    console.log("   Live v5/health failed (expected if gateway not reachable):", e.message);
  }
} else {
  console.log("6. Skipping live test (set API_KEY to run live check).");
}

console.log("\nAll checks passed.");
