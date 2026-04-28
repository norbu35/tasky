import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { mobileTheme } from '@/design/tokenAdapter';

import { type ScreenState, buildFaqSections, filterSections, resolveState } from './model';

const { spacing } = mobileTheme;

export function useHelpCenterScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const paramsState = params['state'];
  const [state, setState] = useState<ScreenState>(() => resolveState(paramsState));
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setState(resolveState(paramsState));
  }, [paramsState]);

  const sections = useMemo(() => buildFaqSections(t), [t]);
  const visibleSections = useMemo(() => filterSections(sections, query), [sections, query]);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRetry = () => {
    setQuery('');
    setExpandedId(null);
    setState('loaded');
  };

  return {
    t,
    state,
    query,
    setQuery,
    expandedId,
    visibleSections,
    handleToggle,
    handleRetry,
    searchPlaceholder: t('infra.help.searchPlaceholder'),
    spacing,
  };
}
