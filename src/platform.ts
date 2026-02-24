/**
 * DocNexus API Platform SDK — call endpoints by name with API key from the API key platform.
 * Supports docnexus-link (v5/search, v5/profile) and advanced-search (api/query).
 *
 * @example
 * import { createPlatformClient, call } from '@docnexus/api-client';
 *
 * // Option 1: create client, then call by endpoint name
 * const client = createPlatformClient({ baseUrl: 'https://api.docnexus.ai', apiKey: 'dnx_xxx' });
 * const results = await client.call('v5/search', { first_name: 'John', last_name: 'Doe' });
 *
 * // Option 2: one-off call
 * const data = await call({
 *   baseUrl: 'https://api.docnexus.ai',
 *   apiKey: 'dnx_xxx',
 *   endpointName: 'api/query',
 *   payload: { outputCategory: 'type_1_npi', limit: 10 }
 * });
 */

export type EndpointDef = {
  method: "GET" | "POST";
  /** Path with optional :param placeholders (e.g. v5/profile/us/:npi). */
  pathTemplate: string;
  /** For GET with path params, param names to read from payload (e.g. ['npi']). */
  pathParams?: string[];
};

/**
 * Endpoint registry: endpoint name (URI path) -> method and path template.
 * Matches docnexus-link and advanced-search backend routes.
 */
export const ENDPOINT_REGISTRY: Record<string, EndpointDef> = {
  // DocNexus Link (v5)
  "v5/search": {
    method: "POST",
    pathTemplate: "v5/search",
  },
  "v5/profile/us/:npi": {
    method: "GET",
    pathTemplate: "v5/profile/us/:npi",
    pathParams: ["npi"],
  },
  "v5/health": {
    method: "GET",
    pathTemplate: "v5/health",
  },
  // Advanced Search
  "api/query": {
    method: "POST",
    pathTemplate: "api/query",
  },
  "api/generate-sql": {
    method: "POST",
    pathTemplate: "api/generate-sql",
  },
  "api/generate-form-payload": {
    method: "POST",
    pathTemplate: "api/generate-form-payload",
  },
  "api/export": {
    method: "POST",
    pathTemplate: "api/export",
  },
};

/** Payload for v5/search (docnexus-link). */
export interface DocnexusLinkSearchPayload {
  first_name: string;
  last_name: string;
  specialty?: string | null;
  country?: string | null;
  other_info?: Record<string, unknown> | null;
  is_refresh_data?: boolean;
}

/** Payload for v5/profile (path param only). */
export interface DocnexusLinkProfilePayload {
  npi: string;
}

/** Payload for api/query (advanced-search) — see backend QueryConfig. */
export type AdvancedSearchQueryPayload = Record<string, unknown>;

export interface PlatformCallOptions {
  /** Gateway base URL (Kong or origin). No trailing slash. */
  baseUrl: string;
  /** API key from the API key platform. Sent as `apikey` header (Kong Key Auth). */
  apiKey: string;
  /** Endpoint name (URI path), e.g. "v5/search", "v5/profile/us/:npi", "api/query". */
  endpointName: string;
  /** Request body (POST) or path/query params (GET). For v5/profile use `{ npi: "1234567890" }`. */
  payload?: Record<string, unknown>;
  /** Custom fetch. */
  fetch?: typeof fetch;
}

function resolvePath(template: string, pathParams?: string[], payload?: Record<string, unknown>): string {
  let path = template;
  if (pathParams?.length && payload) {
    for (const param of pathParams) {
      const value = payload[param];
      if (value === undefined || value === null) {
        throw new Error(`Missing path parameter: ${param}`);
      }
      let str = String(value);
      if (param === "npi") {
        str = str.replace(/\D/g, "");
        if (str.length !== 10) {
          throw new Error("NPI must be 10 digits");
        }
      } else {
        str = encodeURIComponent(str);
      }
      path = path.replace(`:${param}`, str);
    }
  }
  if (/:[\w]+/.test(path)) {
    throw new Error("Unresolved path placeholder in " + template);
  }
  return path;
}

/**
 * Call a DocNexus API Platform endpoint by name.
 * Use the API key generated in the API key platform; endpoint name is the URI path.
 */
export async function call<T = unknown>(options: PlatformCallOptions): Promise<T> {
  const { baseUrl, apiKey, endpointName, payload, fetch: fetchFn = globalThis.fetch } = options;
  const base = baseUrl.replace(/\/$/, "");
  const def = ENDPOINT_REGISTRY[endpointName];
  if (!def) {
    const known = Object.keys(ENDPOINT_REGISTRY).join(", ");
    throw new Error(`Unknown endpoint: "${endpointName}". Known: ${known}`);
  }
  const path = resolvePath(def.pathTemplate, def.pathParams, payload);
  const url = path.startsWith("http") ? path : `${base}/${path}`;
  const headers: Record<string, string> = {
    apikey: apiKey,
  };
  let body: string | undefined;
  if (def.method === "POST" && payload != null) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }
  const res = await fetchFn(url, { method: def.method, headers, body });
  if (!res.ok) {
    const text = await res.text();
    let detail: string;
    try {
      const j = JSON.parse(text);
      detail = j.detail ?? j.error ?? text;
    } catch {
      detail = text || res.statusText;
    }
    throw new Error(`DocNexus API ${res.status}: ${detail}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}

export interface PlatformClientConfig {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof fetch;
}

/**
 * Create a client that calls platform endpoints by name.
 * Use the API key from the API key platform (api.docnexus.ai or your Kong gateway).
 */
export function createPlatformClient(config: PlatformClientConfig) {
  const { baseUrl, apiKey, fetch: fetchFn } = config;
  return {
    /**
     * Call an endpoint by name (URI path). Payload is the request body for POST or path/query params for GET.
     * @param endpointName e.g. "v5/search", "v5/profile/us/:npi", "api/query"
     * @param payload e.g. { first_name, last_name } for v5/search; { npi: "1234567890" } for v5/profile
     */
    call<T = unknown>(endpointName: string, payload?: Record<string, unknown>): Promise<T> {
      return call<T>({ baseUrl, apiKey, endpointName, payload, fetch: fetchFn });
    },
    /** List of supported endpoint names. */
    getEndpointNames(): string[] {
      return Object.keys(ENDPOINT_REGISTRY);
    },
  };
}
