import { RefreshCcw } from 'lucide-react';

import { ResponsiveFeedShell, StatePanel } from '../../components/parity';

export function AppUpdatePage() {
  return (
    <ResponsiveFeedShell
      title="App update available"
      description="Refresh the web client to get the latest stability fixes and marketplace updates."
    >
      <StatePanel
        title="New version ready"
        description="Reload the app after you finish any active form or chat work."
        icon={<RefreshCcw className="h-4 w-4" />}
        tone="muted"
      />
    </ResponsiveFeedShell>
  );
}
