import { useRouter } from 'expo-router';
import { ArrowRight, Briefcase, Check, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { ModalSheetTemplate } from '@/components/templates/ModalSheetTemplate';
import { Button } from '@/components/ui';
import { Touchable } from '@/components/ui/Touchable';
import { elevations } from '@/design/elevations';
import { mobileTheme } from '@/design/tokenAdapter';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/appStore';

const { colors } = mobileTheme;
type RoleOption = 'customer' | 'tasker' | null;

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setRole = useAppStore((state) => state.setRole);
  const [selectedRole, setSelectedRole] = useState<RoleOption>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const roleLabels: Record<Exclude<RoleOption, null>, string> = {
    customer: t('RoleSelectScreen.copy1'),
    tasker: t('RoleSelectScreen.copy2'),
  };
  const handleConfirm = () => {
    if (!selectedRole) return;
    setIsConfirming(true);
  };

  const handleConfirmSelection = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    setIsConfirming(false);
    router.replace('/(auth)/permission-notifications');
  };

  const roleLabel = selectedRole ? roleLabels[selectedRole] : roleLabels.customer;

  const renderRoleCard = (role: Exclude<RoleOption, null>) => {
    const isSelected = selectedRole === role;
    const Icon = role === 'customer' ? User : Briefcase;
    const titleKey =
      role === 'customer' ? 'auth.roleSelection.customerTitle' : 'auth.roleSelection.taskerTitle';
    const descriptionKey =
      role === 'customer'
        ? 'auth.roleSelection.customerDescription'
        : 'auth.roleSelection.taskerDescription';

    return (
      <Touchable
        key={role}
        testID={`role-card-${role}`}
        onPress={() => setSelectedRole(role)}
        className={cn(
          'rounded-xl overflow-hidden',
          isSelected ? 'border-2 bg-card border-primary-deep' : 'bg-muted',
        )}
        style={isSelected ? elevations.soft : undefined}
      >
        <View className="flex-row items-center gap-md p-lg">
          <View
            className={cn(
              'w-14 h-14 rounded-xl items-center justify-center',
              isSelected ? 'bg-secondary' : 'bg-chip-inactive',
            )}
          >
            <Icon size={28} color={isSelected ? colors.primaryDeep : colors.foreground} />
          </View>
          <View className="flex-1">
            <Text className="text-title font-sans-semibold text-primary-deep">{t(titleKey)}</Text>
            <Text className="text-label mt-xs text-text-secondary leading-5">
              {t(descriptionKey)}
            </Text>
          </View>
          {isSelected ? (
            <View
              testID={`role-card-${role}-check`}
              className="w-5 h-5 rounded-full items-center justify-center bg-primary-deep"
            >
              <Check size={16} color={colors.primaryForeground} />
            </View>
          ) : null}
        </View>
      </Touchable>
    );
  };

  return (
    <AuthTemplate testID="SCR-SHARED-006" contentStyle={{ justifyContent: 'center' }}>
      <View className="mb-xl">
        <Text className="text-heading font-sans-bold text-center text-primary-deep leading-8">
          {t('auth.roleSelection.heading')}
        </Text>
        <Text className="text-body text-center text-text-secondary leading-6">
          {t('RoleSelectScreen.copy5')}
        </Text>
      </View>

      <View className="gap-md">{(['customer', 'tasker'] as const).map(renderRoleCard)}</View>

      <Button
        testID="role-confirm-button"
        onPress={handleConfirm}
        disabled={!selectedRole}
        size="lg"
      >
        <View className="flex-row items-center justify-center gap-sm">
          <Text className="text-label font-sans-bold text-primary-foreground">
            {t('auth.roleSelection.confirm')}
          </Text>
          <ArrowRight size={16} color={colors.primaryForeground} />
        </View>
      </Button>

      <ModalSheetTemplate
        isOpen={isConfirming}
        title={t('auth.roleSelection.confirmSheetTitle')}
        onClose={() => setIsConfirming(false)}
        dismissible={false}
        primaryAction={{
          label: t('auth.roleSelection.confirmSheetPrimary'),
          onPress: handleConfirmSelection,
          testID: 'role-sheet-confirm',
        }}
        secondaryAction={{
          label: t('auth.roleSelection.confirmSheetSecondary'),
          onPress: () => setIsConfirming(false),
          testID: 'role-sheet-cancel',
        }}
      >
        <Text className="text-body text-text-secondary leading-6">
          {t('auth.roleSelection.confirmSheetMessage', {
            role: roleLabel,
          })}
        </Text>
      </ModalSheetTemplate>
    </AuthTemplate>
  );
}
