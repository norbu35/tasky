import {View} from 'react-native';
import {BookingList} from '../../features/bookings/components/BookingList';

export default function BookingsScreen() {
    return (
        <View style={{flex:1, backgroundColor: '#f5f5f5'}}>
            <BookingList />
        </View>
    )
}
