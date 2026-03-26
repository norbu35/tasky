import { useTranslation } from 'react-i18next';
import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function SessionExpiredPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.sessionExpired.title', 'Session expired')}
        description={t('sharedPages.sessionExpired.description', 'Sign in again to continue where you left off.')}
        tone="muted"
      />
    </ScreenFrame>
  );
}
