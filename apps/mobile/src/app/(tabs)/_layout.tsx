import { BlurView } from 'expo-blur';
import { Tabs, useSegments } from 'expo-router';
import {
  Briefcase,
  ClipboardList,
  ListChecks,
  MessageSquare,
  Search,
  User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FAB } from '../../components/ui/FAB';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { useUnreadCount } from '../../features/chat/hooks/useUnreadCount';
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
  const segments = useSegments();
  const unreadCount = useUnreadCount();

  // Hide tab bar when inside a chat detail screen (inbox/[id])
  const inboxIdx = segments.indexOf('inbox');
  const isChatDetail = inboxIdx >= 0 && inboxIdx < segments.length - 1;

  // Tab bar style must be computed here: bottom depends on dynamic safe-area inset.
  // safeAreaInsets: { bottom: 0 } prevents React Navigation from double-adding the inset.
  //
  // Android: full-width bar, flush to screen bottom, safe area absorbed as internal padding.
  // iOS: floating pill positioned above the home indicator zone.
  const isAndroid = Platform.OS === 'android';
  const tabBarStyle = {
    position: 'absolute' as const,
    borderTopWidth: 0,
    // Android: height grows to include system nav bar inset; content sits in top portion.
    // iOS: fixed height, bar floats above safe area.
    height: isAndroid
      ? screenLayout.chrome.tabBarHeight + insets.bottom
      : screenLayout.chrome.tabBarHeight,
    bottom: isAndroid ? 0 : insets.bottom + screenLayout.chrome.tabBarBottom,
    // Android: full-width, no margin. iOS: pill with horizontal margin.
    marginHorizontal: isAndroid ? 0 : spacing.md,
    // Android: push content up from system nav zone. iOS: symmetric padding.
    paddingBottom: isAndroid ? insets.bottom + spacing.sm : spacing.sm,
    paddingTop: spacing.sm,
    borderRadius: isAndroid ? 0 : TAB_BORDER_RADIUS,
    // Android: solid background + elevation shadow
    backgroundColor: isAndroid ? colors.card : 'transparent',
    elevation: isAndroid ? 8 : 0,
    // iOS: shadow rendered against the BlurView background
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    ...(isChatDetail ? { display: 'none' as const } : {}),
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
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: typography.micro },
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
