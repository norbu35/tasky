import { useTranslation } from 'react-i18next';

import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SuspendedPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.suspended.title')}
        description={t('sharedPages.suspended.description')}
        tone="warning"
      />
    </ScreenFrame>
  );
}
