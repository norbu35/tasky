import type { components } from "@tasky/sdk";

export type User = components["schemas"]["User"];
export type Profile = components["schemas"]["Profile"];
export type Category = components["schemas"]["Category"];
export type PublicTask = components["schemas"]["PublicTask"];
export type Task = components["schemas"]["Task"];
export type TaskApplication = components["schemas"]["TaskApplication"];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface CursorPage<T> {
  data: T[];
  cursor: {
    next: string | null;
    prev: string | null;
  };
}

export interface TaskFilters {
  categoryId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface MobileApiClient {
  requestOtp(phone: string): Promise<string>;
  verifyOtp(phone: string, code: string): Promise<AuthTokens>;
  getMyProfile(accessToken: string): Promise<Profile>;
  updateMyProfile(
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string | null }
  ): Promise<Profile>;
  getAvatarUploadUrl(
    accessToken: string,
    contentType: "image/jpeg" | "image/png" | "image/webp"
  ): Promise<{ uploadUrl: string; storageKey: string }>;
  activateTaskerRole(accessToken: string): Promise<User>;
  listCategories(accessToken: string): Promise<CursorPage<Category>>;
  createTask(
    accessToken: string,
    payload: {
      category_id: string;
      description: string;
      budget: number;
      location_lat: number;
      location_lng: number;
      location_text: string;
      scheduled_at: string;
      photo_keys?: string[];
    }
  ): Promise<Task>;
  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>>;
  applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildBaseUrl(): string {
  const maybeGlobal = globalThis as { __TASKY_API_BASE_URL__?: string };
  if (typeof maybeGlobal.__TASKY_API_BASE_URL__ === "string" && maybeGlobal.__TASKY_API_BASE_URL__) {
    return maybeGlobal.__TASKY_API_BASE_URL__;
  }
  return "http://localhost:8080";
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === "string" && body.message.length > 0) {
      return body.message;
    }
  } catch {
    // Fall back to generic response message.
  }
  return `Request failed with status ${response.status}`;
}

export class HttpMobileApiClient implements MobileApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = buildBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
    accessToken?: string,
    query?: Record<string, string | number | undefined>
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      ...init,
      headers
    });

    if (!response.ok) {
      throw new ApiError(response.status, await readErrorMessage(response));
    }

    return (await response.json()) as T;
  }

  async requestOtp(phone: string): Promise<string> {
    const response = await this.requestJson<{ message: string }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone })
    });
    return response.message;
  }

  verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
      "/auth/otp/verify",
      {
        method: "POST",
        body: JSON.stringify({ phone, code })
      }
    ).then((response) => ({
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user
    }));
  }

  getMyProfile(accessToken: string): Promise<Profile> {
    return this.requestJson<Profile>("/users/me", { method: "GET" }, accessToken);
  }

  updateMyProfile(
    accessToken: string,
    payload: { full_name?: string; avatar_url?: string | null }
  ): Promise<Profile> {
    return this.requestJson<Profile>(
      "/users/me",
      {
        method: "PUT",
        body: JSON.stringify(payload)
      },
      accessToken
    );
  }

  getAvatarUploadUrl(
    accessToken: string,
    contentType: "image/jpeg" | "image/png" | "image/webp"
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    return this.requestJson<{ upload_url: string; storage_key: string }>(
      "/users/me/avatar/upload-url",
      {
        method: "POST",
        body: JSON.stringify({ content_type: contentType })
      },
      accessToken
    ).then((response) => ({
      uploadUrl: response.upload_url,
      storageKey: response.storage_key
    }));
  }

  activateTaskerRole(accessToken: string): Promise<User> {
    return this.requestJson<User>("/users/me/role/tasker", { method: "POST" }, accessToken);
  }

  listCategories(accessToken: string): Promise<CursorPage<Category>> {
    return this.requestJson<CursorPage<Category>>("/categories", { method: "GET" }, accessToken, {
      limit: 100
    });
  }

  createTask(
    accessToken: string,
    payload: {
      category_id: string;
      description: string;
      budget: number;
      location_lat: number;
      location_lng: number;
      location_text: string;
      scheduled_at: string;
      photo_keys?: string[];
    }
  ): Promise<Task> {
    return this.requestJson<Task>(
      "/tasks",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      accessToken
    );
  }

  listTasks(accessToken: string, filters?: TaskFilters): Promise<CursorPage<PublicTask>> {
    return this.requestJson<CursorPage<PublicTask>>(
      "/tasks",
      { method: "GET" },
      accessToken,
      {
        category: filters?.categoryId,
        lat: filters?.lat,
        lng: filters?.lng,
        radius_km: filters?.radiusKm,
        limit: 100
      }
    );
  }

  applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication> {
    return this.requestJson<TaskApplication>(
      `/tasks/${taskId}/applications`,
      {
        method: "POST",
        body: JSON.stringify({ message })
      },
      accessToken
    );
  }
}

export function createMobileApiClient(baseUrl?: string): MobileApiClient {
  return new HttpMobileApiClient(baseUrl);
}
