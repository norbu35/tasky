import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, HttpApiClient } from './apiClient';

const adminToken = 'admin-jwt-test-token';
const BASE = 'http://localhost:8080';

function mockOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockErrorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastFetchCall(fetchMock: any): {
  url: string;
  init: RequestInit;
} {
  const call = fetchMock.mock.calls[0]!;
  return { url: call[0] as string, init: call[1] as RequestInit };
}

function parsedHeaders(init: RequestInit): Headers {
  return new Headers(init.headers);
}

function parsedBody(init: RequestInit): Record<string, unknown> {
  return JSON.parse(init.body as string);
}

describe('Admin API Client', () => {
  let client: HttpApiClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setupClient(): void {
    client = new HttpApiClient(BASE);
  }

  // ─── User Management ──────────────────────────────────────────────

  describe('User Management', () => {
    describe('adminSearchUsers', () => {
      it('sends GET to /admin/users with phone query param', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ data: [{ id: 'u1', phone: '+97699001122' }] }));
        setupClient();

        await client.adminSearchUsers(adminToken, '+97699001122');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/users');
        expect(url).toContain('phone=%2B97699001122');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token in Authorization header', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ data: [] }));
        setupClient();

        await client.adminSearchUsers(adminToken, '+97600000000');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 403 Forbidden', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(403, 'Forbidden'));
        setupClient();

        await expect(client.adminSearchUsers(adminToken, '+97600000000')).rejects.toThrow(ApiError);
      });
    });

    describe('adminBanUser', () => {
      it('sends POST to /admin/users/{id}/ban with reason body', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'u1', status: 'BANNED' }));
        setupClient();

        await client.adminBanUser(adminToken, 'user-42', 'Spam account');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/users/user-42/ban`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({ reason: 'Spam account' });
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'u1' }));
        setupClient();

        await client.adminBanUser(adminToken, 'u1', 'Abuse');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 404', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(404, 'User not found'));
        setupClient();

        await expect(client.adminBanUser(adminToken, 'nonexistent', 'reason')).rejects.toThrow(
          ApiError,
        );
      });
    });

    describe('adminUnbanUser', () => {
      it('sends POST to /admin/users/{id}/unban', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'u1', status: 'ACTIVE' }));
        setupClient();

        await client.adminUnbanUser(adminToken, 'user-42');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/users/user-42/unban`);
        expect(init.method).toBe('POST');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'u1' }));
        setupClient();

        await client.adminUnbanUser(adminToken, 'u1');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('dispatches unauthorized event on 401', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(401, 'Token expired'));
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        setupClient();

        await expect(client.adminUnbanUser(adminToken, 'u1')).rejects.toThrow(ApiError);

        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'tasky:unauthorized' }),
        );
      });
    });
  });

  // ─── Flagged Messages ─────────────────────────────────────────────

  describe('Flagged Messages', () => {
    describe('adminListFlaggedMessages', () => {
      it('sends GET to /admin/messages/flagged', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ data: [], cursor: { next: null, has_more: false } }));
        setupClient();

        await client.adminListFlaggedMessages(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/messages/flagged');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ data: [] }));
        setupClient();

        await client.adminListFlaggedMessages(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 401', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(401, 'Unauthorized'));
        setupClient();

        await expect(client.adminListFlaggedMessages(adminToken)).rejects.toThrow(ApiError);
      });
    });
  });

  // ─── Verifications ────────────────────────────────────────────────

  describe('Verifications', () => {
    describe('adminListPendingVerifications', () => {
      it('sends GET to /admin/verifications/pending', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse([
            {
              id: 'v1',
              user_id: 'u1',
              user_phone: '+976',
              user_name: 'Test',
              id_card_front_url: 'http://img/front',
              id_card_back_url: 'http://img/back',
              status: 'PENDING',
              admin_notes: null,
              submitted_at: '2026-03-01T00:00:00Z',
              reviewed_at: null,
            },
          ]),
        );
        setupClient();

        await client.adminListPendingVerifications(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/verifications/pending');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse([]));
        setupClient();

        await client.adminListPendingVerifications(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminApproveVerification', () => {
      it('sends POST to /admin/verifications/{id}/approve', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'v1', status: 'APPROVED' }));
        setupClient();

        await client.adminApproveVerification(adminToken, 'v1');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/verifications/v1/approve`);
        expect(init.method).toBe('POST');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'v1' }));
        setupClient();

        await client.adminApproveVerification(adminToken, 'v1');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 409 Conflict', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(409, 'Already approved'));
        setupClient();

        await expect(client.adminApproveVerification(adminToken, 'v1')).rejects.toThrow(ApiError);
      });
    });

    describe('adminRejectVerification', () => {
      it('sends POST to /admin/verifications/{id}/reject with reason', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'v1', status: 'REJECTED' }));
        setupClient();

        await client.adminRejectVerification(adminToken, 'v1', 'Blurry ID photo');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/verifications/v1/reject`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({ reason: 'Blurry ID photo' });
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'v1' }));
        setupClient();

        await client.adminRejectVerification(adminToken, 'v1', 'reason');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });
  });

  // ─── Disputes ─────────────────────────────────────────────────────

  describe('Disputes', () => {
    describe('adminListDisputes', () => {
      it('sends GET to /admin/disputes', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            data: [],
            cursor: { next: null, has_more: false },
          }),
        );
        setupClient();

        await client.adminListDisputes(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/disputes');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ data: [] }));
        setupClient();

        await client.adminListDisputes(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminGetDispute', () => {
      it('sends GET to /admin/disputes/{id}', async () => {
        const detail = {
          dispute: { id: 'd1' },
          booking: { id: 'b1' },
          conversation_id: 'conv-1',
          evidence_messages: [],
        };
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse(detail));
        setupClient();

        const result = await client.adminGetDispute(adminToken, 'd1');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/disputes/d1`);
        expect(init.method).toBe('GET');
        expect(result).toHaveProperty('dispute');
        expect(result).toHaveProperty('evidence_messages');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            dispute: {},
            booking: {},
            conversation_id: null,
            evidence_messages: [],
          }),
        );
        setupClient();

        await client.adminGetDispute(adminToken, 'd1');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminResolveDispute', () => {
      it('sends POST to /admin/disputes/{id}/resolve with body and Idempotency-Key', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'd1', status: 'RESOLVED' }));
        setupClient();

        await client.adminResolveDispute(
          adminToken,
          'd1',
          'REFUND_CUSTOMER',
          'Tasker did not complete work',
          'idem-key-123',
        );

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/disputes/d1/resolve`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({
          resolution: 'REFUND_CUSTOMER',
          notes: 'Tasker did not complete work',
        });
      });

      it('includes Idempotency-Key header', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'd1' }));
        setupClient();

        await client.adminResolveDispute(
          adminToken,
          'd1',
          'DISMISS',
          'No evidence',
          'idem-key-456',
        );

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Idempotency-Key')).toBe('idem-key-456');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'd1' }));
        setupClient();

        await client.adminResolveDispute(adminToken, 'd1', 'DISMISS', 'Notes', 'key');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 422', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(422, 'Invalid resolution'));
        setupClient();

        await expect(
          client.adminResolveDispute(adminToken, 'd1', 'BAD', 'notes', 'key'),
        ).rejects.toThrow(ApiError);
      });
    });
  });

  // ─── Moderation / Strike Policy ───────────────────────────────────

  describe('Moderation / Strike Policy', () => {
    describe('adminGetStrikePolicy', () => {
      it('sends GET to /admin/moderation/strike-policy', async () => {
        const policy = {
          strikeWindowDays: 30,
          strikeThreshold: 3,
          firstSuspensionDays: 7,
          repeatSuspensionDays: 30,
          repeatOffenseWindowDays: 365,
          autoUnsuspendEnabled: true,
          updatedAt: '2026-03-01T00:00:00Z',
        };
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse(policy));
        setupClient();

        const result = await client.adminGetStrikePolicy(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/moderation/strike-policy');
        expect(init.method).toBe('GET');
        expect(result).toHaveProperty('strikeWindowDays');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({}));
        setupClient();

        await client.adminGetStrikePolicy(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminUpdateStrikePolicy', () => {
      it('sends PUT to /admin/moderation/strike-policy with payload', async () => {
        const payload = {
          strikeWindowDays: 60,
          strikeThreshold: 5,
          firstSuspensionDays: 14,
          repeatSuspensionDays: 60,
          repeatOffenseWindowDays: 365,
          autoUnsuspendEnabled: false,
        };
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ ...payload, updatedAt: '2026-03-23T00:00:00Z' }));
        setupClient();

        await client.adminUpdateStrikePolicy(adminToken, payload);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/moderation/strike-policy');
        expect(init.method).toBe('PUT');
        expect(parsedBody(init)).toEqual(payload);
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({}));
        setupClient();

        await client.adminUpdateStrikePolicy(adminToken, {});

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 400 bad request', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(400, 'Invalid policy'));
        setupClient();

        await expect(
          client.adminUpdateStrikePolicy(adminToken, {
            strikeThreshold: -1,
          }),
        ).rejects.toThrow(ApiError);
      });
    });
  });

  // ─── Feature Toggles ─────────────────────────────────────────────

  describe('Feature Toggles', () => {
    describe('adminListFeatureToggles', () => {
      it('sends GET to /admin/features/toggles', async () => {
        const toggles = [
          {
            feature_name: 'dark_mode',
            is_enabled: true,
            updated_by: 'admin-1',
            updated_at: '2026-03-01T00:00:00Z',
          },
        ];
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse(toggles));
        setupClient();

        await client.adminListFeatureToggles(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/features/toggles');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse([]));
        setupClient();

        await client.adminListFeatureToggles(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminUpdateFeatureToggle', () => {
      it('sends PUT to /admin/features/toggles with feature_name and is_enabled', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            feature_name: 'dark_mode',
            is_enabled: false,
            updated_by: 'admin-1',
            updated_at: '2026-03-23T00:00:00Z',
          }),
        );
        setupClient();

        await client.adminUpdateFeatureToggle(adminToken, 'dark_mode', false);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/features/toggles');
        expect(init.method).toBe('PUT');
        expect(parsedBody(init)).toEqual({
          feature_name: 'dark_mode',
          is_enabled: false,
        });
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({}));
        setupClient();

        await client.adminUpdateFeatureToggle(adminToken, 'x', true);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 404 unknown feature', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(404, 'Feature not found'));
        setupClient();

        await expect(
          client.adminUpdateFeatureToggle(adminToken, 'nonexistent', true),
        ).rejects.toThrow(ApiError);
      });
    });
  });

  // ─── Concierge Task Assignment ───────────────────────────────────

  describe('Concierge Task Assignment', () => {
    describe('adminConciergeAssignTask', () => {
      it('sends POST to /admin/tasks/{id}/concierge-assign with body', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'b1', status: 'ASSIGNED' }));
        setupClient();

        await client.adminConciergeAssignTask(
          adminToken,
          'task-99',
          'tasker-7',
          'Customer requested specific tasker',
          true,
          'concierge-idem-key',
        );

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/tasks/task-99/concierge-assign`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({
          tasker_id: 'tasker-7',
          override_reason: 'Customer requested specific tasker',
          liability_disclaimer_accepted: true,
        });
      });

      it('includes Idempotency-Key header', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'b1' }));
        setupClient();

        await client.adminConciergeAssignTask(
          adminToken,
          'task-99',
          'tasker-7',
          'reason',
          true,
          'my-idem-key',
        );

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Idempotency-Key')).toBe('my-idem-key');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ id: 'b1' }));
        setupClient();

        await client.adminConciergeAssignTask(adminToken, 't1', 'tk1', 'reason', true, 'key');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 409 Conflict (already assigned)', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(409, 'Task already assigned'));
        setupClient();

        await expect(
          client.adminConciergeAssignTask(adminToken, 't1', 'tk1', 'reason', true, 'key'),
        ).rejects.toThrow(ApiError);
      });

      it('dispatches unauthorized event on 401', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(401, 'Unauthorized'));
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        setupClient();

        await expect(
          client.adminConciergeAssignTask(adminToken, 't1', 'tk1', 'reason', true, 'key'),
        ).rejects.toThrow(ApiError);

        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'tasky:unauthorized' }),
        );
      });
    });
  });

  // ─── Categories ──────────────────────────────────────────────────

  describe('Categories', () => {
    describe('adminListCategories', () => {
      it('sends GET to /admin/categories', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            data: [{ id: 'cat-1', name: 'Cleaning' }],
            cursor: { next: null, has_more: false },
          }),
        );
        setupClient();

        await client.adminListCategories(adminToken);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/categories');
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ data: [] }));
        setupClient();

        await client.adminListCategories(adminToken);

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminCreateCategory', () => {
      it('sends POST to /admin/categories with full payload', async () => {
        const payload = {
          name: 'Plumbing',
          name_mn: 'Сантехник',
          icon_url: 'https://cdn.tasky.mn/icons/plumbing.svg',
          sort_order: 5,
          intake_enabled: true,
        };
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'cat-new', ...payload }));
        setupClient();

        await client.adminCreateCategory(adminToken, payload);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toContain('/api/v1/admin/categories');
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual(payload);
      });

      it('includes Bearer token', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'cat-new' }));
        setupClient();

        await client.adminCreateCategory(adminToken, {
          name: 'Test',
          name_mn: 'Тест',
          icon_url: '',
          sort_order: 1,
          intake_enabled: false,
        });

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 400 validation error', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(400, 'name is required'));
        setupClient();

        await expect(
          client.adminCreateCategory(adminToken, {
            name: '',
            name_mn: '',
            icon_url: '',
            sort_order: 0,
            intake_enabled: false,
          }),
        ).rejects.toThrow(ApiError);
      });
    });

    describe('adminUpdateCategory', () => {
      it('sends PUT to /admin/categories/{id} with payload', async () => {
        const payload = {
          name: 'Plumbing Updated',
          name_mn: 'Сантехник Шинэ',
          icon_url: 'https://cdn.tasky.mn/icons/plumbing-v2.svg',
          sort_order: 3,
          intake_enabled: true,
        };
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'cat-1', ...payload }));
        setupClient();

        await client.adminUpdateCategory(adminToken, 'cat-1', payload);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/categories/cat-1`);
        expect(init.method).toBe('PUT');
        expect(parsedBody(init)).toEqual(payload);
      });

      it('includes Bearer token', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ id: 'cat-1' }));
        setupClient();

        await client.adminUpdateCategory(adminToken, 'cat-1', {});

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 404 category not found', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(404, 'Category not found'));
        setupClient();

        await expect(client.adminUpdateCategory(adminToken, 'nonexistent', {})).rejects.toThrow(
          ApiError,
        );
      });
    });
  });

  // ─── Category Schemas ────────────────────────────────────────────

  describe('Category Schemas', () => {
    describe('adminListCategorySchemas', () => {
      it('sends GET to /admin/categories/{id}/schemas', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse([
            {
              version: 1,
              status: 'ACTIVE',
              schema_json: { type: 'object' },
              created_at: '2026-03-01T00:00:00Z',
            },
          ]),
        );
        setupClient();

        await client.adminListCategorySchemas(adminToken, 'cat-1');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/categories/cat-1/schemas`);
        expect(init.method).toBe('GET');
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse([]));
        setupClient();

        await client.adminListCategorySchemas(adminToken, 'cat-1');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });
    });

    describe('adminCreateCategorySchema', () => {
      it('sends POST to /admin/categories/{id}/schemas with schema_json', async () => {
        const schemaJson = {
          type: 'object',
          properties: {
            rooms: { type: 'number' },
          },
        };
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            version: 2,
            status: 'DRAFT',
            schema_json: schemaJson,
            created_at: '2026-03-23T00:00:00Z',
          }),
        );
        setupClient();

        await client.adminCreateCategorySchema(adminToken, 'cat-1', schemaJson);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/categories/cat-1/schemas`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({
          schema_json: schemaJson,
          activate_as: undefined,
        });
      });

      it('sends activate_as when provided', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            version: 3,
            status: 'CANARY',
            schema_json: {},
            created_at: '2026-03-23T00:00:00Z',
          }),
        );
        setupClient();

        await client.adminCreateCategorySchema(adminToken, 'cat-1', { type: 'object' }, 'CANARY');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedBody(init)).toEqual({
          schema_json: { type: 'object' },
          activate_as: 'CANARY',
        });
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ version: 1 }));
        setupClient();

        await client.adminCreateCategorySchema(adminToken, 'cat-1', {});

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 400 invalid schema', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(400, 'Invalid JSON schema'));
        setupClient();

        await expect(
          client.adminCreateCategorySchema(adminToken, 'cat-1', {
            invalid: true,
          }),
        ).rejects.toThrow(ApiError);
      });
    });

    describe('adminActivateCategorySchema', () => {
      it('sends POST to /admin/categories/{id}/schemas/{version}/activate with mode', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          mockOkResponse({
            version: 2,
            status: 'ACTIVE',
            schema_json: {},
            created_at: '2026-03-23T00:00:00Z',
          }),
        );
        setupClient();

        await client.adminActivateCategorySchema(adminToken, 'cat-1', 2, 'ACTIVE');

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(`${BASE}/api/v1/admin/categories/cat-1/schemas/2/activate`);
        expect(init.method).toBe('POST');
        expect(parsedBody(init)).toEqual({ mode: 'ACTIVE' });
      });

      it('supports CANARY mode', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockOkResponse({ version: 3, status: 'CANARY' }));
        setupClient();

        await client.adminActivateCategorySchema(adminToken, 'cat-2', 3, 'CANARY');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedBody(init)).toEqual({ mode: 'CANARY' });
      });

      it('includes Bearer token', async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse({ version: 1 }));
        setupClient();

        await client.adminActivateCategorySchema(adminToken, 'cat-1', 1, 'ACTIVE');

        const { init } = lastFetchCall(fetchMock);
        expect(parsedHeaders(init).get('Authorization')).toBe(`Bearer ${adminToken}`);
      });

      it('throws ApiError on 409 conflict (version already rolled back)', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(409, 'Schema version already rolled back'));
        setupClient();

        await expect(
          client.adminActivateCategorySchema(adminToken, 'cat-1', 1, 'ACTIVE'),
        ).rejects.toThrow(ApiError);
      });
    });
  });

  // ─── Cross-cutting: 401 unauthorized event ───────────────────────

  describe('Cross-cutting concerns', () => {
    it('dispatches tasky:unauthorized on 401 for admin GET endpoints', async () => {
      fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockErrorResponse(401, 'Token expired'));
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      setupClient();

      await expect(client.adminListPendingVerifications(adminToken)).rejects.toThrow(ApiError);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tasky:unauthorized' }),
      );
    });

    it('dispatches tasky:unauthorized on 401 for admin POST endpoints', async () => {
      fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockErrorResponse(401, 'Token expired'));
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      setupClient();

      await expect(client.adminBanUser(adminToken, 'u1', 'reason')).rejects.toThrow(ApiError);

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'tasky:unauthorized' }),
      );
    });

    it('ApiError includes status code from failed admin request', async () => {
      fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockErrorResponse(403, 'Admin access required'));
      setupClient();

      try {
        await client.adminListDisputes(adminToken);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(403);
        expect((err as ApiError).message).toBe('Admin access required');
      }
    });

    it('ApiError includes status code from failed admin mutation', async () => {
      fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockErrorResponse(422, 'Unprocessable Entity'));
      setupClient();

      try {
        await client.adminCreateCategory(adminToken, {
          name: '',
          name_mn: '',
          icon_url: '',
          sort_order: 0,
          intake_enabled: false,
        });
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(422);
      }
    });
  });
});
