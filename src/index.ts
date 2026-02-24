/**
 * DocNexus API client — use with API keys (Kong Key Auth) or Bearer JWT.
 * Base URL for docnexus-link is stored in the package; client only provides apiKey.
 *
 * @example
 * const client = new DocnexusClient({ apiKey: 'dnx_key_xxx' });
 * const results = await client.search({ first_name: 'John', last_name: 'Doe', country: 'US' });
 * const profile = await client.getProfileByNpi('1234567890');
 */

import { DOCNEXUS_LINK_BASE_URL } from "./config";
import type {
  SearchParams,
  SearchResponse,
  USProfileResponse,
  TokenResponse,
} from "./types";

export type { SearchParams, SearchResponse, USProfileResponse, TokenResponse } from "./types";

export {
  call,
  createPlatformClient,
  ENDPOINT_REGISTRY,
} from "./platform";
export type {
  PlatformCallOptions,
  PlatformClientConfig,
  EndpointDef,
  DocnexusLinkSearchPayload,
  DocnexusLinkProfilePayload,
  AdvancedSearchQueryPayload,
} from "./platform";

const DEFAULT_VERSION = "v5";

export interface DocnexusClientConfig {
  /**
   * API key for Kong Key Auth. Sent as header `apikey: <key>`.
   * Omit if using only Bearer token (e.g. after login).
   */
  apiKey?: string;
  /** API version prefix (default "v5"). */
  version?: string;
  /** Custom fetch (e.g. for Node 18+, or custom headers). */
  fetch?: typeof fetch;
}

export class DocnexusClient {
  private baseUrl: string;
  private apiKey?: string;
  private version: string;
  private bearerToken?: string;
  private fetchFn: typeof fetch;

  constructor(config: DocnexusClientConfig = {}) {
    this.baseUrl = DOCNEXUS_LINK_BASE_URL.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.version = config.version ?? DEFAULT_VERSION;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }

  /** Set API key (Kong). Sent as `apikey` header. */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /** Set Bearer token (JWT). Takes precedence over API key when both present. */
  setBearerToken(token: string): void {
    this.bearerToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { body?: unknown; headers?: Record<string, string> }
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...options?.headers,
    };
    if (this.bearerToken) {
      headers["Authorization"] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers["apikey"] = this.apiKey;
    }
    if (options?.body != null && method !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    const res = await this.fetchFn(url, {
      method,
      headers,
      body: options?.body != null ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      let detail: string;
      try {
        const j = JSON.parse(text);
        detail = j.detail ?? text;
      } catch {
        detail = text || res.statusText;
      }
      throw new Error(`DocNexus API ${res.status}: ${detail}`);
    }
    if (res.headers.get("content-type")?.includes("application/json")) {
      return res.json() as Promise<T>;
    }
    return res.text() as Promise<T>;
  }

  /**
   * Search for providers (v5 by default).
   * Requires API key or Bearer token.
   */
  async search(params: SearchParams, version: string = this.version): Promise<SearchResponse> {
    return this.request<SearchResponse>("POST", `/${version}/search`, {
      body: {
        first_name: params.first_name,
        last_name: params.last_name,
        specialty: params.specialty ?? null,
        country: params.country ?? null,
        other_info: params.other_info ?? null,
        is_refresh_data: params.is_refresh_data ?? false,
      },
    });
  }

  /**
   * Get US provider profile by NPI (v5 only).
   * Requires API key or Bearer token.
   */
  async getProfileByNpi(npiNumber: string, version: string = this.version): Promise<USProfileResponse> {
    const npi = String(npiNumber).replace(/\D/g, "");
    if (npi.length !== 10) {
      throw new Error("NPI must be 10 digits");
    }
    return this.request<USProfileResponse>("GET", `/${version}/profile/us/${npi}`);
  }

  /** Health check (no auth required). */
  async health(version: string = this.version): Promise<{ status: string }> {
    return this.request<{ status: string }>("GET", `/${version}/health`);
  }

  /**
   * Login with username/password. Returns JWT; call setBearerToken(access_token) to use it.
   * No API key needed for this call.
   */
  async login(username: string, password: string, version: string = this.version): Promise<TokenResponse> {
    const form = new URLSearchParams({ username, password });
    const url = `${this.baseUrl}/${version}/token`;
    const res = await this.fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      let detail: string;
      try {
        const j = JSON.parse(text);
        detail = j.detail ?? text;
      } catch {
        detail = text || res.statusText;
      }
      throw new Error(`Login failed ${res.status}: ${detail}`);
    }
    const data = (await res.json()) as TokenResponse;
    this.bearerToken = data.access_token;
    return data;
  }

  /**
   * Refresh access token. Requires Bearer refresh token or prior login.
   */
  async refresh(refreshToken?: string, version: string = this.version): Promise<{ access_token: string; token_type: string }> {
    const token = refreshToken ?? this.bearerToken;
    if (!token) throw new Error("No refresh token provided");
    return this.request("POST", `/${version}/refresh`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export default DocnexusClient;
