import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SessionExpiredPage() {
  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title="Session expired"
        description="Sign in again to continue where you left off."
        tone="muted"
      />
    </ScreenFrame>
  );
}
