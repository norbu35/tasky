import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingList } from '../../features/bookings/components/BookingList';

export default function BookingsScreen() {
    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <BookingList />
        </SafeAreaView>
    );
}
