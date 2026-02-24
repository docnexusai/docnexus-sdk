# DocNexus API Client

JavaScript/TypeScript client for the DocNexus API, for use with **API keys** (Kong Key Auth) or **Bearer JWT**.

## Install

```bash
npm install @docnexus/api-client
# or install from GitHub (API key platform)
npm install github:docnexusai/docnexus-sdk
# or from local path
npm install ./docnexus-sdk
```

## Usage with API key (Kong)

```javascript
import DocnexusClient from '@docnexus/api-client';

const client = new DocnexusClient({
  baseUrl: 'https://your-kong-gateway.example.com/profile',  // Kong URL (path prefix if any)
  apiKey: 'dnx_key_YOUR_KONG_API_KEY',
});

// Search
const results = await client.search({
  first_name: 'John',
  last_name: 'Doe',
  country: 'US',
});
console.log(results.docnexus_results);

// US profile by NPI
const profile = await client.getProfileByNpi('1234567890');
console.log(profile.clinical_trials, profile.publications);

// Health check (no auth)
const health = await client.health();
console.log(health.status);
```

## Usage with Bearer token (JWT)

```javascript
const client = new DocnexusClient('https://api.docnexus.ai');

await client.login('username', 'password');
// client now uses the access token automatically

const results = await client.search({ first_name: 'Jane', last_name: 'Smith' });
```

Or set a token you already have:

```javascript
client.setBearerToken('eyJhbGc...');
const profile = await client.getProfileByNpi('1234567890');
```

## API

- **`new DocnexusClient(baseUrl | config)`** — `config` can be `{ baseUrl, apiKey?, version?, fetch? }`. Default version is `v5`.
- **`setApiKey(key)`** — Set Kong API key (sent as `apikey` header).
- **`setBearerToken(token)`** — Set JWT (sent as `Authorization: Bearer`).
- **`search(params)`** — `POST /v5/search`. Params: `first_name`, `last_name`, `specialty?`, `country?`, `other_info?`, `is_refresh_data?`.
- **`getProfileByNpi(npiNumber)`** — `GET /v5/profile/us/{npi}`. NPI must be 10 digits.
- **`health()`** — `GET /v5/health`. No auth.
- **`login(username, password)`** — `POST /v5/token`. Sets Bearer token on the client.
- **`refresh(refreshToken?)`** — `POST /v5/refresh`. Uses stored token if none passed.

## API Platform SDK (endpoint name + payload + API key)

Use the same package with your **API key from the API key platform** to call endpoints by **endpoint name** (URI path) and **payload**:

```javascript
import { call, createPlatformClient } from '@docnexus/api-client';

const baseUrl = 'https://api.docnexus.ai';  // Kong gateway or your base URL
const apiKey = 'dnx_your_api_key_here';     // From API Keys page in the platform

// Option 1: one-off call
const searchResults = await call({
  baseUrl,
  apiKey,
  endpointName: 'v5/search',
  payload: { first_name: 'John', last_name: 'Doe', country: 'US' },
});

const profile = await call({
  baseUrl,
  apiKey,
  endpointName: 'v5/profile/us/:npi',
  payload: { npi: '1234567890' },
});

const advancedData = await call({
  baseUrl,
  apiKey,
  endpointName: 'api/query',
  payload: { outputCategory: 'type_1_npi', limit: 10 },
});

// Option 2: create client, then call by endpoint name
const client = createPlatformClient({ baseUrl, apiKey });
const results = await client.call('v5/search', { first_name: 'Jane', last_name: 'Smith' });
const usProfile = await client.call('v5/profile/us/:npi', { npi: '1234567890' });
```

**Supported endpoint names** (URI paths): `v5/search`, `v5/profile/us/:npi`, `v5/health`, `api/query`, `api/generate-sql`, `api/generate-form-payload`, `api/export`.  
Payload shapes match the backend: docnexus-link search/profile (see API_ENDPOINTS_REFERENCE.md), advanced-search QueryConfig for `api/query`.

## Kong path prefix

If Kong strips a path prefix (e.g. client calls `https://kong/profile/v5/search`), set `baseUrl` to include that prefix:

```javascript
const client = new DocnexusClient({
  baseUrl: 'https://kong.example.com/profile',
  apiKey: 'dnx_key_xxx',
});
// client will request https://kong.example.com/profile/v5/search
```

## Build

```bash
npm run build
```

Output: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types).
