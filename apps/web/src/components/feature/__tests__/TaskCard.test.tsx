import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TaskFeedItem } from '../../../lib/apiClient';
import { TaskCard } from '../TaskCard';

const task: TaskFeedItem = {
  id: 'task-1',
  category: {
    id: 'cat-cleaning',
    name: 'Cleaning',
    name_mn: 'Цэвэрлэгээ',
    icon_url: null,
  },
  description: 'Move furniture across town',
  budget: 120000,
  pricing_mode: 'BUDGET',
  approximate_location: 'Sukhbaatar',
  approximate_lat: 47.92,
  approximate_lng: 106.92,
  status: 'OPEN',
  scheduled_at: '2026-02-15T00:00:00Z',
  created_at: '2026-02-14T00:00:00Z',
};

describe('TaskCard', () => {
  it('exposes the task description as the actionable card name', () => {
    const onOpen = vi.fn();

    render(<TaskCard task={task} onOpen={onOpen} actionLabel="View details" />);

    const card = screen.getByRole('button', { name: 'Move furniture across town' });
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('opens from keyboard activation', () => {
    const onOpen = vi.fn();

    render(<TaskCard task={task} onOpen={onOpen} />);

    fireEvent.keyDown(screen.getByRole('button', { name: task.description }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: task.description }), { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
