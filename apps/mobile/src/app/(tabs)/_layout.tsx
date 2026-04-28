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
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nativeTokens } from '@tasky/design-tokens';

import { FAB } from '@/components/ui/FAB';
import { TabBarButton } from '@/components/ui/TabBarButton';
import { elevations } from '@/design/elevations';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme, withAlpha } from '@/design/tokenAdapter';
import { useUnreadCount } from '@/features/chat/hooks/useUnreadCount';
import { useReviewGate } from '@/features/review/components/ReviewGateProvider';
import { useRole } from '@/providers/RoleProvider';

const { colors, typography } = mobileTheme;
const {
  tabBarHeight: baseTabBarHeight,
  tabBarInsetX,
  tabBarInsetY,
  tabBarSurfaceOpacity,
  tabIconSize,
} = screenLayout.chrome;

const TAB_BAR_TINT = withAlpha(colors.background, tabBarSurfaceOpacity);
const TAB_BAR_TOP_RADIUS = nativeTokens.radius.md;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isCustomer } = useRole();
  const { isLocked } = useReviewGate();
  const unreadCount = useUnreadCount();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const inboxIdx = segments.indexOf('inbox');
  const isChatDetail = inboxIdx >= 0 && inboxIdx < segments.length - 1;
  const tabBarHeight =
    Platform.OS === 'android' ? baseTabBarHeight + insets.bottom : baseTabBarHeight;
  const tabBarStyle = isChatDetail
    ? { display: 'none' as const }
    : {
        height: tabBarHeight,
        paddingTop: tabBarInsetY,
        paddingBottom: Platform.OS === 'android' ? insets.bottom + tabBarInsetY : tabBarInsetY,
        paddingHorizontal: tabBarInsetX,
        backgroundColor: TAB_BAR_TINT,
        borderTopWidth: 0,
        borderTopLeftRadius: TAB_BAR_TOP_RADIUS,
        borderTopRightRadius: TAB_BAR_TOP_RADIUS,
        ...elevations.navBar,
      };

  return (
    <View className="flex-1">
      <Tabs
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.navInactive,
          tabBarStyle,
          tabBarItemStyle: {
            flex: 1,
          },
          tabBarBackground: () =>
            isChatDetail ? null : <BlurView intensity={20} tint="light" className="flex-1" />,
          tabBarLabelStyle: {
            fontSize: typography.micro,
            lineHeight: typography.micro + 2,
            fontWeight: nativeTokens.typographyVariants.navLabel.fontWeight,
            fontFamily: nativeTokens.typography.families.display,
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
                <ListChecks color={color} size={tabIconSize} />
              ) : (
                <Search color={color} size={tabIconSize} />
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
                <ClipboardList color={color} size={tabIconSize} />
              ) : (
                <Briefcase color={color} size={tabIconSize} />
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
            tabBarIcon: ({ color }) => <MessageSquare color={color} size={tabIconSize} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile'),
            tabBarButtonTestID: 'tab-profile',
            tabBarButton: (props) => <TabBarButton {...props} />,
            tabBarIcon: ({ color }) => <User color={color} size={tabIconSize} />,
          }}
        />
      </Tabs>
      {isCustomer && <FAB hidden={isLocked || isChatDetail} />}
    </View>
  );
}
