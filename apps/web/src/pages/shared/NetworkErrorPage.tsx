import { useTranslation } from 'react-i18next';
import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function NetworkErrorPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.networkError.title', 'Network error')}
        description={t(
          'sharedPages.networkError.description',
          'Check your connection and retry the request.',
        )}
        tone="warning"
      />
    </ScreenFrame>
  );
}
