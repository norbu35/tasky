import type { paths } from "@tasky/sdk";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Button, FormField, Input, ModalSheet, Toast } from "./src/components/ui";
import { mobileTheme } from "./src/design/tokenAdapter";

export default function App() {
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const typedContractLoaded: boolean = typeof ({} as paths) === "object";
  const hasValidationError = category.trim().length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Tasky Mobile Intake</Text>
        <Text style={styles.subtitle}>
          Shared token adapter active: {String(typedContractLoaded)}
        </Text>
        <Toast message="Native parity components are ready for form flows." variant="info" />
        <View style={styles.form}>
          <FormField
            label="Category"
            helperText="Use a concrete service label"
            errorText={hasValidationError ? "Category is required." : undefined}
          >
            <Input
              accessibilityLabel="Category input"
              value={category}
              onChangeText={setCategory}
              placeholder="Apartment cleaning"
              invalid={hasValidationError}
            />
          </FormField>
          <FormField label="Budget (MNT)" helperText="Average apartment cleaning starts at 120000 MNT.">
            <Input
              accessibilityLabel="Budget input"
              value={budget}
              onChangeText={setBudget}
              placeholder="120000"
              keyboardType="numeric"
            />
          </FormField>
          <FormField label="Details" helperText="Describe access notes and timing.">
            <Input
              accessibilityLabel="Details input"
              value={notes}
              onChangeText={setNotes}
              placeholder="Vacuum and bathroom cleaning, Saturday 11:00"
            />
          </FormField>
        </View>
        <View style={styles.actions}>
          <Button label="Save Draft" variant="secondary" />
          <Button label="Preview" onPress={() => setPreviewVisible(true)} />
        </View>
        <ModalSheet
          visible={previewVisible}
          title="Task Preview"
          onClose={() => setPreviewVisible(false)}
        >
          <Text style={styles.previewText}>Category: {category || "-"}</Text>
          <Text style={styles.previewText}>Budget: {budget || "-"}</Text>
          <Text style={styles.previewText}>Details: {notes || "-"}</Text>
        </ModalSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background
  },
  container: {
    flex: 1,
    paddingHorizontal: mobileTheme.spacing.xl,
    paddingVertical: mobileTheme.spacing.xl,
    gap: mobileTheme.spacing.lg
  },
  title: {
    fontSize: mobileTheme.typography.heading,
    fontWeight: "700",
    color: mobileTheme.colors.foreground
  },
  subtitle: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.mutedForeground
  },
  form: {
    gap: mobileTheme.spacing.md
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: mobileTheme.spacing.md
  },
  previewText: {
    fontSize: mobileTheme.typography.body,
    color: mobileTheme.colors.foreground
  }
});
