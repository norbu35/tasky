import { useRouter } from 'expo-router';
import {
  Bell,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SettingsTemplate } from '@/components/templates/SettingsTemplate';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { mobileTheme } from '@/design/tokenAdapter';
import { useRole } from '@/providers/RoleProvider';

const { colors } = mobileTheme;

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentRole, switchRole } = useRole();
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sections = [
    {
      title: t('shared.settings.preferences'),
      rows: [
        {
          label: t('shared.settings.language'),
          icon: <Globe size={20} color={colors.primary} />,
          rightElement: <LanguageSwitcher />,
        },
        {
          label: t('shared.settings.notifications'),
          onPress: () => router.push('/(shared)/notifications'),
          icon: <Bell size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.account'),
      rows: [
        {
          label: t('shared.settings.switchRole'),
          value:
            currentRole === 'customer'
              ? t('shared.settings.customer')
              : t('shared.settings.tasker'),
          onPress: () => setShowRoleConfirm(true),
          icon: <ArrowLeftRight size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.legal'),
      rows: [
        {
          label: t('shared.settings.terms'),
          onPress: () => router.push('/(shared)/legal/terms'),
          icon: <FileText size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.privacy'),
          onPress: () => router.push('/(shared)/legal/privacy'),
          icon: <Shield size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.help'),
          onPress: () => router.push('/(shared)/help'),
          icon: <HelpCircle size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.dangerZone'),
      rows: [
        {
          label: t('shared.settings.deleteAccount'),
          onPress: () => setShowDeleteConfirm(true),
          icon: <Trash2 size={20} color={colors.danger} />,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <View testID="SCR-SHARED-014" className="flex-1">
      <SettingsTemplate sections={sections} testID="settings-screen" />
      <ConfirmSheet
        isOpen={showRoleConfirm}
        onClose={() => setShowRoleConfirm(false)}
        title={t('shared.settings.switchRoleTitle')}
        description={t('shared.settings.switchRoleBody')}
        confirmLabel={t('shared.settings.confirm')}
        onConfirm={() => {
          switchRole();
          setShowRoleConfirm(false);
        }}
      />
      <ConfirmSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('shared.settings.deleteTitle')}
        description={t('SettingsScreen.copy1')}
        confirmLabel={t('shared.settings.confirm')}
        isDestructive={true}
        onConfirm={() => {
          router.push('/(shared)/profile/delete');
        }}
      />
    </View>
  );
}
