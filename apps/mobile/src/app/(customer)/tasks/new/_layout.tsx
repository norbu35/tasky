import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { defaultStackScreenOptions } from '../../../../design/navigationOptions';

export default function NewTaskLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen name="index" options={{ title: t('wizard.stepCategory', 'Category'), headerShown: false }} />
      <Stack.Screen name="category" options={{ title: t('wizard.stepCategory', 'Category'), headerShown: false }} />
      <Stack.Screen name="intake" options={{ title: t('wizard.stepDetails', 'Details') }} />
      <Stack.Screen name="location" options={{ title: t('wizard.stepLocation', 'Location') }} />
      <Stack.Screen name="photos" options={{ title: t('wizard.stepPhotos', 'Photos') }} />
      <Stack.Screen name="schedule" options={{ title: t('wizard.stepSchedule', 'Schedule') }} />
      <Stack.Screen name="review" options={{ title: t('wizard.stepReview', 'Review') }} />
      <Stack.Screen name="success" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
