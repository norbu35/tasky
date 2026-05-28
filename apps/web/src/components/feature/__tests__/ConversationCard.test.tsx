import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConversationCard } from '../ConversationCard';

describe('ConversationCard', () => {
  it('renders conversation summary and unread count', () => {
    render(
      <ConversationCard
        title="Customer User"
        subtitle="I am on my way"
        timestamp="10:30"
        unreadCount={3}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Customer User/i })).toBeInTheDocument();
    expect(screen.getByText('I am on my way')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens from click and keyboard activation', () => {
    const onOpen = vi.fn();
    render(<ConversationCard title="Support" onOpen={onOpen} />);

    const card = screen.getByRole('button', { name: /Support/i });
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(3);
  });
});
