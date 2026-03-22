import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import { Search, ClipboardList, MessageSquare, User, ListChecks } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { FAB } from '../../components/ui/FAB';
import { useTranslation } from 'react-i18next';
import { useRole } from '../../providers/RoleProvider';

const { colors, radius, typography } = mobileTheme;

export default function TabsLayout() {
    const { t } = useTranslation();
    const { isCustomer } = useRole();

    return (
        <View style={{ flex: 1 }}>
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
                        title: isCustomer ? t('nav.myTasks', 'MY TASKS') : t('nav.findWork', 'FIND WORK'),
                        tabBarIcon: ({ color, size }) =>
                            isCustomer
                                ? <ListChecks color={color} size={size - 4} />
                                : <Search color={color} size={size - 4} />,
                    }}
                />
                <Tabs.Screen
                    name="bookings"
                    options={{
                        title: isCustomer ? t('nav.bookings', 'BOOKINGS') : t('nav.myJobs', 'MY JOBS'),
                        tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size - 4} />,
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: t('nav.inbox', 'INBOX'),
                        tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size - 4} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t('nav.profile', 'PROFILE'),
                        tabBarIcon: ({ color, size }) => <User color={color} size={size - 4} />,
                    }}
                />
                <Tabs.Screen
                    name="tasks"
                    options={{ href: null }}
                />
            </Tabs>
            {isCustomer && <FAB />}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        borderTopWidth: 0,
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        paddingHorizontal: 17,
        backgroundColor: 'transparent',
        borderTopLeftRadius: radius.md,
        borderTopRightRadius: radius.md,
        shadowColor: '#1A1C1C',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
    },
    tabItem: {
        borderRadius: radius.md,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    tabLabel: {
        fontSize: typography.navLabel,
        fontWeight: '600',
        letterSpacing: 0.275,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    blurBackground: {
        borderTopLeftRadius: radius.md,
        borderTopRightRadius: radius.md,
        overflow: 'hidden',
    },
});
