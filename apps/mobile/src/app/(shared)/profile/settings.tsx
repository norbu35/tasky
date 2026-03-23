import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react-native';
import { SettingsTemplate } from '../../../components/templates/SettingsTemplate';
import { ConfirmSheet } from '../../../components/ui/ConfirmSheet';
import { useRole } from '../../../providers/RoleProvider';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors } = mobileTheme;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentRole, switchRole } = useRole();
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  const sections = [
    {
      title: t('shared.settings.preferences', 'Preferences'),
      rows: [
        {
          label: t('shared.settings.language', 'Language'),
          value: t('shared.settings.languageValue', 'English'),
          onPress: () => {},
          icon: <Globe size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.notifications', 'Notifications'),
          onPress: () => router.push('/(shared)/notifications'),
          icon: <Bell size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.account', 'Account'),
      rows: [
        {
          label: t('shared.settings.switchRole', 'Switch Role'),
          value:
            currentRole === 'customer'
              ? t('shared.settings.customer', 'Customer')
              : t('shared.settings.tasker', 'Tasker'),
          onPress: () => setShowRoleConfirm(true),
          icon: <ArrowLeftRight size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.legal', 'Legal'),
      rows: [
        {
          label: t('shared.settings.terms', 'Terms of Service'),
          onPress: () => router.push('/(shared)/legal/terms'),
          icon: <FileText size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.privacy', 'Privacy Policy'),
          onPress: () => router.push('/(shared)/legal/privacy'),
          icon: <Shield size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.help', 'Help & Support'),
          onPress: () => router.push('/(shared)/help'),
          icon: <HelpCircle size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.dangerZone', 'Danger Zone'),
      rows: [
        {
          label: t('shared.settings.deleteAccount', 'Delete Account'),
          onPress: () => router.push('/(shared)/profile/delete'),
          icon: <Trash2 size={20} color={colors.danger} />,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SettingsTemplate sections={sections} testID="settings-screen" />
      <ConfirmSheet
        isOpen={showRoleConfirm}
        onClose={() => setShowRoleConfirm(false)}
        title={t('shared.settings.switchRoleTitle', 'Switch role?')}
        description={t('shared.settings.switchRoleBody', 'Are you sure you want to switch roles?')}
        confirmLabel={t('shared.settings.confirm', 'Confirm')}
        onConfirm={() => {
          switchRole();
          setShowRoleConfirm(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
