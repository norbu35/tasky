import type {components} from "@tasky/sdk";

export type User = components["schemas"]["User"];
export type Profile = components["schemas"]["Profile"];
export type Category = components["schemas"]["Category"];
export type PublicTask = components["schemas"]["PublicTask"];
export type Task = components["schemas"]["Task"];
export type TaskApplication = components["schemas"]["TaskApplication"];
export type Booking = components["schemas"]["Booking"];
export type Review = components["schemas"]["Review"];
export type Dispute = components["schemas"]["Dispute"];
export type Conversation = components["schemas"]["Conversation"];
export type Message = components["schemas"]["Message"];

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

export interface BookingFilters {
    role?: "customer" | "tasker";
    status?: "ASSIGNED" | "COMPLETED" | "CANCELLED";
}

export interface ApiClient {
    loginWithFacebook(accessToken: string): Promise<AuthTokens>;

    getMyProfile(accessToken: string): Promise<Profile>;

    updateMyProfile(
        accessToken: string,
        payload: {
            full_name?: string;
            avatar_url?: string | null;
        }
    ): Promise<Profile>;

    getAvatarUploadUrl(
        accessToken: string,
        contentType: "image/jpeg" | "image/png" | "image/webp"
    ): Promise<{ uploadUrl: string; storageKey: string }>;

    getTaskPhotoUploadUrl(
        accessToken: string,
        taskId: string | null,
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

    listMyTasks(accessToken: string): Promise<CursorPage<Task>>;

    applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication>;

    listTaskApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>>;

    acceptApplication(
        accessToken: string,
        taskId: string,
        applicationId: string,
        liabilityDisclaimerAccepted: boolean,
        idempotencyKey: string
    ): Promise<Booking>;

    initiatePayment(
        accessToken: string,
        bookingId: string,
        idempotencyKey: string
    ): Promise<{ paymentUrl: string; qrCode: string }>;

    listBookings(accessToken: string, filters?: BookingFilters): Promise<CursorPage<Booking>>;

    getBooking(accessToken: string, bookingId: string): Promise<Booking>;

    cancelBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;

    completeBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking>;

    submitReview(
        accessToken: string,
        bookingId: string,
        payload: { rating: number; comment?: string | null }
    ): Promise<Review>;

    getUserReviews(accessToken: string, userId: string): Promise<CursorPage<Review>>;

    raiseDispute(
        accessToken: string,
        bookingId: string,
        reason: string,
        idempotencyKey: string
    ): Promise<Dispute>;

    getDispute(accessToken: string, disputeId: string): Promise<Dispute>;

    listConversations(accessToken: string): Promise<CursorPage<Conversation>>;

    listMessages(accessToken: string, conversationId: string): Promise<CursorPage<Message>>;

    sendMessage(accessToken: string, conversationId: string, content: string): Promise<Message>;

    registerDevice(
        accessToken: string,
        payload: { token: string; platform: "IOS" | "ANDROID" | "WEB" }
    ): Promise<string>;

    unregisterDevice(accessToken: string, token: string): Promise<void>;

    devLogin(phone: string, role: "CUSTOMER" | "TASKER" | "ADMIN"): Promise<AuthTokens>;
}

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

const API_PATH_PREFIX = "/api/v1";

function normalizeBaseUrl(rawBaseUrl: string): string {
    const parsed = new URL(rawBaseUrl.trim());
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    parsed.pathname =
        normalizedPath === "" || normalizedPath === "/" ? API_PATH_PREFIX : normalizedPath;
    return parsed.toString();
}

function resolveApiUrl(baseUrl: string, path: string): URL {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const relativePath = path.startsWith("/") ? path.slice(1) : path;
    return new URL(relativePath, normalizedBase);
}

function buildBaseUrl(): string {
    const configured = import.meta.env.VITE_API_BASE_URL;
    const rawBaseUrl =
        typeof configured === "string" && configured.trim().length > 0
            ? configured
            : "http://localhost:8080";
    return normalizeBaseUrl(rawBaseUrl);
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const body = await response.json();
        if (body && typeof body.message === "string" && body.message.length > 0) {
            return body.message;
        }
        if (body && typeof body.error === "string" && body.error.length > 0) {
            return body.error;
        }
    } catch {
        // Ignore parse errors and fall back to status text.
    }
    return `Request failed with status ${response.status}`;
}

export class HttpApiClient implements ApiClient {
    private readonly baseUrl: string;

    constructor(baseUrl = buildBaseUrl()) {
        this.baseUrl = normalizeBaseUrl(baseUrl);
    }

    loginWithFacebook(accessToken: string): Promise<AuthTokens> {
        return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
            "/auth/facebook",
            {
                method: "POST",
                body: JSON.stringify({access_token: accessToken})
            }
        ).then((response) => ({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: response.user
        }));
    }

    getMyProfile(accessToken: string): Promise<Profile> {
        return this.requestJson<Profile>("/users/me", {method: "GET"}, accessToken);
    }

    updateMyProfile(
        accessToken: string,
        payload: {
            full_name?: string;
            avatar_url?: string | null;
        }
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
                body: JSON.stringify({content_type: contentType})
            },
            accessToken
        ).then((response) => ({
            uploadUrl: response.upload_url,
            storageKey: response.storage_key
        }));
    }

    getTaskPhotoUploadUrl(
        accessToken: string,
        taskId: string | null,
        contentType: "image/jpeg" | "image/png" | "image/webp"
    ): Promise<{ uploadUrl: string; storageKey: string }> {
        const path = taskId ? `/tasks/${taskId}/photos/upload-url` : `/tasks/photos/upload-url`;
        return this.requestJson<{ upload_url: string; storage_key: string }>(
            path,
            {
                method: "POST",
                body: JSON.stringify({content_type: contentType})
            },
            accessToken
        ).then((response) => ({
            uploadUrl: response.upload_url,
            storageKey: response.storage_key
        }));
    }

    activateTaskerRole(accessToken: string): Promise<User> {
        return this.requestJson<User>("/users/me/role/tasker", {method: "POST"}, accessToken);
    }

    listCategories(accessToken: string): Promise<CursorPage<Category>> {
        return this.requestJson<CursorPage<Category>>("/categories", {method: "GET"}, accessToken, {
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
            {method: "GET"},
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

    listMyTasks(accessToken: string): Promise<CursorPage<Task>> {
        return this.requestJson<CursorPage<Task>>(
            "/tasks/mine",
            {method: "GET"},
            accessToken,
            {limit: 100}
        );
    }

    applyToTask(accessToken: string, taskId: string, message: string): Promise<TaskApplication> {
        return this.requestJson<TaskApplication>(
            `/tasks/${taskId}/applications`,
            {
                method: "POST",
                body: JSON.stringify({message})
            },
            accessToken
        );
    }

    listTaskApplications(accessToken: string, taskId: string): Promise<CursorPage<TaskApplication>> {
        return this.requestJson<CursorPage<TaskApplication>>(
            `/tasks/${taskId}/applications`,
            {method: "GET"},
            accessToken,
            {limit: 100}
        );
    }

    acceptApplication(
        accessToken: string,
        taskId: string,
        applicationId: string,
        liabilityDisclaimerAccepted: boolean,
        idempotencyKey: string
    ): Promise<Booking> {
        return this.requestJson<Booking>(
            `/tasks/${taskId}/applications/${applicationId}/accept`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({
                    liability_disclaimer_accepted: liabilityDisclaimerAccepted
                })
            },
            accessToken
        );
    }

    initiatePayment(
        accessToken: string,
        bookingId: string,
        idempotencyKey: string
    ): Promise<{ paymentUrl: string; qrCode: string }> {
        return this.requestJson<{ payment_url: string; qr_code: string }>(
            `/payments/bookings/${bookingId}/initiate`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({
                    liability_disclaimer_accepted: true
                })
            },
            accessToken
        ).then((response) => ({
            paymentUrl: response.payment_url,
            qrCode: response.qr_code
        }));
    }

    listBookings(accessToken: string, filters?: BookingFilters): Promise<CursorPage<Booking>> {
        return this.requestJson<CursorPage<Booking>>(
            "/bookings",
            {method: "GET"},
            accessToken,
            {
                role: filters?.role,
                status: filters?.status,
                limit: 100
            }
        );
    }

    getBooking(accessToken: string, bookingId: string): Promise<Booking> {
        return this.requestJson<Booking>(`/bookings/${bookingId}`, {method: "GET"}, accessToken);
    }

    cancelBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking> {
        return this.requestJson<Booking>(
            `/bookings/${bookingId}/cancel`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                }
            },
            accessToken
        );
    }

    completeBooking(accessToken: string, bookingId: string, idempotencyKey: string): Promise<Booking> {
        return this.requestJson<Booking>(
            `/bookings/${bookingId}/complete`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                }
            },
            accessToken
        );
    }

    submitReview(
        accessToken: string,
        bookingId: string,
        payload: { rating: number; comment?: string | null }
    ): Promise<Review> {
        return this.requestJson<Review>(
            `/bookings/${bookingId}/reviews`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            },
            accessToken
        );
    }

    getUserReviews(accessToken: string, userId: string): Promise<CursorPage<Review>> {
        return this.requestJson<CursorPage<Review>>(
            `/users/${userId}/reviews`,
            {method: "GET"},
            accessToken,
            {limit: 100}
        );
    }

    raiseDispute(
        accessToken: string,
        bookingId: string,
        reason: string,
        idempotencyKey: string
    ): Promise<Dispute> {
        return this.requestJson<Dispute>(
            `/bookings/${bookingId}/disputes`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({reason})
            },
            accessToken
        );
    }

    getDispute(accessToken: string, disputeId: string): Promise<Dispute> {
        return this.requestJson<Dispute>(`/disputes/${disputeId}`, {method: "GET"}, accessToken);
    }

    listConversations(accessToken: string): Promise<CursorPage<Conversation>> {
        return this.requestJson<CursorPage<Conversation>>(
            "/conversations",
            {method: "GET"},
            accessToken,
            {limit: 100}
        );
    }

    listMessages(accessToken: string, conversationId: string): Promise<CursorPage<Message>> {
        return this.requestJson<CursorPage<Message>>(
            `/conversations/${conversationId}/messages`,
            {method: "GET"},
            accessToken,
            {limit: 100}
        );
    }

    sendMessage(accessToken: string, conversationId: string, content: string): Promise<Message> {
        return this.requestJson<Message>(
            `/conversations/${conversationId}/messages`,
            {
                method: "POST",
                body: JSON.stringify({content})
            },
            accessToken
        );
    }

    registerDevice(
        accessToken: string,
        payload: { token: string; platform: "IOS" | "ANDROID" | "WEB" }
    ): Promise<string> {
        return this.requestJson<{ message?: string }>(
            "/notifications/devices",
            {
                method: "POST",
                body: JSON.stringify(payload)
            },
            accessToken
        ).then((response) => response.message ?? "Device registered.");
    }

    unregisterDevice(accessToken: string, token: string): Promise<void> {
        return this.requestVoid(`/notifications/devices/${encodeURIComponent(token)}`, {method: "DELETE"}, accessToken);
    }

    devLogin(phone: string, role: "CUSTOMER" | "TASKER" | "ADMIN"): Promise<AuthTokens> {
        return this.requestJson<{ access_token: string; refresh_token: string; user: User }>(
            "/auth/dev/login",
            {
                method: "POST",
                body: JSON.stringify({phone, role})
            }
        ).then((response) => ({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: response.user
        }));
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

        const url = resolveApiUrl(this.baseUrl, path);
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

    private async requestVoid(path: string, init: RequestInit, accessToken?: string): Promise<void> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(resolveApiUrl(this.baseUrl, path).toString(), {
            ...init,
            headers
        });

        if (!response.ok) {
            throw new ApiError(response.status, await readErrorMessage(response));
        }
    }
}

export function createApiClient(baseUrl?: string): ApiClient {
    return new HttpApiClient(baseUrl);
}
