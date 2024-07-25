export const STAGING_WEBSITE_URL = "https://resumebuilder.joinswiftly.com";
export const LIVE_WEBSITE_URL = "https://app.careerai.io";

// state handler
// two state should be always false
export const EXTENSION_IN_LOCAL = false;
export const EXTENSION_IN_STAGING = false;
export const EXTENSION_IN_LIVE = true;

export const BASE_URL = EXTENSION_IN_LIVE
  ? "https://backend.careerai.io/api/v1"
  : "https://d2fa6tipx2eq6v.cloudfront.net/api/v1";
export const VA_BASE_URL = EXTENSION_IN_LIVE
  ? "https://backend.careerai.io/api/v1/va"
  : "https://d2fa6tipx2eq6v.cloudfront.net/api/v1/va";

export const WEBSITE_URL = EXTENSION_IN_LIVE
  ? "https://app.careerai.io"
  : "https://resumebuilder.joinswiftly.com";

// export const BASE_URL = "https://backend.careerai.io/api/v1";
// export const VA_BASE_URL = "https://backend.careerai.io/api/v1/va";
