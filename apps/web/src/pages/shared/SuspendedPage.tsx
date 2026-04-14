import { useTranslation } from 'react-i18next';

import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SuspendedPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.suspended.title', 'Account suspended')}
        description={t(
          'sharedPages.suspended.description',
          'Your account is temporarily paused while support reviews recent activity.',
        )}
        tone="warning"
      />
    </ScreenFrame>
  );
}
