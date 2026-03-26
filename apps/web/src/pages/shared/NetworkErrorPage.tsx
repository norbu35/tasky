import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function NetworkErrorPage() {
  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title="Network error"
        description="Check your connection and retry the request."
        tone="warning"
      />
    </ScreenFrame>
  );
}
