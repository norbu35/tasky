import {
  buildTaskerProfileRoute,
  numberFromRouteParam,
} from '@/features/profile/profileRouteParams';

describe('profile route params', () => {
  it('serializes tasker profile seed fields into route-safe strings', () => {
    expect(
      buildTaskerProfileRoute({
        id: 'tasker-1',
        full_name: 'Bold Bat',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Experienced mover',
        rating_avg: 4.75,
        completed_tasks: 12,
        is_pro: true,
        created_at: '2026-03-01T00:00:00Z',
      }),
    ).toEqual({
      pathname: '/(customer)/taskers/[taskerId]',
      params: {
        taskerId: 'tasker-1',
        taskerName: 'Bold Bat',
        taskerAvatar: 'https://example.com/avatar.jpg',
        taskerBio: 'Experienced mover',
        taskerRating: '4.75',
        taskerCompletedTasks: '12',
        taskerVerified: 'true',
        taskerCreatedAt: '2026-03-01T00:00:00Z',
      },
    });
  });

  it('uses empty route params for missing optional seed fields', () => {
    expect(buildTaskerProfileRoute({}).params).toEqual({
      taskerId: '',
      taskerName: '',
      taskerAvatar: '',
      taskerBio: '',
      taskerRating: '',
      taskerCompletedTasks: '',
      taskerVerified: 'false',
      taskerCreatedAt: '',
    });
  });

  it.each([
    { value: '4.75', expected: 4.75 },
    { value: '0', expected: 0 },
    { value: '', expected: null },
    { value: undefined, expected: null },
    { value: 'not-a-number', expected: null },
  ])('parses route param $value as $expected', ({ value, expected }) => {
    expect(numberFromRouteParam(value)).toBe(expected);
  });
});
