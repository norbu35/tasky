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
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FAB } from '../../components/ui/FAB';
import { TabBarButton } from '../../components/ui/TabBarButton';
import { screenLayout } from '../../design/screenLayout';
import { mobileTheme } from '../../design/tokenAdapter';
import { useUnreadCount } from '../../features/chat/hooks/useUnreadCount';
import { useRole } from '../../providers/RoleProvider';

const { colors, spacing, typography } = mobileTheme;

const TAB_ICON_SIZE = 22;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isCustomer } = useRole();
  const unreadCount = useUnreadCount();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const inboxIdx = segments.indexOf('inbox');
  const isChatDetail = inboxIdx >= 0 && inboxIdx < segments.length - 1;
  const baseTabBarHeight = screenLayout.chrome.tabBarHeight;
  const tabBarHeight =
    Platform.OS === 'android' ? baseTabBarHeight + insets.bottom : baseTabBarHeight;
  const tabBarStyle = isChatDetail
    ? { display: 'none' as const }
    : {
        height: tabBarHeight,
        paddingTop: spacing.xs,
        paddingBottom: Platform.OS === 'android' ? insets.bottom + spacing.xs : spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.card,
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: '#1A1C1C',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      };

  return (
    <View className="flex-1">
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.primaryForeground,
          tabBarInactiveTintColor: colors.navInactive,
          tabBarStyle,
          tabBarItemStyle: {
            flex: 1,
          },
          tabBarLabelStyle: {
            fontSize: typography.navLabel,
            lineHeight: typography.navLabel + 2,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isCustomer ? t('nav.customer.myTasks') : t('nav.tasker.browse'),
            tabBarButtonTestID: 'tab-home',
            tabBarButton: (props) => <TabBarButton {...props} />,
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
            tabBarButton: (props) => <TabBarButton {...props} />,
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
            tabBarButton: (props) => <TabBarButton {...props} />,
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
            tabBarButton: (props) => <TabBarButton {...props} />,
            tabBarIcon: ({ color }) => <User color={color} size={TAB_ICON_SIZE} />,
          }}
        />
      </Tabs>
      {isCustomer && <FAB />}
    </View>
  );
}
