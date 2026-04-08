import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingList } from '../../features/bookings/components/BookingList';

export default function BookingsScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <BookingList />
    </SafeAreaView>
  );
}
