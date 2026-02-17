import {LoginForm} from '../../features/auth/components/LoginForm';
import {View} from 'react-native';

export default function AuthScreen() {
    return (
        <View style={{flex: 1, backgroundColor: 'white'}}>
            <LoginForm/>
        </View>
    );
}
