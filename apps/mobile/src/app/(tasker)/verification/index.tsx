import React from 'react';
import { useRouter } from 'expo-router';
import { VerificationGate } from '../../../features/tasks/components/VerificationGate';

export default function VerificationIndexScreen() {
  const router = useRouter();

  return (
    <VerificationGate
      onStartVerification={() => router.push('/(tasker)/verification/consent')}
      onMaybeLater={() => router.back()}
    />
  );
}
