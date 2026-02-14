import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTasks } from '../hooks/useTasks';

export function TaskFeed() {
  const { data, isLoading } = useTasks();

  if (isLoading) return <Text style={{padding: 20}}>Loading tasks...</Text>;

  return (
    <FlatList
      data={data?.data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.description}</Text>
          <Text style={styles.price}>{item.budget} MNT</Text>
          <Text style={styles.loc}>{item.approximate_location}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No tasks found</Text>}
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
