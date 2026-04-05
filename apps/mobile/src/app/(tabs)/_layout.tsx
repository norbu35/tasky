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

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isCustomer } = useRole();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primaryForeground,
          tabBarInactiveTintColor: colors.navInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarActiveBackgroundColor: colors.primary,
          tabBarBackground: () => (
            <BlurView
              tint="regular"
              intensity={80}
              style={[StyleSheet.absoluteFill, styles.blurBackground]}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isCustomer
              ? t('nav.customer.myTasks', 'My Tasks')
              : t('nav.tasker.browse', 'Browse'),
            tabBarTestID: 'tab-browse',
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
            title: isCustomer
              ? t('nav.customer.bookings', 'Bookings')
              : t('nav.tasker.myJobs', 'My Jobs'),
            tabBarTestID: 'tab-bookings',
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
            title: t('nav.inbox', 'Inbox'),
            tabBarTestID: 'tab-inbox',
            tabBarIcon: ({ color }) => <MessageSquare color={color} size={TAB_ICON_SIZE} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('nav.profile', 'Profile'),
            tabBarTestID: 'tab-profile',
            tabBarButton: (props) => <Pressable {...props} testID="tab-profile" />,
            tabBarIcon: ({ color }) => <User color={color} size={TAB_ICON_SIZE} />,
          }}
        />
      </Tabs>
      {isCustomer && <FAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
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
  },
  tabItem: {
    borderRadius: radius.md,
    paddingVertical: spacing.xs + spacing.xs / 2,
    flex: 1,
  },
  tabLabel: {
    fontSize: typography.navLabel,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  blurBackground: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
});
