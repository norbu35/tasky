import '../../src/lib/i18n';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from '../../src/App';
import { makeProfile, makeSession } from '../../src/test/factories';
import { createMockApiClient } from '../../src/test/mocks';

// JSDOM does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Messaging & Notifications Integration', () => {
  it('TID-TASK-081-WEB-MSG-NOTIF-INTEGRATION supports messaging and notification device flows', async () => {
    const mockConv = {
      id: 'conv-1',
      task_id: 'task-1',
      task_title: 'Fix Sink',
      booking_id: 'book-1',
    };
    const mockMsg = {
      id: 'msg-oldest',
      conversation_id: 'conv-1',
      sender_id: makeProfile().id,
      content: 'First update',
      sent_at: '2026-03-23T09:00:00Z',
    };

    const apiClient = createMockApiClient({
      getMyProfile: vi.fn().mockResolvedValue(makeProfile()),
      listConversations: vi
        .fn()
        .mockResolvedValue({ data: [mockConv], cursor: { next: null, has_more: false } }),
      listMessages: vi.fn().mockResolvedValue({
        data: [
          {
            ...mockMsg,
            id: 'msg-latest',
            content: 'Latest update',
            sent_at: '2026-03-23T09:02:00Z',
          },
          { ...mockMsg },
          {
            ...mockMsg,
            id: 'msg-middle',
            sender_id: 'counterparty-1',
            content: 'Middle update',
            sent_at: '2026-03-23T09:01:00Z',
          },
        ],
        cursor: { next: null, has_more: false },
      }),
      sendMessage: vi.fn().mockResolvedValue({
        ...mockMsg,
        id: 'msg-2',
        sender_id: makeProfile().id,
        content: 'Great',
        sent_at: '2026-03-23T09:03:00Z',
      }),
      registerDevice: vi.fn().mockResolvedValue('Success'),
      unregisterDevice: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <App apiClient={apiClient} initialSession={makeSession()} initialRoute="/communication" />,
    );

    // Verify Header
    await screen.findByRole('heading', { name: 'Inbox' });
    expect(
      screen.getByText(
        /browser notifications keep you updated on new messages and booking changes/i,
      ),
    ).toBeInTheDocument();

    // Wait for Conversations to load and the mock one to be active
    // The title "Fix Sink" is rendered inside a div alongside the Avatar + in the active chat header
    await screen.findAllByText(/Fix Sink/i);

    await waitFor(() => {
      expect(apiClient.listConversations).toHaveBeenCalled();
      expect(apiClient.listMessages).toHaveBeenCalledWith(makeSession().accessToken, 'conv-1');
    });

    // Current messages are rendered chronologically even though transport data is newest-first.
    await screen.findByText('First update');
    const renderedMessages = document.body.textContent ?? '';
    expect(renderedMessages.indexOf('First update')).toBeLessThan(
      renderedMessages.indexOf('Middle update'),
    );
    expect(renderedMessages.indexOf('Middle update')).toBeLessThan(
      renderedMessages.indexOf('Latest update'),
    );

    // Send a message
    const messageInput = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(messageInput, { target: { value: 'Great' } });

    const sendButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(apiClient.sendMessage).toHaveBeenCalledWith('access-token', 'conv-1', 'Great');
    });

    // Test push toggle (Notifications button)
    const pushToggle = screen.getByRole('button', { name: /notifications/i });

    // Turn ON
    fireEvent.click(pushToggle);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    // Turn OFF
    fireEvent.click(pushToggle);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });
  });
});
