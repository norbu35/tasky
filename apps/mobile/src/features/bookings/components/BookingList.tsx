import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../hooks/useBookings';

export function BookingList() {
    const { t } = useTranslation();
    const {data, isLoading} = useBookings();

    if (isLoading) return <Text style={{padding: 20}}>{t('bookingList.loading')}</Text>;

    return (
        <FlatList
            data={data?.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({item}) => (
                <View style={styles.card}>
                    <Text style={styles.status}>{item.status}</Text>
                    <Text style={styles.id}>{t('bookingList.taskId')}: {item.task_id.slice(0, 8)}...</Text>
                </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>{t('bookingList.empty')}</Text>}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    id: {
        color: '#666',
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: '#999',
    }
});
