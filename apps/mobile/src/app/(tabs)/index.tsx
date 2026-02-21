import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskFeed } from '../../features/tasks/components/TaskFeed';
import { CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from 'react-i18next';

const WalkthroughableView = walkthroughable(View);

export default function FeedScreen() {
    const { start, copilotEvents } = useCopilot();
    const hasSeenTour = useAppStore((state) => state.hasSeenTour);
    const completeTour = useAppStore((state) => state.completeTour);
    const { t } = useTranslation();

    useEffect(() => {
        if (!hasSeenTour) {
            start();
        }

        const listener = () => {
            completeTour();
        };

        copilotEvents.on('stop', listener);

        return () => {
            copilotEvents.off('stop', listener);
        };
    }, [hasSeenTour]);

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <CopilotStep text="Here is where you can find open tasks in your area." order={1} name="feed">
                <WalkthroughableView style={{ flex: 1 }}>
                    <TaskFeed />
                </WalkthroughableView>
            </CopilotStep>
        </SafeAreaView>
    );
}
