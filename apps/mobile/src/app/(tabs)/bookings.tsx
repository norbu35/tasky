import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { BookingList } from '../../features/bookings/components/BookingList';
import { mobileTheme } from '../../design/tokenAdapter';

export default function BookingsScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <BookingList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
});
