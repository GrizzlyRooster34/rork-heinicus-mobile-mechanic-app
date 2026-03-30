let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(nextAccessToken: string | null, nextRefreshToken: string | null) {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAuthToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}
