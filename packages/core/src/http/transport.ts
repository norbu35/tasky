/**
 * Shared HTTP transport for web and mobile clients.
 * Provides base URL normalization, request execution, 401 interception,
 * and token refresh with single-flight dedup.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface TokenRefreshDelegate {
  getRefreshToken(): string | null;
  onTokensRefreshed(accessToken: string, refreshToken: string): void;
  onRefreshFailed(): void;
}

const DEFAULT_API_PATH_PREFIX = '/api/v1';

export function normalizeBaseUrl(
  rawBaseUrl: string,
  apiPathPrefix = DEFAULT_API_PATH_PREFIX,
): string {
  const parsed = new URL(rawBaseUrl.trim());
  const normalizedPath = parsed.pathname.replace(/\/+$/, '');
  parsed.pathname =
    normalizedPath === '' || normalizedPath === '/' ? apiPathPrefix : normalizedPath;
  return parsed.toString();
}

export function resolveApiUrl(baseUrl: string, path: string): URL {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(relativePath, normalizedBase);
}

export async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
    if (body && typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Ignore parse errors and fall back to status text.
  }
  return `Request failed with status ${response.status}`;
}

export interface HttpTransportConfig {
  baseUrl: string;
  /** Optional callback when a 401 occurs (refresh failure or no delegate configured). */
  onUnauthorized?: () => void;
}

export class HttpTransport {
  protected readonly baseUrl: string;
  private tokenRefreshDelegate: TokenRefreshDelegate | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly onUnauthorized: (() => void) | undefined;

  constructor(config: HttpTransportConfig) {
    this.baseUrl = config.baseUrl;
    this.onUnauthorized = config.onUnauthorized;
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

  public async requestJson<T>(
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

    const response = await fetch(url.toString(), { ...init, headers });

    if (response.status === 401 && accessToken && this.tokenRefreshDelegate) {
      try {
        const newToken = await this.refreshAccessTokenOnce();
        const retryHeaders = new Headers(init.headers);
        retryHeaders.set('Content-Type', 'application/json');
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        const retryResponse = await fetch(url.toString(), { ...init, headers: retryHeaders });
        if (!retryResponse.ok) {
          throw new ApiError(retryResponse.status, await readErrorMessage(retryResponse));
        }
        return (await retryResponse.json()) as T;
      } catch (refreshError) {
        this.onUnauthorized?.();
        throw refreshError instanceof ApiError
          ? refreshError
          : new ApiError(401, 'Token refresh failed');
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }
      throw new ApiError(response.status, await readErrorMessage(response));
    }

    return (await response.json()) as T;
  }

  public async requestVoid(path: string, init: RequestInit, accessToken?: string): Promise<void> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = resolveApiUrl(this.baseUrl, path).toString();
    const response = await fetch(url, { ...init, headers });

    if (response.status === 401 && accessToken && this.tokenRefreshDelegate) {
      try {
        const newToken = await this.refreshAccessTokenOnce();
        const retryHeaders = new Headers(init.headers);
        retryHeaders.set('Content-Type', 'application/json');
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        const retryUrl = resolveApiUrl(this.baseUrl, path).toString();
        const retryResponse = await fetch(retryUrl, { ...init, headers: retryHeaders });
        if (!retryResponse.ok) {
          throw new ApiError(retryResponse.status, await readErrorMessage(retryResponse));
        }
        return;
      } catch (refreshError) {
        this.onUnauthorized?.();
        throw refreshError instanceof ApiError
          ? refreshError
          : new ApiError(401, 'Token refresh failed');
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.onUnauthorized?.();
      }
      throw new ApiError(response.status, await readErrorMessage(response));
    }
  }
}
