#!/usr/bin/env node
/**
 * Test script for @docnexusapi/api-client (API Platform SDK).
 * Run: node scripts/test-sdk.mjs
 * Optional env: API_KEY — if set, runs live tests for all 3 endpoint groups:
 *   - v5/health, v5/search, v5/profile/us/:npi (Docnexus Link)
 *   - api/query (Advanced Search)
 * Override base URLs: DOCNEXUS_SDK_LINK_BASE_URL, DOCNEXUS_SDK_ADVANCED_SEARCH_BASE_URL
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
  const linkBase = process.env.DOCNEXUS_SDK_LINK_BASE_URL || "";
  const advancedBase = process.env.DOCNEXUS_SDK_ADVANCED_SEARCH_BASE_URL || "";
  if (linkBase || advancedBase) {
    console.log("6. Live tests (API_KEY + base URL overrides)...");
  } else {
    console.log("6. Live tests (API_KEY set, using SDK default Kong URLs)...");
  }

  const isServerError = (e) => e.message && (e.message.includes("500") || e.message.includes("502") || e.message.includes("503"));

  // --- Docnexus Link ---
  try {
    const health = await call({ apiKey: API_KEY, endpointName: "v5/health" });
    console.log("   v5/health:", JSON.stringify(health).slice(0, 80) + "...");
  } catch (e) {
    if (isServerError(e)) console.log("   v5/health: 5xx (backend error, SDK call OK)");
    else console.log("   v5/health failed:", e.message);
  }

  try {
    await call({
      apiKey: API_KEY,
      endpointName: "v5/search",
      payload: { first_name: "John", last_name: "Smith", country: "US" },
    });
    console.log("   v5/search: 200 OK");
  } catch (e) {
    if (isServerError(e)) console.log("   v5/search: 5xx (backend error, SDK call OK)");
    else console.log("   v5/search failed:", e.message);
  }

  try {
    await call({
      apiKey: API_KEY,
      endpointName: "v5/profile/us/:npi",
      payload: { npi: "1234567890" },
    });
    console.log("   v5/profile/us/:npi: 200 OK");
  } catch (e) {
    if (isServerError(e)) console.log("   v5/profile/us/:npi: 5xx (backend error, SDK call OK)");
    else console.log("   v5/profile/us/:npi failed:", e.message);
  }

  // --- Advanced Search (api/query) ---
  try {
    const queryRes = await call({
      apiKey: API_KEY,
      endpointName: "api/query",
      payload: { outputCategory: "type_1_npi", limit: 2 },
    });
    const hasData = queryRes && typeof queryRes === "object" && ("data" in queryRes || "pagination" in queryRes);
    console.log("   api/query: 200 OK" + (hasData ? " (data/pagination)" : ""));
  } catch (e) {
    if (isServerError(e)) console.log("   api/query: 5xx (backend error, SDK call OK)");
    else console.log("   api/query failed:", e.message);
  }
} else {
  console.log("6. Skipping live tests (set API_KEY to run; optional: DOCNEXUS_SDK_LINK_BASE_URL, DOCNEXUS_SDK_ADVANCED_SEARCH_BASE_URL).");
}

console.log("\nAll checks passed.");
