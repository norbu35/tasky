import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './apiClient';
import { HttpAdminApiClient } from './adminApiClient';

const adminToken = 'admin-jwt-test-token';
const BASE = 'http://localhost:8080/api/v1';

function mockOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function mockErrorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'content-type': 'application/json' },
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

describe('Admin API Client', () => {
  let client: HttpAdminApiClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchMock: any;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setupClient(): void {
    client = new HttpAdminApiClient(BASE);
  }

  const endpoints = [
    {
      method: 'adminSearchUsers',
      args: [adminToken, '+97699'],
      expectedUrl: '/admin/users?phone=%2B97699',
      httpMethod: 'GET',
      returnVal: { data: [] },
    },
    {
      method: 'adminBanUser',
      args: [adminToken, 'u1', 'spam'],
      expectedUrl: '/admin/users/u1/ban',
      httpMethod: 'POST',
      body: { reason: 'spam' },
      returnVal: {},
    },
    {
      method: 'adminUnbanUser',
      args: [adminToken, 'u1'],
      expectedUrl: '/admin/users/u1/unban',
      httpMethod: 'POST',
      returnVal: {},
    },
    {
      method: 'adminListDisputes',
      args: [adminToken],
      expectedUrl: '/admin/disputes',
      httpMethod: 'GET',
      returnVal: { data: [] },
    },
    {
      method: 'adminGetDispute',
      args: [adminToken, 'd1'],
      expectedUrl: '/admin/disputes/d1',
      httpMethod: 'GET',
      returnVal: {},
    },
    {
      method: 'adminResolveDispute',
      args: [adminToken, 'd1', 'RESOLVE_CUSTOMER', 'notes', 'ik'],
      headers: { 'idempotency-key': 'ik' },
      expectedUrl: '/admin/disputes/d1/resolve',
      httpMethod: 'POST',
      body: { resolution: 'RESOLVE_CUSTOMER', notes: 'notes' },
      returnVal: {},
    },
    {
      method: 'adminListCategories',
      args: [adminToken],
      expectedUrl: '/admin/categories',
      httpMethod: 'GET',
      returnVal: [],
    },
    {
      method: 'adminCreateCategory',
      args: [adminToken, { name: 'Clean', name_mn: 'Цэвэрлэгээ', icon_url: 'icon', sort_order: 1 }],
      expectedUrl: '/admin/categories',
      httpMethod: 'POST',
      body: { name: 'Clean', name_mn: 'Цэвэрлэгээ', icon_url: 'icon', sort_order: 1 },
      returnVal: {},
    },
    {
      method: 'adminUpdateCategory',
      args: [adminToken, 'cat1', { is_active: false }],
      expectedUrl: '/admin/categories/cat1',
      httpMethod: 'PUT',
      body: { is_active: false },
      returnVal: {},
    },
    {
      method: 'adminListCategorySchemas',
      args: [adminToken, 'cat1'],
      expectedUrl: '/admin/categories/cat1/schemas',
      httpMethod: 'GET',
      returnVal: [],
    },
    {
      method: 'adminCreateCategorySchema',
      args: [adminToken, 'cat1', { version: 1, jsonschema: '{}' }],
      expectedUrl: '/admin/categories/cat1/schemas',
      httpMethod: 'POST',
      body: { schema_json: { version: 1, jsonschema: '{}' } },
      returnVal: {},
    },
    {
      method: 'adminActivateCategorySchema',
      args: [adminToken, 'cat1', 1, 'ACTIVE'],
      expectedUrl: '/admin/categories/cat1/schemas/1/activate',
      httpMethod: 'POST',
      body: { mode: 'ACTIVE' },
      returnVal: {},
    },
    {
      method: 'adminListFeatureToggles',
      args: [adminToken],
      expectedUrl: '/admin/features/toggles',
      httpMethod: 'GET',
      returnVal: [],
    },
    {
      method: 'adminUpdateFeatureToggle',
      args: [adminToken, 'feat', true],
      expectedUrl: '/admin/features/toggles',
      httpMethod: 'PUT',
      body: { feature_name: 'feat', is_enabled: true },
      returnVal: {},
    },
    {
      method: 'adminListPendingVerifications',
      args: [adminToken],
      expectedUrl: '/admin/verifications/pending',
      httpMethod: 'GET',
      returnVal: [],
    },
    {
      method: 'adminApproveVerification',
      args: [adminToken, 'v1'],
      expectedUrl: '/admin/verifications/v1/approve',
      httpMethod: 'POST',
      returnVal: {},
    },
    {
      method: 'adminRejectVerification',
      args: [adminToken, 'v1', 'bad photo'],
      expectedUrl: '/admin/verifications/v1/reject',
      httpMethod: 'POST',
      body: { reason: 'bad photo' },
      returnVal: {},
    },
    {
      method: 'adminListFlaggedMessages',
      args: [adminToken],
      expectedUrl: '/admin/messages/flagged',
      httpMethod: 'GET',
      returnVal: { data: [] },
    },
    {
      method: 'adminGetStrikePolicy',
      args: [adminToken],
      expectedUrl: '/admin/moderation/strike-policy',
      httpMethod: 'GET',
      returnVal: {},
    },
    {
      method: 'adminUpdateStrikePolicy',
      args: [adminToken, { rules: [] }],
      expectedUrl: '/admin/moderation/strike-policy',
      httpMethod: 'PUT',
      body: { rules: [] },
      returnVal: {},
    },
    {
      method: 'adminListLeadUnlockPrices',
      args: [adminToken],
      expectedUrl: '/admin/lead-unlock-prices',
      httpMethod: 'GET',
      returnVal: [],
    },
    {
      method: 'adminCreateLeadUnlockPrice',
      args: [adminToken, { category_id: 'cat1', price: 5000 }],
      expectedUrl: '/admin/lead-unlock-prices',
      httpMethod: 'POST',
      body: { category_id: 'cat1', price: 5000 },
      returnVal: {},
    },
    {
      method: 'adminListPendingPayouts',
      args: [adminToken],
      expectedUrl: '/admin/payouts/pending',
      httpMethod: 'GET',
      returnVal: { data: [] },
    },
    {
      method: 'adminProcessPayout',
      args: [adminToken, 'p1', 'ik'],
      expectedUrl: '/admin/payouts/p1/process',
      httpMethod: 'POST',
      returnVal: {},
      headers: { 'idempotency-key': 'ik' },
    },
    {
      method: 'adminConciergeAssignTask',
      args: [adminToken, 't1', 'tasker1', 'reason', true, 'ik'],
      expectedUrl: '/admin/tasks/t1/concierge-assign',
      httpMethod: 'POST',
      body: {
        tasker_id: 'tasker1',
        override_reason: 'reason',
        liability_disclaimer_accepted: true,
      },
      returnVal: {},
      headers: { 'idempotency-key': 'ik' },
    },
  ];

  describe.each(endpoints)(
    '$method',
    ({ method, args, expectedUrl, httpMethod, body, returnVal, headers }) => {
      it(`sends ${httpMethod} to ${expectedUrl}`, async () => {
        fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockOkResponse(returnVal));
        setupClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any)[method](...args);

        const { url, init } = lastFetchCall(fetchMock);
        expect(url).toBe(BASE + expectedUrl);
        expect(init.method).toBe(httpMethod);
        const receivedHeaders = Object.fromEntries((init.headers as Headers).entries());
        expect(receivedHeaders).toMatchObject({
          authorization: `Bearer ${adminToken}`,
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(headers || {}),
        });

        if (body) {
          expect(JSON.parse(init.body as string)).toEqual(body);
        } else {
          expect(init.body).toBeUndefined();
        }
      });

      it('throws ApiError on error status', async () => {
        fetchMock = vi
          .spyOn(globalThis, 'fetch')
          .mockResolvedValue(mockErrorResponse(400, 'Bad Request'));
        setupClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect((client as any)[method](...args)).rejects.toThrow(ApiError);
      });
    },
  );
});
