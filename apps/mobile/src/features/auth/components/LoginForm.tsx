import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, Input, FormField } from '../../../components/ui';
import { useRequestOtp, useVerifyOtp } from '../hooks/useAuth';

export function LoginForm() {
  const [phone, setPhone] = useState('+976');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handleRequest = () => {
    requestOtp.mutate(phone, {
      onSuccess: () => setStep('otp'),
      onError: (err) => console.error(err),
    });
  };

  const handleVerify = () => {
    verifyOtp.mutate({ phone, code });
  };

  const busy = requestOtp.isPending || verifyOtp.isPending;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tasky</Text>
      
      <FormField label="Phone Number">
        <Input 
          value={phone} 
          onChangeText={setPhone} 
          placeholder="+976..." 
          keyboardType="phone-pad"
          editable={!busy && step === 'phone'}
        />
      </FormField>

      {step === 'otp' && (
        <FormField label="OTP Code">
          <Input 
            value={code} 
            onChangeText={setCode} 
            placeholder="123456" 
            keyboardType="number-pad"
          />
        </FormField>
      )}

      <View style={styles.actions}>
        {step === 'phone' ? (
          <Button label="Continue" onPress={handleRequest} loading={busy} />
        ) : (
          <Button label="Verify & Login" onPress={handleVerify} loading={busy} />
        )}
      </View>
      
      {(requestOtp.error || verifyOtp.error) && (
         <Text style={styles.error}>
           {requestOtp.error?.message || verifyOtp.error?.message}
         </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actions: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  }
});
