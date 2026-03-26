import { useTranslation } from 'react-i18next';
import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function BannedPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.banned.title', 'Account banned')}
        description={t('sharedPages.banned.description', 'This account can no longer access the marketplace.')}
        tone="destructive"
      />
    </ScreenFrame>
  );
}
