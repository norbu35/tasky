import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingList } from '../../features/bookings/components/BookingList';
import { mobileTheme } from '../../design/tokenAdapter';

export default function BookingsScreen() {
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: mobileTheme.colors.background }}
    >
      <BookingList />
    </SafeAreaView>
  );
}
