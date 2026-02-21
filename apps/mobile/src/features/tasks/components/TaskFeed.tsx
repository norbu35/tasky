import { FlatList, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { TaskDetailsModal } from './TaskDetailsModal';
import { PublicTask } from '../../../lib/mobileApiClient';
import { Button } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';

const { width, height } = Dimensions.get('window');

export function TaskFeed() {
    const { data, isLoading } = useTasks();
    const [selectedTask, setSelectedTask] = useState<PublicTask | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    if (isLoading) return <Text style={{ padding: 20 }}>Loading tasks...</Text>;

    const tasks = data?.data ?? [];

    const ulaanbaatarRegion = {
        latitude: 47.9200,
        longitude: 106.9200,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    return (
        <View style={styles.container}>
            <View style={styles.toggleRow}>
                <Button
                    label="List"
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setViewMode('list')}
                    style={styles.toggleBtn}
                />
                <Button
                    label="Map"
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setViewMode('map')}
                    style={styles.toggleBtn}
                />
            </View>

            {viewMode === 'list' ? (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.card} onPress={() => setSelectedTask(item)}>
                            <Text style={styles.title}>{item.description}</Text>
                            <Text style={styles.price}>{item.budget} MNT</Text>
                            <Text style={styles.loc}>{item.approximate_location}</Text>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <MapView
                    style={styles.map}
                    initialRegion={ulaanbaatarRegion}
                >
                    {tasks.map((t) => (
                        t.approximate_lat && t.approximate_lng ? (
                            <Marker
                                key={t.id}
                                coordinate={{ latitude: t.approximate_lat, longitude: t.approximate_lng }}
                                title={t.budget + " MNT"}
                                description={t.description}
                                onPress={() => setSelectedTask(t)}
                            />
                        ) : null
                    ))}
                </MapView>
            )}

            <TaskDetailsModal
                visible={!!selectedTask}
                task={selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: mobileTheme.colors.background,
    },
    toggleRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    toggleBtn: {
        flex: 1,
    },
    map: {
        width,
        flex: 1,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    price: {
        color: '#2e7d32',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    loc: {
        color: '#666',
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: '#999',
    }
});
