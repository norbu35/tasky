import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTasks } from '../hooks/useTasks';
import { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { TaskDetailsModal } from './TaskDetailsModal';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { PublicTask } from '../../../lib/mobileApiClient';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export function TaskFeed() {
    const { t } = useTranslation();
    const { data, isLoading } = useTasks();
    const [selectedTask, setSelectedTask] = useState<PublicTask | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    if (isLoading) {
        return (
            <View style={[styles.container, styles.list]}>
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
            </View>
        );
    }

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
                    label={t("taskFeed.listMode")}
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setViewMode('list')}
                    style={styles.toggleBtn}
                />
                <Button
                    label={t("taskFeed.mapMode")}
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
                        <TouchableOpacity onPress={() => setSelectedTask(item)}>
                            <Card style={styles.cardSpacing}>
                                <CardHeader>
                                    <View style={styles.cardHeaderRow}>
                                        <CardTitle style={styles.title}>{item.description}</CardTitle>
                                        <Text style={styles.price}>{item.budget} {t("taskFeed.currencySuffix")}</Text>
                                    </View>
                                </CardHeader>
                                <CardContent>
                                    <Text style={styles.loc}>{item.approximate_location}</Text>
                                </CardContent>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <MapView
                    style={styles.map}
                    initialRegion={ulaanbaatarRegion}
                >
                    {tasks.map((t_item) => (
                        t_item.approximate_lat && t_item.approximate_lng ? (
                            <Marker
                                key={t_item.id}
                                coordinate={{ latitude: t_item.approximate_lat, longitude: t_item.approximate_lng }}
                                title={`${t_item.budget} ${t("taskFeed.currencySuffix")}`}
                                description={t_item.description}
                                onPress={() => setSelectedTask(t_item)}
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
    cardSpacing: {
        marginBottom: 12,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        flex: 1,
        marginRight: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    price: {
        color: mobileTheme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    loc: {
        color: mobileTheme.colors.mutedForeground,
        fontSize: 14,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: mobileTheme.colors.mutedForeground,
    }
});
