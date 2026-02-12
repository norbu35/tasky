import type { paths } from "@tasky/sdk";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Tasky Mobile</Text>
        <Text style={styles.subtitle}>Expo scaffold is ready.</Text>
        <Text style={styles.subtitle}>
          OpenAPI SDK binding loaded: {String(typedContractLoaded)}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f3e8"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#203040"
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#384f63",
    textAlign: "center"
  }
});
