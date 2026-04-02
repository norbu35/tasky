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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sections = [
    {
      title: t('shared.settings.preferences', 'Тохируулга'),
      rows: [
        {
          label: t('shared.settings.language', 'Хэл'),
          value: t('shared.settings.languageValue', 'Монгол'),
          onPress: () => {},
          icon: <Globe size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.notifications', 'Мэдэгдэл'),
          onPress: () => router.push('/(shared)/notifications'),
          icon: <Bell size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.account', 'Бүртгэл'),
      rows: [
        {
          label: t('shared.settings.switchRole', 'Дүр солих'),
          value:
            currentRole === 'customer'
              ? t('shared.settings.customer', 'Захиалагч')
              : t('shared.settings.tasker', 'Гүйцэтгэгч'),
          onPress: () => setShowRoleConfirm(true),
          icon: <ArrowLeftRight size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.legal', 'Хуулийн мэдээлэл'),
      rows: [
        {
          label: t('shared.settings.terms', 'Үйлчилгээний нөхцөл'),
          onPress: () => router.push('/(shared)/legal/terms'),
          icon: <FileText size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.privacy', 'Нууцлалын бодлого'),
          onPress: () => router.push('/(shared)/legal/privacy'),
          icon: <Shield size={20} color={colors.primary} />,
        },
        {
          label: t('shared.settings.help', 'Тусламж & Дэмжлэг'),
          onPress: () => router.push('/(shared)/help'),
          icon: <HelpCircle size={20} color={colors.primary} />,
        },
      ],
    },
    {
      title: t('shared.settings.dangerZone', 'Аюултай бүс'),
      rows: [
        {
          label: t('shared.settings.deleteAccount', 'Бүртгэл устгах'),
          onPress: () => setShowDeleteConfirm(true),
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
        title={t('shared.settings.switchRoleTitle', 'Дүр солих уу?')}
        description={t('shared.settings.switchRoleBody', 'Та гүйцэтгэгч болж өөрчлөхдөө итгэлтэй байна уу?')}
        confirmLabel={t('shared.settings.confirm', 'Батлах')}
        onConfirm={() => {
          switchRole();
          setShowRoleConfirm(false);
        }}
      />
      <ConfirmSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('shared.settings.deleteTitle', 'Бүртгэл устгах уу?')}
        description={t(
          'shared.settings.deleteBody',
          'Энэ үйлдлийг буцаах боломжгүй. Таны бүх мэдээлэл бүрмөсөн устгагдана.',
        )}
        confirmLabel={t('shared.settings.confirm', 'Батлах')}
        isDestructive={true}
        onConfirm={() => {
          router.push('/(shared)/profile/delete');
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
