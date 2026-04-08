import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Pressable, View } from 'react-native';
import {
  Briefcase,
  ClipboardList,
  ListChecks,
  MessageSquare,
  Search,
  User,
} from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { screenLayout } from '../../design/screenLayout';
import { FAB } from '../../components/ui/FAB';
import { useTranslation } from 'react-i18next';
import { useRole } from '../../providers/RoleProvider';

const { colors, spacing, radius, typography } = mobileTheme;

const TAB_ICON_SIZE = 24;

// Tab bar style objects — must remain imperative: passed to Tabs screenOptions (not NativeWind-compatible)
const tabBarStyle = {
  position: 'absolute' as const,
  borderTopWidth: 0,
  elevation: 0,
  height: screenLayout.chrome.tabBarHeight,
  bottom: screenLayout.chrome.tabBarBottom,
  paddingBottom: spacing.sm,
  paddingTop: spacing.sm,
  paddingHorizontal: spacing.lg,
  backgroundColor: 'transparent',
  borderTopLeftRadius: radius.md,
  borderTopRightRadius: radius.md,
  shadowColor: colors.foreground,
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.04,
  shadowRadius: 24,
};

const tabItemStyle = {
  borderRadius: radius.md,
  paddingVertical: spacing.xs + spacing.xs / 2,
  flex: 1,
};

const tabLabelStyle = {
  fontSize: typography.navLabel,
  fontWeight: '500' as const,
  letterSpacing: 0,
  marginTop: spacing.xs,
};

const blurBackgroundStyle = {
  borderTopLeftRadius: radius.md,
  borderTopRightRadius: radius.md,
  overflow: 'hidden' as const,
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isCustomer } = useRole();

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryForeground,
          tabBarInactiveTintColor: colors.navInactive,
          tabBarLabelStyle: tabLabelStyle,
          tabBarStyle: tabBarStyle,
          tabBarItemStyle: tabItemStyle,
          tabBarActiveBackgroundColor: colors.primary,
          tabBarBackground: () => (
            <BlurView
              tint="regular"
              intensity={80}
              style={[StyleSheet.absoluteFill, blurBackgroundStyle]}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isCustomer ? t('nav.customer.myTasks') : t('nav.tasker.browse'),
            tabBarIcon: ({ color }) =>
              isCustomer ? (
                <ListChecks color={color} size={TAB_ICON_SIZE} />
              ) : (
                <Search color={color} size={TAB_ICON_SIZE} />
              ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: isCustomer ? t('nav.customer.bookings') : t('nav.tasker.myJobs'),
            tabBarIcon: ({ color }) =>
              isCustomer ? (
                <ClipboardList color={color} size={TAB_ICON_SIZE} />
              ) : (
                <Briefcase color={color} size={TAB_ICON_SIZE} />
              ),
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: t('nav.inbox'),
            tabBarIcon: ({ color }) => <MessageSquare color={color} size={TAB_ICON_SIZE} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            tabBarIcon: ({ color }) => <User color={color} size={TAB_ICON_SIZE} />,
          }}
        />
      </Tabs>
      {isCustomer && <FAB />}
    </View>
  );
}
