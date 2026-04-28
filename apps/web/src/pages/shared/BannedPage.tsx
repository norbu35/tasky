import { useTranslation } from 'react-i18next';

import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function BannedPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.banned.title')}
        description={t('sharedPages.banned.description')}
        tone="destructive"
      />
    </ScreenFrame>
  );
}
