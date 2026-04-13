import { useMemo, createContext, useContext } from 'react';
import type {
  User,
  Message,
  VerificationDetail,
  Dispute,
  AdminDisputeDetail,
  StrikePolicy,
  StrikePolicyUpdateRequest,
  CursorPage,
  PayoutRequest,
  LeadUnlockPrice,
  LeadUnlockPricePayload,
  FeatureToggle,
  Booking,
  Category,
  AdminCategoryPayload,
  CategorySchemaVersion,
} from './apiTypes';
import { HttpApiClient } from './apiClient';

export interface AdminApiClient {
  // ─── Admin Methods ───────────────────────────────────────────────

  adminSearchUsers(accessToken: string, phone: string): Promise<CursorPage<User>>;

  adminBanUser(accessToken: string, userId: string, reason: string): Promise<User>;

  adminUnbanUser(accessToken: string, userId: string): Promise<User>;

  adminListFlaggedMessages(accessToken: string): Promise<CursorPage<Message>>;

  adminListPendingVerifications(accessToken: string): Promise<VerificationDetail[]>;

  adminApproveVerification(
    accessToken: string,
    verificationId: string,
  ): Promise<VerificationDetail>;

  adminRejectVerification(
    accessToken: string,
    verificationId: string,
    reason: string,
  ): Promise<VerificationDetail>;

  adminListDisputes(accessToken: string): Promise<CursorPage<Dispute>>;

  adminGetDispute(accessToken: string, disputeId: string): Promise<AdminDisputeDetail>;

  adminResolveDispute(
    accessToken: string,
    disputeId: string,
    resolution: string,
    notes: string,
    idempotencyKey: string,
  ): Promise<Dispute>;

  adminGetStrikePolicy(accessToken: string): Promise<StrikePolicy>;

  adminUpdateStrikePolicy(
    accessToken: string,
    payload: Partial<StrikePolicyUpdateRequest>,
  ): Promise<StrikePolicy>;

  adminListPendingPayouts(
    accessToken: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorPage<PayoutRequest>>;

  adminProcessPayout(
    accessToken: string,
    id: string,
    idempotencyKey: string,
  ): Promise<PayoutRequest>;

  adminListLeadUnlockPrices(
    accessToken: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorPage<LeadUnlockPrice>>;

  adminCreateLeadUnlockPrice(
    accessToken: string,
    payload: LeadUnlockPricePayload,
  ): Promise<LeadUnlockPrice>;

  adminListFeatureToggles(accessToken: string): Promise<FeatureToggle[]>;

  adminUpdateFeatureToggle(
    accessToken: string,
    featureName: string,
    isEnabled: boolean,
  ): Promise<FeatureToggle>;

  adminConciergeAssignTask(
    accessToken: string,
    taskId: string,
    taskerId: string,
    overrideReason: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking>;

  adminListCategories(accessToken: string): Promise<CursorPage<Category>>;

  adminCreateCategory(accessToken: string, payload: AdminCategoryPayload): Promise<Category>;

  adminUpdateCategory(
    accessToken: string,
    categoryId: string,
    payload: Partial<AdminCategoryPayload>,
  ): Promise<Category>;

  adminListCategorySchemas(
    accessToken: string,
    categoryId: string,
  ): Promise<CategorySchemaVersion[]>;

  adminCreateCategorySchema(
    accessToken: string,
    categoryId: string,
    schemaJson: Record<string, unknown>,
    activateAs?: string,
  ): Promise<CategorySchemaVersion>;

  adminActivateCategorySchema(
    accessToken: string,
    categoryId: string,
    version: number,
    mode: string,
  ): Promise<CategorySchemaVersion>;
}

export class HttpAdminApiClient extends HttpApiClient implements AdminApiClient {
  // ─── Admin Methods ───────────────────────────────────────────────

  adminSearchUsers(accessToken: string, phone: string): Promise<CursorPage<User>> {
    return this.requestJson<CursorPage<User>>('/admin/users', { method: 'GET' }, accessToken, {
      phone,
    });
  }

  adminBanUser(accessToken: string, userId: string, reason: string): Promise<User> {
    return this.requestJson<User>(
      `/admin/users/${userId}/ban`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      accessToken,
    );
  }

  adminUnbanUser(accessToken: string, userId: string): Promise<User> {
    return this.requestJson<User>(`/admin/users/${userId}/unban`, { method: 'POST' }, accessToken);
  }

  adminListFlaggedMessages(accessToken: string): Promise<CursorPage<Message>> {
    return this.requestJson<CursorPage<Message>>(
      '/admin/messages/flagged',
      { method: 'GET' },
      accessToken,
    );
  }

  adminListPendingVerifications(accessToken: string): Promise<VerificationDetail[]> {
    return this.requestJson<VerificationDetail[]>(
      '/admin/verifications/pending',
      { method: 'GET' },
      accessToken,
    );
  }

  adminApproveVerification(
    accessToken: string,
    verificationId: string,
  ): Promise<VerificationDetail> {
    return this.requestJson<VerificationDetail>(
      `/admin/verifications/${verificationId}/approve`,
      { method: 'POST' },
      accessToken,
    );
  }

  adminRejectVerification(
    accessToken: string,
    verificationId: string,
    reason: string,
  ): Promise<VerificationDetail> {
    return this.requestJson<VerificationDetail>(
      `/admin/verifications/${verificationId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      accessToken,
    );
  }

  adminListDisputes(accessToken: string): Promise<CursorPage<Dispute>> {
    return this.requestJson<CursorPage<Dispute>>('/admin/disputes', { method: 'GET' }, accessToken);
  }

  adminGetDispute(accessToken: string, disputeId: string): Promise<AdminDisputeDetail> {
    return this.requestJson<AdminDisputeDetail>(
      `/admin/disputes/${disputeId}`,
      { method: 'GET' },
      accessToken,
    );
  }

  adminResolveDispute(
    accessToken: string,
    disputeId: string,
    resolution: string,
    notes: string,
    idempotencyKey: string,
  ): Promise<Dispute> {
    return this.requestJson<Dispute>(
      `/admin/disputes/${disputeId}/resolve`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ resolution, notes }),
      },
      accessToken,
    );
  }

  adminGetStrikePolicy(accessToken: string): Promise<StrikePolicy> {
    return this.requestJson<StrikePolicy>(
      '/admin/moderation/strike-policy',
      { method: 'GET' },
      accessToken,
    );
  }

  adminUpdateStrikePolicy(
    accessToken: string,
    payload: Partial<StrikePolicyUpdateRequest>,
  ): Promise<StrikePolicy> {
    return this.requestJson<StrikePolicy>(
      '/admin/moderation/strike-policy',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  adminListPendingPayouts(
    accessToken: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorPage<PayoutRequest>> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requestJson<CursorPage<PayoutRequest>>(
      `/admin/payouts/pending${query}`,
      { method: 'GET' },
      accessToken,
    );
  }

  adminProcessPayout(
    accessToken: string,
    id: string,
    idempotencyKey: string,
  ): Promise<PayoutRequest> {
    return this.requestJson<PayoutRequest>(
      `/admin/payouts/${id}/process`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      },
      accessToken,
    );
  }

  adminListLeadUnlockPrices(
    accessToken: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorPage<LeadUnlockPrice>> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requestJson<CursorPage<LeadUnlockPrice>>(
      `/admin/lead-unlock-prices${query}`,
      { method: 'GET' },
      accessToken,
    );
  }

  adminCreateLeadUnlockPrice(
    accessToken: string,
    payload: LeadUnlockPricePayload,
  ): Promise<LeadUnlockPrice> {
    return this.requestJson<LeadUnlockPrice>(
      '/admin/lead-unlock-prices',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  adminListFeatureToggles(accessToken: string): Promise<FeatureToggle[]> {
    return this.requestJson<FeatureToggle[]>(
      '/admin/features/toggles',
      { method: 'GET' },
      accessToken,
    );
  }

  adminUpdateFeatureToggle(
    accessToken: string,
    featureName: string,
    isEnabled: boolean,
  ): Promise<FeatureToggle> {
    return this.requestJson<FeatureToggle>(
      '/admin/features/toggles',
      {
        method: 'PUT',
        body: JSON.stringify({ feature_name: featureName, is_enabled: isEnabled }),
      },
      accessToken,
    );
  }

  adminConciergeAssignTask(
    accessToken: string,
    taskId: string,
    taskerId: string,
    overrideReason: string,
    liabilityDisclaimerAccepted: boolean,
    idempotencyKey: string,
  ): Promise<Booking> {
    return this.requestJson<Booking>(
      `/admin/tasks/${taskId}/concierge-assign`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          tasker_id: taskerId,
          override_reason: overrideReason,
          liability_disclaimer_accepted: liabilityDisclaimerAccepted,
        }),
      },
      accessToken,
    );
  }

  adminListCategories(accessToken: string): Promise<CursorPage<Category>> {
    return this.requestJson<CursorPage<Category>>(
      '/admin/categories',
      { method: 'GET' },
      accessToken,
    );
  }

  adminCreateCategory(accessToken: string, payload: AdminCategoryPayload): Promise<Category> {
    return this.requestJson<Category>(
      '/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  adminUpdateCategory(
    accessToken: string,
    categoryId: string,
    payload: Partial<AdminCategoryPayload>,
  ): Promise<Category> {
    return this.requestJson<Category>(
      `/admin/categories/${categoryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken,
    );
  }

  adminListCategorySchemas(
    accessToken: string,
    categoryId: string,
  ): Promise<CategorySchemaVersion[]> {
    return this.requestJson<CategorySchemaVersion[]>(
      `/admin/categories/${categoryId}/schemas`,
      { method: 'GET' },
      accessToken,
    );
  }

  adminCreateCategorySchema(
    accessToken: string,
    categoryId: string,
    schemaJson: Record<string, unknown>,
    activateAs?: string,
  ): Promise<CategorySchemaVersion> {
    return this.requestJson<CategorySchemaVersion>(
      `/admin/categories/${categoryId}/schemas`,
      {
        method: 'POST',
        body: JSON.stringify({ schema_json: schemaJson, activate_as: activateAs }),
      },
      accessToken,
    );
  }

  adminActivateCategorySchema(
    accessToken: string,
    categoryId: string,
    version: number,
    mode: string,
  ): Promise<CategorySchemaVersion> {
    return this.requestJson<CategorySchemaVersion>(
      `/admin/categories/${categoryId}/schemas/${version}/activate`,
      {
        method: 'POST',
        body: JSON.stringify({ mode }),
      },
      accessToken,
    );
  }
}

export function createAdminApiClient(baseUrl?: string): AdminApiClient {
  return new HttpAdminApiClient(baseUrl);
}

export const AdminApiClientContext = createContext<AdminApiClient | null>(null);

let _sharedAdminApiClient: AdminApiClient | null = null;
export function useAdminApiClient(): AdminApiClient {
  const ctx = useContext(AdminApiClientContext);

  const fallbackClient = useMemo(() => {
    if (!_sharedAdminApiClient) {
      _sharedAdminApiClient = createAdminApiClient();
    }
    return _sharedAdminApiClient;
  }, []);

  if (ctx) return ctx;
  return fallbackClient;
}
