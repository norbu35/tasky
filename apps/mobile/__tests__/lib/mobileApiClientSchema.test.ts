import type { components } from '@tasky/sdk';
import type { MobileApiClient } from '../../src/lib/mobileApiClient';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false;
type Expect<T extends true> = T;

type CreateTaskRequest = components['schemas']['CreateTaskRequest'];
type _CreateTaskPayloadMatchesGeneratedSchema = Expect<
  Equal<Parameters<MobileApiClient['createTask']>[1], CreateTaskRequest>
>;

test('TID-TASK-113-MOBILE-API-CREATE-TASK-SCHEMA uses generated SDK schema for task creation payload', () => {
  expect(true).toBe(true);
});
