import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Stack as ExpoStack, useRouter as useExpoRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../design/tokenAdapter';
import { Button, FormField, Input, Card, CardContent } from '../components/ui';

export default function CreateTaskScreen() {
  const router = useExpoRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [locationText, setLocationText] = useState('');
  const [budget, setBudget] = useState('');

  return <View style={styles.container}>
    <ExpoStack.Screen
      options={{
        headerShown: true,
        title: `${t("createTask.title")} (${t("createTask.stepTarget", { current: step, total: 3 })})`,
        presentation: 'modal',
      }}
    />
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
      {step === 1 && (
        <Card>
          <CardContent>
            <FormField label={t("createTask.qHelp")}>
              <Input
                placeholder={t("createTask.qHelpPlaceholder")}
                value={title}
                onChangeText={setTitle}
              />
            </FormField>
            <FormField label={t("createTask.qCategory")}>
              <Input
                placeholder={t("createTask.qCategoryPlaceholder")}
                value={category}
                onChangeText={setCategory}
              />
            </FormField>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent>
            <FormField label={t("createTask.qLocation")}>
              <Input
                placeholder={t("createTask.qLocationPlaceholder")}
                value={locationText}
                onChangeText={setLocationText}
              />
            </FormField>
            <Text style={styles.helperText}>
              {t("createTask.mapPinHelper")}
            </Text>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent>
            <FormField label={t("createTask.qBudget")}>
              <Input
                placeholder={t("createTask.qBudgetPlaceholder")}
                keyboardType="number-pad"
                value={budget}
                onChangeText={setBudget}
              />
            </FormField>
            <Text style={styles.helperText}>
              {t("createTask.reviewText", { title: title || '...', location: locationText || '...', budget: budget || '...' })}
            </Text>
          </CardContent>
        </Card>
      )}
    </ScrollView>

    <View style={styles.footer}>
      <Button
        label={t("common.cancel")}
        variant="ghost"
        onPress={() => router.back()}
        style={{ flex: 1 }}
      />
      <Button
        label={step < 3 ? t("common.next") : t("createTask.postTask")}
        onPress={() => {
          if (step < 3) setStep(step + 1);
          else {
            // Mock submit
            router.back();
          }
        }}
        style={{ flex: 1 }}
        disabled={
          (step === 1 && title.trim() === '') ||
          (step === 2 && locationText.trim() === '') ||
          (step === 3 && budget.trim() === '')
        }
      />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: mobileTheme.colors.foreground,
    marginBottom: 20,
  },
  helperText: {
    marginTop: 12,
    color: mobileTheme.colors.mutedForeground,
    fontSize: 14,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.card,
  }
});
