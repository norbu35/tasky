import { Platform } from 'react-native';

import { ApiError } from './api/types';

export interface MobileApiClient {
  setTokenRefreshDelegate(delegate: TokenRefreshDelegate): void;
}

const API_PATH_PREFIX = '/api/v1';

export function resolveDefaultLocalApiBaseUrl(platform: string): string {
  // Android emulators reach services on the host machine through 10.0.2.2, not localhost.
  return platform === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
}

function normalizeBaseUrl(rawBaseUrl: string): string {
  const parsed = new URL(rawBaseUrl.trim());
  const normalizedPath = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname =
    normalizedPath === '' || normalizedPath === '/' ? API_PATH_PREFIX : normalizedPath;
  return parsed.toString();
}

function resolveApiUrl(baseUrl: string, path: string): URL {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(relativePath, normalizedBase);
}

export function buildBaseUrl(): string {
  const maybeGlobal = globalThis as { __TASKY_API_BASE_URL__?: string };
  if (
    typeof maybeGlobal.__TASKY_API_BASE_URL__ === 'string' &&
    maybeGlobal.__TASKY_API_BASE_URL__
  ) {
    return normalizeBaseUrl(maybeGlobal.__TASKY_API_BASE_URL__);
  }
  const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;
  if (
    typeof runtimeEnv?.['EXPO_PUBLIC_API_BASE_URL'] === 'string' &&
    runtimeEnv['EXPO_PUBLIC_API_BASE_URL'].trim().length > 0
  ) {
    return normalizeBaseUrl(runtimeEnv['EXPO_PUBLIC_API_BASE_URL']);
  }
  return normalizeBaseUrl(resolveDefaultLocalApiBaseUrl(Platform.OS));
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
  } catch {
    // Fall back to generic response message.
  }
  return `Request failed with status ${response.status}`;
}

export interface TokenRefreshDelegate {
  getRefreshToken(): string | null;
  onTokensRefreshed(accessToken: string, refreshToken: string): void;
  onRefreshFailed(): void;
}

export class HttpMobileApiClient implements MobileApiClient {
  private readonly baseUrl: string;
  private tokenRefreshDelegate: TokenRefreshDelegate | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseUrl = buildBaseUrl()) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  setTokenRefreshDelegate(delegate: TokenRefreshDelegate): void {
    this.tokenRefreshDelegate = delegate;
  }

  private async refreshAccessToken(): Promise<string> {
    const delegate = this.tokenRefreshDelegate;
    if (!delegate) throw new ApiError(401, 'No token refresh delegate configured');

    const refreshToken = delegate.getRefreshToken();
    if (!refreshToken) {
      delegate.onRefreshFailed();
      throw new ApiError(401, 'No refresh token available');
    }

    const url = resolveApiUrl(this.baseUrl, '/auth/token/refresh');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      delegate.onRefreshFailed();
      throw new ApiError(response.status, 'Token refresh failed');
    }

    const body = (await response.json()) as { access_token: string; refresh_token: string };
    delegate.onTokensRefreshed(body.access_token, body.refresh_token);
    return body.access_token;
  }

  private async refreshAccessTokenOnce(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  async requestJson<T>(
    path: string,
    init: RequestInit,
    accessToken?: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = resolveApiUrl(this.baseUrl, path);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...init,
        headers,
      });
    } catch (err) {
      console.error(
        `[ApiClient Error] Network failure fetching ${init.method || 'GET'} ${url.toString()}:`,
        err,
      );
      throw err;
    }

    if (response.status === 401 && accessToken && this.tokenRefreshDelegate) {
      const newToken = await this.refreshAccessTokenOnce();
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Content-Type', 'application/json');
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      const retryResponse = await fetch(url.toString(), { ...init, headers: retryHeaders });
      if (!retryResponse.ok) {
        const errorMessage = await readErrorMessage(retryResponse);
        throw new ApiError(retryResponse.status, errorMessage);
      }
      return (await retryResponse.json()) as T;
    }

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      console.error(
        `[ApiClient Error] ${init.method || 'GET'} ${url.toString()} failed with status ${response.status}: ${errorMessage}`,
      );
      throw new ApiError(response.status, errorMessage);
    }

    return (await response.json()) as T;
  }

  async requestVoid(path: string, init: RequestInit, accessToken?: string): Promise<void> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = resolveApiUrl(this.baseUrl, path).toString();

    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers,
      });
    } catch (err) {
      console.error(
        `[ApiClient Error] Network failure fetching ${init.method || 'GET'} ${url}:`,
        err,
      );
      throw err;
    }

    if (response.status === 401 && accessToken && this.tokenRefreshDelegate) {
      const newToken = await this.refreshAccessTokenOnce();
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set('Content-Type', 'application/json');
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      const retryResponse = await fetch(url, { ...init, headers: retryHeaders });
      if (!retryResponse.ok) {
        const errorMessage = await readErrorMessage(retryResponse);
        throw new ApiError(retryResponse.status, errorMessage);
      }
      return;
    }

    if (!response.ok) {
      const errorMessage = await readErrorMessage(response);
      console.error(
        `[ApiClient Error] ${init.method || 'GET'} ${url} failed with status ${response.status}: ${errorMessage}`,
      );
      throw new ApiError(response.status, errorMessage);
    }
  }
}

let _sharedClient: HttpMobileApiClient | null = null;

export function createMobileApiClient(baseUrl?: string): HttpMobileApiClient {
  if (baseUrl) return new HttpMobileApiClient(baseUrl);
  if (!_sharedClient) _sharedClient = new HttpMobileApiClient();
  return _sharedClient;
}

export function getSharedApiClient(): HttpMobileApiClient {
  if (!_sharedClient) _sharedClient = new HttpMobileApiClient();
  return _sharedClient;
}
