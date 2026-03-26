import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SuspendedPage() {
  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title="Account suspended"
        description="Your account is temporarily paused while support reviews recent activity."
        tone="warning"
      />
    </ScreenFrame>
  );
}
