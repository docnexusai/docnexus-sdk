/**
 * Base URLs for SDK requests. Stored in package; client does not provide them.
 */
export const DOCNEXUS_LINK_BASE_URL = "https://api.docnexus.ai";
export const ADVANCED_SEARCH_BASE_URL = "https://api.docnexus.ai";

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
