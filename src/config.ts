/**
 * Base URLs for SDK requests. Stored in package; client does not provide them.
 * In Node, DOCNEXUS_SDK_LINK_BASE_URL / DOCNEXUS_SDK_ADVANCED_SEARCH_BASE_URL override for testing.
 */
const _env = typeof process !== "undefined" ? process.env : undefined;
export const DOCNEXUS_LINK_BASE_URL = (_env?.DOCNEXUS_SDK_LINK_BASE_URL || "https://kong-eff0a29fd0usbkc4r.kongcloud.dev/profile").replace(/\/$/, "");
export const ADVANCED_SEARCH_BASE_URL = (_env?.DOCNEXUS_SDK_ADVANCED_SEARCH_BASE_URL || "https://kong-eff0a29fd0usbkc4r.kongcloud.dev/advanced").replace(/\/$/, "");

/** Returns the base URL for an endpoint name (v5/* → docnexus-link, api/* → advanced-search). */
export function getBaseUrlForEndpoint(endpointName: string): string {
  if (endpointName.startsWith("v5/")) {
    return DOCNEXUS_LINK_BASE_URL.replace(/\/$/, "");
  }
  if (endpointName.startsWith("api/")) {
    return ADVANCED_SEARCH_BASE_URL.replace(/\/$/, "");
  }
  return DOCNEXUS_LINK_BASE_URL.replace(/\/$/, "");
}
