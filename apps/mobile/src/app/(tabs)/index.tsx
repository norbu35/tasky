import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskFeed } from '../../features/tasks/components/TaskFeed';

export default function FeedScreen() {
    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <TaskFeed />
        </SafeAreaView>
    );
}
