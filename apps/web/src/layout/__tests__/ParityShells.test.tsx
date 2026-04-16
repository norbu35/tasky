import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithAppContext as render } from '../../test/render-helpers';
import {
  ActionRail,
  ResponsiveDetailShell,
  ResponsiveFeedShell,
  ResponsiveWizardShell,
  StatePanel,
  TimelineList,
} from '../parity';

vi.mock('../../src/layout/ScreenFrame', () => ({
  ScreenFrame: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('Parity shells', () => {
  it('renders the responsive feed shell with content and side rail slots', () => {
    render(
      <ResponsiveFeedShell
        title="Feed title"
        description="Feed description"
        primaryAction={<button type="button">Primary</button>}
        sideRail={<aside>Side rail</aside>}
      >
        <section>Feed content</section>
      </ResponsiveFeedShell>,
    );

    expect(screen.getByRole('region', { name: 'Feed title' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Feed title' })).toBeInTheDocument();
    expect(screen.getByText('Feed description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByText('Feed content')).toBeInTheDocument();
    expect(screen.getByText('Side rail')).toBeInTheDocument();
  });

  it('renders the responsive detail shell with action and detail slots', () => {
    render(
      <ResponsiveDetailShell
        title="Detail title"
        description="Detail description"
        backLabel="Back"
        primaryAction={<button type="button">Save</button>}
        detailRail={<aside>Detail rail</aside>}
      >
        <section>Detail content</section>
      </ResponsiveDetailShell>,
    );

    expect(screen.getByRole('region', { name: 'Detail title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detail title' })).toBeInTheDocument();
    expect(screen.getByText('Detail description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByText('Detail content')).toBeInTheDocument();
    expect(screen.getByText('Detail rail')).toBeInTheDocument();
  });

  it('renders the responsive wizard shell with progress and footer slots', () => {
    render(
      <ResponsiveWizardShell
        title="Wizard title"
        description="Wizard description"
        stepLabel="Step 2 of 4"
        footer={<button type="button">Continue</button>}
      >
        <section>Wizard content</section>
      </ResponsiveWizardShell>,
    );

    expect(screen.getByRole('region', { name: 'Wizard title' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wizard title' })).toBeInTheDocument();
    expect(screen.getByText('Wizard description')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByText('Wizard content')).toBeInTheDocument();
  });

  it('renders a state panel with tone, content, and actions', () => {
    render(
      <StatePanel
        title="Empty state"
        description="Nothing to show"
        tone="muted"
        icon={<span aria-hidden="true">I</span>}
        actions={<button type="button">Retry</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Empty state' })).toBeInTheDocument();
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByText('I')).toBeInTheDocument();
  });

  it('renders timeline entries in order with metadata', () => {
    render(
      <TimelineList
        items={[
          { label: 'Created', detail: 'Task created', time: '10:00', tone: 'muted' },
          { label: 'Assigned', detail: 'Tasker selected', time: '10:30', tone: 'active' },
        ]}
      />,
    );

    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Task created')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('Tasker selected')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('renders an action rail with primary and secondary actions', () => {
    render(
      <ActionRail
        primaryAction={<button type="button">Proceed</button>}
        secondaryActions={<button type="button">Cancel</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
