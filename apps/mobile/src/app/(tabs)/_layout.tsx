import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import { Home, Calendar, MessageSquare, User } from 'lucide-react-native';
import { mobileTheme } from '../../design/tokenAdapter';
import { FAB } from '../../components/ui/FAB';
import { useTranslation } from 'react-i18next';

const { colors } = mobileTheme;

export default function TabsLayout() {
    const { t } = useTranslation();

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.mutedForeground,
                    tabBarStyle: styles.tabBar,
                    tabBarBackground: () => (
                        <BlurView
                            tint="regular"
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                        />
                    ),
                    // Platform specific tweaks for the transparent look
                    ...Platform.select({
                        ios: {
                            // iOS blur requires transparent background
                            tabBarTransparent: true,
                        },
                        android: {
                            // Android styles
                            tabBarTransparent: true,
                        },
                    }),
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: t('nav.explore'),
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="bookings"
                    options={{
                        title: t('nav.bookings'),
                        tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: t('nav.messages'),
                        tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t('nav.profile'),
                        tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                    }}
                />
            </Tabs>
            <FAB />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        borderTopWidth: 0,
        elevation: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        backgroundColor: 'transparent',
    }
});
