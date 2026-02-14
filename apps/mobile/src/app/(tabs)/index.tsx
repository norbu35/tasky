import {View} from 'react-native';
import {TaskFeed} from '../../features/tasks/components/TaskFeed';

export default function FeedScreen() {
    return (
        <View style={{flex:1, backgroundColor: '#f5f5f5'}}>
            <TaskFeed />
        </View>
    )
}
