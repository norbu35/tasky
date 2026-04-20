import React from 'react';
import { Text, View } from 'react-native';

export function PhoneWarning({ text }: { text: string }) {
  return (
    <View testID="phone-warning" className="bg-secondary py-sm px-md">
      <Text className="text-label text-foreground text-center">{text}</Text>
    </View>
  );
}
