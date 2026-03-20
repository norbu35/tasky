import { Stack } from 'expo-router';
import { CustomerTaskDetail } from '../../features/tasks/components/CustomerTaskDetail';

export default function TaskDetailRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <CustomerTaskDetail />
        </>
    );
}
