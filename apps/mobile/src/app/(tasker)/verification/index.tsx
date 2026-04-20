import { useRouter } from 'expo-router';
import React from 'react';

import { VerificationGate } from '@/features/verification/components/VerificationGate';

export default function VerificationIndexScreen() {
  const router = useRouter();

  return (
    <VerificationGate
      testID="SCR-TASK-003"
      onStartVerification={() => router.push('/(tasker)/verification/consent')}
      onMaybeLater={() => router.back()}
    />
  );
}
