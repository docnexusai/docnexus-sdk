# DocNexus API Client

JavaScript/TypeScript client and API Platform SDK for **DocNexus Link** (provider search, US profiles) and **Advanced Search** (queries, SQL generation, form payloads, export). Use with API keys from the DocNexus API key platform or with Bearer JWT.

---

## Package and exports

| Source | Command |
|--------|--------|
| **npm** | `npm install @docnexus/api-client` |
| **GitHub** | `npm install github:docnexusai/docnexus-sdk` |
| **Local** | `npm install /path/to/docnexus-sdk` |

**Exports (ESM and CJS):**

- `DocnexusClient` — Class for docnexus-link with methods: `search`, `getProfileByNpi`, `health`, `login`, `refresh`, `setApiKey`, `setBearerToken`.
- `call` — One-off platform call: `call({ apiKey, endpointName, payload })`. Base URLs for docnexus-link and advanced-search are stored in the package.
- `createPlatformClient` — Factory: `createPlatformClient({ apiKey })` returns `{ call(endpointName, payload), getEndpointNames() }`.
- `ENDPOINT_REGISTRY` — Map of endpoint name → `{ method, pathTemplate, pathParams? }`.
- Types: `SearchParams`, `SearchResponse`, `USProfileResponse`, `TokenResponse`, `PlatformCallOptions`, `PlatformClientConfig`, `EndpointDef`, `DocnexusLinkSearchPayload`, `DocnexusLinkProfilePayload`, `AdvancedSearchQueryPayload`.

**Entry points:** `main` → `dist/index.js`, `module` → `dist/index.mjs`, `types` → `dist/index.d.ts`. Only the `dist` folder is published (`files: ["dist"]`).

---

## Install

```bash
npm install @docnexus/api-client
```

Or from GitHub (same package):

```bash
npm install github:docnexusai/docnexus-sdk
```

---

## Quick start (API key)

```javascript
import { createPlatformClient } from '@docnexus/api-client';

const client = createPlatformClient({
  apiKey: 'dnx_your_api_key_here',
});

const results = await client.call('v5/search', {
  first_name: 'John',
  last_name: 'Doe',
  country: 'US',
});
console.log(results.docnexus_results);
```

---

## Example use cases

### 1. Provider search (DocNexus Link)

Search for healthcare providers by name and optional filters.

```javascript
import { call } from '@docnexus/api-client';

const results = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'v5/search',
  payload: {
    first_name: 'Jane',
    last_name: 'Smith',
    specialty: 'Cardiology',
    country: 'US',
    is_refresh_data: false,
  },
});

console.log(results.docnexus_results);
```

### 2. US provider profile by NPI (DocNexus Link)

Fetch full profile (clinical trials, publications, payments, etc.) for a 10-digit NPI.

```javascript
import { createPlatformClient } from '@docnexus/api-client';

const client = createPlatformClient({
  apiKey: 'dnx_key_xxx',
});

const profile = await client.call('v5/profile/us/:npi', {
  npi: '1234567890',
});

console.log(profile.clinical_trials, profile.publications, profile.affiliations);
```

### 3. Health check (DocNexus Link)

Verify the gateway or docnexus-link service is up.

```javascript
import { call } from '@docnexus/api-client';

const health = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'v5/health',
});
console.log(health.status);
```

### 4. Advanced Search — execute query

Run a query with filters and get a result set (e.g. type_1_npi, orgs, patient_volume).

```javascript
import { call } from '@docnexus/api-client';

const response = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'api/query',
  payload: {
    outputCategory: 'type_1_npi',
    type1NpiConditions: {
      specialties: ['Cardiology'],
      states: ['CA'],
    },
    limit: 50,
    offset: 0,
  },
});

console.log(response.data, response.pagination);
```

### 5. Advanced Search — generate SQL only

Get the generated SQL for a query without executing it.

```javascript
import { call } from '@docnexus/api-client';

const { sql, pagination } = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'api/generate-sql',
  payload: {
    outputCategory: 'type_1_npi',
    limit: 100,
  },
});
console.log(sql);
```

### 6. Advanced Search — generate form payload from natural language

Build a QueryConfig from natural-language or form text (single or multiple output categories).

```javascript
import { call } from '@docnexus/api-client';

const single = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'api/generate-form-payload',
  payload: {
    outputCategory: 'type_1_npi',
    queryText: 'Cardiologists in California with high volume',
  },
});
console.log(single.payload);

const multi = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'api/generate-form-payload',
  payload: {
    outputCategories: ['type_1_npi', 'type_1_npi_volume'],
    queryText: 'Oncology providers in Texas',
  },
});
```

### 7. Advanced Search — export (CSV or Parquet)

Request an export file; the response is the raw file body (e.g. save to disk or stream).

```javascript
import { call } from '@docnexus/api-client';
import { writeFileSync } from 'fs';

const response = await call({
  apiKey: 'dnx_key_xxx',
  endpointName: 'api/export',
  payload: {
    outputCategory: 'type_1_npi',
    outputUseCategory: 'export',
    exportType: 'CSV',
    type1NpiConditions: { states: ['NY'] },
    limit: 1000,
  },
});

if (typeof response === 'string') {
  writeFileSync('export.csv', response);
} else {
  writeFileSync('export.csv', JSON.stringify(response));
}
```

Note: With the default `call()`, the response may be parsed as JSON if the server returns a JSON error. For binary/CSV export you may need to use a custom `fetch` in `PlatformCallOptions` and handle the response body as blob/text.

### 8. Using DocnexusClient (class API)

Alternative to platform `call`: use the class for docnexus-link. Base URL is stored in the package; pass apiKey or use Bearer token after login.

```javascript
import DocnexusClient from '@docnexus/api-client';

const client = new DocnexusClient({
  apiKey: 'dnx_key_xxx',
});

const results = await client.search({
  first_name: 'John',
  last_name: 'Doe',
  country: 'US',
});
const profile = await client.getProfileByNpi('1234567890');
const health = await client.health();
```

### 9. Login with username/password (Bearer JWT)

Use app credentials to get a JWT and then call search/profile with the token (no API key required for those calls if the backend accepts JWT).

```javascript
import DocnexusClient from '@docnexus/api-client';

const client = new DocnexusClient({});
const { access_token } = await client.login('your_username', 'your_password');
const results = await client.search({ first_name: 'Jane', last_name: 'Smith' });
```

### 10. List available endpoint names

Inspect which endpoint names the SDK supports (useful for UI or validation).

```javascript
import { createPlatformClient, ENDPOINT_REGISTRY } from '@docnexus/api-client';

const client = createPlatformClient({
  apiKey: 'dnx_key_xxx',
});
const names = client.getEndpointNames();
console.log(names);

console.log(ENDPOINT_REGISTRY['api/query']);
```

---

## API reference

### Platform: `call(options)`

- **`options.apiKey`** (string) — API key from the API key platform.
- **`options.endpointName`** (string) — Endpoint name (URI path), e.g. `v5/search`, `v5/profile/us/:npi`, `api/query`, `api/generate-sql`, `api/generate-form-payload`, `api/export`.
- **`options.payload`** (object, optional) — Request body for POST; for GET with path params (e.g. `v5/profile/us/:npi`) use `{ npi: "1234567890" }`.
- **`options.fetch`** (function, optional) — Custom fetch.

Base URLs for docnexus-link (`v5/*`) and advanced-search (`api/*`) are stored in the package config; the client does not pass them.

Returns a Promise of the JSON response (or text if non-JSON). Throws on HTTP error.

### Platform: `createPlatformClient(config)`

- **`config.apiKey`** (string) — API key.
- **`config.fetch`** (function, optional) — Custom fetch.

Returns `{ call(endpointName, payload), getEndpointNames() }`.

### DocnexusClient

- **`new DocnexusClient(config?)`** — `config`: `{ apiKey?, version?, fetch? }`. Base URL for docnexus-link is from package config. Default version `v5`.
- **`setApiKey(key)`** — Set API key (Kong).
- **`setBearerToken(token)`** — Set JWT.
- **`search(params)`** — POST /v5/search. Params: `first_name`, `last_name`, `specialty?`, `country?`, `other_info?`, `is_refresh_data?`.
- **`getProfileByNpi(npiNumber)`** — GET /v5/profile/us/{npi}. NPI must be 10 digits.
- **`health()`** — GET /v5/health.
- **`login(username, password)`** — POST /v5/token. Sets Bearer token on the client.
- **`refresh(refreshToken?)`** — POST /v5/refresh.

### Supported endpoint names (platform)

| Endpoint name | Method | Description |
|---------------|--------|-------------|
| `v5/search` | POST | Provider search (docnexus-link) |
| `v5/profile/us/:npi` | GET | US provider profile by NPI |
| `v5/health` | GET | Health check |
| `api/query` | POST | Execute advanced-search query |
| `api/generate-sql` | POST | Generate SQL only |
| `api/generate-form-payload` | POST | Build payload from text/category |
| `api/export` | POST | Export CSV/Parquet |

Payload shapes follow the backend: docnexus-link (first_name, last_name, npi, etc.), advanced-search QueryConfig (outputCategory, conditions, limit, etc.).

---

## Base URLs (package config)

The SDK stores two base URLs in `src/config.ts`: `DOCNEXUS_LINK_BASE_URL` (for `v5/*` endpoints) and `ADVANCED_SEARCH_BASE_URL` (for `api/*` endpoints). Each request uses the appropriate URL; the client does not pass a base URL. To point at a different gateway, change these constants in the package and rebuild.

---

## Build and test

```bash
npm run build
npm test
```

Build outputs: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types). Test runs unit checks and, if `API_KEY` is set, a live health check.
