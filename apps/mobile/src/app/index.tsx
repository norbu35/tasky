import { Redirect } from 'expo-router';
import { useAppStore } from '../store/appStore';

export default function Index() {
    const hasSeenOnboarding = useAppStore((state) => state.hasSeenOnboarding);

    if (!hasSeenOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    return <Redirect href="/(tabs)" />;
}
