import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Briefcase,
  ClipboardList,
  ListChecks,
  MessageSquare,
  Search,
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mobileTheme } from '../../design/tokenAdapter';
import { screenLayout } from '../../design/screenLayout';
import { FAB } from '../../components/ui/FAB';
import { useTranslation } from 'react-i18next';
import { useRole } from '../../providers/RoleProvider';

const { colors, spacing, radius, typography } = mobileTheme;

const TAB_ICON_SIZE = 24;
const TAB_BORDER_RADIUS = 24;

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

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isCustomer } = useRole();
  const insets = useSafeAreaInsets();

  // Tab bar style must be computed here: bottom depends on dynamic safe-area inset.
  // safeAreaInsets: { bottom: 0 } prevents React Navigation from double-adding the inset.
  const tabBarStyle = {
    position: 'absolute' as const,
    borderTopWidth: 0,
    height: screenLayout.chrome.tabBarHeight,
    bottom: insets.bottom + screenLayout.chrome.tabBarBottom,
    marginHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderRadius: TAB_BORDER_RADIUS,
    // Android: solid background + elevation shadow
    backgroundColor: Platform.OS === 'android' ? colors.card : 'transparent',
    elevation: Platform.OS === 'android' ? 8 : 0,
    // iOS: shadow rendered against the BlurView background
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  };

  return (
    <View className="flex-1">
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryForeground,
          tabBarInactiveTintColor: colors.navInactive,
          tabBarLabelStyle: tabLabelStyle,
          tabBarStyle: tabBarStyle,
          tabBarItemStyle: tabItemStyle,
          tabBarActiveBackgroundColor: colors.primary,
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                tint="regular"
                intensity={80}
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: TAB_BORDER_RADIUS, overflow: 'hidden' },
                ]}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isCustomer ? t('nav.customer.myTasks') : t('nav.tasker.browse'),
            tabBarButtonTestID: 'tab-home',
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
            tabBarButtonTestID: 'tab-bookings',
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
            tabBarButtonTestID: 'tab-inbox',
            tabBarIcon: ({ color }) => <MessageSquare color={color} size={TAB_ICON_SIZE} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            tabBarButtonTestID: 'tab-profile',
            tabBarIcon: ({ color }) => <User color={color} size={TAB_ICON_SIZE} />,
          }}
        />
      </Tabs>
      {isCustomer && <FAB />}
    </View>
  );
}
