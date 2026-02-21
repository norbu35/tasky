import { View } from 'react-native';
import { ProfileView } from '../../features/profile/components/ProfileView';

export default function ProfileScreen() {
    return (
        <View style={{flex: 1, backgroundColor: 'white'}}>
            <ProfileView/>
        </View>
    )
}
