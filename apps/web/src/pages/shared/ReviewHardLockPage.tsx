import { useTranslation } from 'react-i18next';

import { StatePanel } from '../../layout/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function ReviewHardLockPage() {
  const { t } = useTranslation();

  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title={t('sharedPages.reviewHardLock.title')}
        description={t('sharedPages.reviewHardLock.description')}
        tone="warning"
      />
    </ScreenFrame>
  );
}
