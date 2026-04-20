import { mobileTheme } from '@/design/tokenAdapter';
import { Sparkles, Hammer, Leaf, Package, Wrench, Zap } from 'lucide-react-native';

const { colors } = mobileTheme;

export function getTaskVisual(categoryName: string | null | undefined, t: (key: string) => string) {
  const name = (categoryName ?? '').toLowerCase();

  if (name.includes('clean') || name.includes(t('MyTasksListScreen.copy1'))) {
    return { Icon: Sparkles, tint: colors.primary, tone: `${colors.primary}14` };
  }
  if (
    name.includes('hand') ||
    name.includes('repair') ||
    name.includes(t('MyTasksListScreen.copy2'))
  ) {
    return { Icon: Wrench, tint: colors.secondary, tone: `${colors.secondary}18` };
  }
  if (name.includes('move') || name.includes(t('MyTasksListScreen.copy3'))) {
    return { Icon: Package, tint: colors.accent, tone: `${colors.accent}18` };
  }
  if (name.includes('garden') || name.includes(t('MyTasksListScreen.copy4'))) {
    return { Icon: Leaf, tint: colors.trust, tone: `${colors.trust}18` };
  }
  if (name.includes('paint') || name.includes(t('MyTasksListScreen.copy5'))) {
    return { Icon: Hammer, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
  }

  return { Icon: Zap, tint: colors.primaryDeep, tone: `${colors.primaryDeep}12` };
}
