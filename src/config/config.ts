export const STAGING_WEBSITE_URL =
  "https://d2fa6tipx2eq6v.cloudfront.net/public";
export const LIVE_WEBSITE_URL = "https://backend.careerai.io/public";

// two state should be always false
export const EXTENSION_IN_LIVE = true;

export const BASE_URL = EXTENSION_IN_LIVE
  ? LIVE_WEBSITE_URL
  : STAGING_WEBSITE_URL;
