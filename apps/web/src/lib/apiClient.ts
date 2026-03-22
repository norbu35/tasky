import type { components } from "@tasky/sdk";

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

export interface VerificationDetail {
    id: string;
    user_id: string;
    user_phone: string;
    user_name: string;
    id_card_front_url: string;
    id_card_back_url: string;
    selfie_url?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    admin_notes: string | null;
    submitted_at: string;
    reviewed_at: string | null;
}

export interface FeatureToggle {
    feature_name: string;
    is_enabled: boolean;
    updated_by: string;
    updated_at: string;
}

export interface StrikePolicy {
    strikeWindowDays: number;
    strikeThreshold: number;
    firstSuspensionDays: number;
    repeatSuspensionDays: number;
    repeatOffenseWindowDays: number;
    autoUnsuspendEnabled: boolean;
    updatedAt?: string;
}

export interface StrikePolicyUpdateRequest {
    strikeWindowDays?: number;
    strikeThreshold?: number;
    firstSuspensionDays?: number;
    repeatSuspensionDays?: number;
    repeatOffenseWindowDays?: number;
    autoUnsuspendEnabled?: boolean;
}

export interface AdminDisputeDetail {
    dispute: Record<string, unknown>;
    booking: Record<string, unknown>;
    conversation_id: string | null;
    evidence_messages: unknown[];
}

export interface CategorySchemaVersion {
    version: number;
    status: string;
    schema_json: Record<string, unknown>;
    created_at: string;
}

export interface AdminCategoryPayload {
    name: string;
    name_mn: string;
    icon_url: string;
    sort_order: number;
    intake_enabled: boolean;
}

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
            intake_answers?: Record<string, unknown>;
            intake_schema_version?: number;
            scope_summary?: string;
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

    // ─── Admin Methods ───────────────────────────────────────────────

    adminSearchUsers(accessToken: string, phone: string): Promise<CursorPage<User>>;

    adminBanUser(accessToken: string, userId: string, reason: string): Promise<User>;

    adminUnbanUser(accessToken: string, userId: string): Promise<User>;

    adminListFlaggedMessages(accessToken: string): Promise<CursorPage<Message>>;

    adminListPendingVerifications(accessToken: string): Promise<VerificationDetail[]>;

    adminApproveVerification(accessToken: string, verificationId: string): Promise<VerificationDetail>;

    adminRejectVerification(accessToken: string, verificationId: string, reason: string): Promise<VerificationDetail>;

    adminListDisputes(accessToken: string): Promise<CursorPage<Dispute>>;

    adminGetDispute(accessToken: string, disputeId: string): Promise<AdminDisputeDetail>;

    adminResolveDispute(
        accessToken: string,
        disputeId: string,
        resolution: string,
        notes: string,
        idempotencyKey: string
    ): Promise<Dispute>;

    adminGetStrikePolicy(accessToken: string): Promise<StrikePolicy>;

    adminUpdateStrikePolicy(
        accessToken: string,
        payload: Partial<StrikePolicyUpdateRequest>
    ): Promise<StrikePolicy>;

    adminListFeatureToggles(accessToken: string): Promise<FeatureToggle[]>;

    adminUpdateFeatureToggle(
        accessToken: string,
        featureName: string,
        isEnabled: boolean
    ): Promise<FeatureToggle>;

    adminConciergeAssignTask(
        accessToken: string,
        taskId: string,
        taskerId: string,
        overrideReason: string,
        liabilityDisclaimerAccepted: boolean,
        idempotencyKey: string
    ): Promise<Booking>;

    adminListCategories(accessToken: string): Promise<CursorPage<Category>>;

    adminCreateCategory(accessToken: string, payload: AdminCategoryPayload): Promise<Category>;

    adminUpdateCategory(
        accessToken: string,
        categoryId: string,
        payload: Partial<AdminCategoryPayload>
    ): Promise<Category>;

    adminListCategorySchemas(accessToken: string, categoryId: string): Promise<CategorySchemaVersion[]>;

    adminCreateCategorySchema(
        accessToken: string,
        categoryId: string,
        schemaJson: Record<string, unknown>,
        activateAs?: string
    ): Promise<CategorySchemaVersion>;

    adminActivateCategorySchema(
        accessToken: string,
        categoryId: string,
        version: number,
        mode: string
    ): Promise<CategorySchemaVersion>;
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
            intake_answers?: Record<string, unknown>;
            intake_schema_version?: number;
            scope_summary?: string;
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

    // ─── Admin Methods ───────────────────────────────────────────────

    adminSearchUsers(accessToken: string, phone: string): Promise<CursorPage<User>> {
        return this.requestJson<CursorPage<User>>(
            "/admin/users",
            {method: "GET"},
            accessToken,
            {phone}
        );
    }

    adminBanUser(accessToken: string, userId: string, reason: string): Promise<User> {
        return this.requestJson<User>(
            `/admin/users/${userId}/ban`,
            {
                method: "POST",
                body: JSON.stringify({reason})
            },
            accessToken
        );
    }

    adminUnbanUser(accessToken: string, userId: string): Promise<User> {
        return this.requestJson<User>(
            `/admin/users/${userId}/unban`,
            {method: "POST"},
            accessToken
        );
    }

    adminListFlaggedMessages(accessToken: string): Promise<CursorPage<Message>> {
        return this.requestJson<CursorPage<Message>>(
            "/admin/messages/flagged",
            {method: "GET"},
            accessToken
        );
    }

    adminListPendingVerifications(accessToken: string): Promise<VerificationDetail[]> {
        return this.requestJson<VerificationDetail[]>(
            "/admin/verifications/pending",
            {method: "GET"},
            accessToken
        );
    }

    adminApproveVerification(accessToken: string, verificationId: string): Promise<VerificationDetail> {
        return this.requestJson<VerificationDetail>(
            `/admin/verifications/${verificationId}/approve`,
            {method: "POST"},
            accessToken
        );
    }

    adminRejectVerification(accessToken: string, verificationId: string, reason: string): Promise<VerificationDetail> {
        return this.requestJson<VerificationDetail>(
            `/admin/verifications/${verificationId}/reject`,
            {
                method: "POST",
                body: JSON.stringify({reason})
            },
            accessToken
        );
    }

    adminListDisputes(accessToken: string): Promise<CursorPage<Dispute>> {
        return this.requestJson<CursorPage<Dispute>>(
            "/admin/disputes",
            {method: "GET"},
            accessToken
        );
    }

    adminGetDispute(accessToken: string, disputeId: string): Promise<AdminDisputeDetail> {
        return this.requestJson<AdminDisputeDetail>(
            `/admin/disputes/${disputeId}`,
            {method: "GET"},
            accessToken
        );
    }

    adminResolveDispute(
        accessToken: string,
        disputeId: string,
        resolution: string,
        notes: string,
        idempotencyKey: string
    ): Promise<Dispute> {
        return this.requestJson<Dispute>(
            `/admin/disputes/${disputeId}/resolve`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({resolution, notes})
            },
            accessToken
        );
    }

    adminGetStrikePolicy(accessToken: string): Promise<StrikePolicy> {
        return this.requestJson<StrikePolicy>(
            "/admin/moderation/strike-policy",
            {method: "GET"},
            accessToken
        );
    }

    adminUpdateStrikePolicy(
        accessToken: string,
        payload: Partial<StrikePolicyUpdateRequest>
    ): Promise<StrikePolicy> {
        return this.requestJson<StrikePolicy>(
            "/admin/moderation/strike-policy",
            {
                method: "PUT",
                body: JSON.stringify(payload)
            },
            accessToken
        );
    }

    adminListFeatureToggles(accessToken: string): Promise<FeatureToggle[]> {
        return this.requestJson<FeatureToggle[]>(
            "/admin/features/toggles",
            {method: "GET"},
            accessToken
        );
    }

    adminUpdateFeatureToggle(
        accessToken: string,
        featureName: string,
        isEnabled: boolean
    ): Promise<FeatureToggle> {
        return this.requestJson<FeatureToggle>(
            "/admin/features/toggles",
            {
                method: "PUT",
                body: JSON.stringify({feature_name: featureName, is_enabled: isEnabled})
            },
            accessToken
        );
    }

    adminConciergeAssignTask(
        accessToken: string,
        taskId: string,
        taskerId: string,
        overrideReason: string,
        liabilityDisclaimerAccepted: boolean,
        idempotencyKey: string
    ): Promise<Booking> {
        return this.requestJson<Booking>(
            `/admin/tasks/${taskId}/concierge-assign`,
            {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify({
                    tasker_id: taskerId,
                    override_reason: overrideReason,
                    liability_disclaimer_accepted: liabilityDisclaimerAccepted
                })
            },
            accessToken
        );
    }

    adminListCategories(accessToken: string): Promise<CursorPage<Category>> {
        return this.requestJson<CursorPage<Category>>(
            "/admin/categories",
            {method: "GET"},
            accessToken
        );
    }

    adminCreateCategory(accessToken: string, payload: AdminCategoryPayload): Promise<Category> {
        return this.requestJson<Category>(
            "/admin/categories",
            {
                method: "POST",
                body: JSON.stringify(payload)
            },
            accessToken
        );
    }

    adminUpdateCategory(
        accessToken: string,
        categoryId: string,
        payload: Partial<AdminCategoryPayload>
    ): Promise<Category> {
        return this.requestJson<Category>(
            `/admin/categories/${categoryId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            },
            accessToken
        );
    }

    adminListCategorySchemas(accessToken: string, categoryId: string): Promise<CategorySchemaVersion[]> {
        return this.requestJson<CategorySchemaVersion[]>(
            `/admin/categories/${categoryId}/schemas`,
            {method: "GET"},
            accessToken
        );
    }

    adminCreateCategorySchema(
        accessToken: string,
        categoryId: string,
        schemaJson: Record<string, unknown>,
        activateAs?: string
    ): Promise<CategorySchemaVersion> {
        return this.requestJson<CategorySchemaVersion>(
            `/admin/categories/${categoryId}/schemas`,
            {
                method: "POST",
                body: JSON.stringify({schema_json: schemaJson, activate_as: activateAs})
            },
            accessToken
        );
    }

    adminActivateCategorySchema(
        accessToken: string,
        categoryId: string,
        version: number,
        mode: string
    ): Promise<CategorySchemaVersion> {
        return this.requestJson<CategorySchemaVersion>(
            `/admin/categories/${categoryId}/schemas/${version}/activate`,
            {
                method: "POST",
                body: JSON.stringify({mode})
            },
            accessToken
        );
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
            if (response.status === 401 && typeof window !== "undefined") {
                window.dispatchEvent(new Event("tasky:unauthorized"));
            }
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
            if (response.status === 401 && typeof window !== "undefined") {
                window.dispatchEvent(new Event("tasky:unauthorized"));
            }
            throw new ApiError(response.status, await readErrorMessage(response));
        }
    }
}

export function createApiClient(baseUrl?: string): ApiClient {
    return new HttpApiClient(baseUrl);
}
