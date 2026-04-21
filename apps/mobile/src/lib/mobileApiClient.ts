import { Platform } from 'react-native';

import { HttpTransport, normalizeBaseUrl } from '@tasky/core/http';
import type { TokenRefreshDelegate } from '@tasky/core/http';
export type { TokenRefreshDelegate } from '@tasky/core/http';

export interface MobileApiClient {
  setTokenRefreshDelegate(delegate: TokenRefreshDelegate): void;
}

export function resolveDefaultLocalApiBaseUrl(platform: string): string {
  return platform === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
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

export class HttpMobileApiClient extends HttpTransport implements MobileApiClient {
  constructor(baseUrl?: string) {
    super({
      baseUrl: normalizeBaseUrl(baseUrl ?? buildBaseUrl()),
    });
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
