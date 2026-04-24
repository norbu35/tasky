import { useTranslation } from 'react-i18next';

import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SessionExpiredPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.sessionExpired.title')}
        description={t('sharedPages.sessionExpired.description')}
        tone="muted"
      />
    </ScreenFrame>
  );
}
