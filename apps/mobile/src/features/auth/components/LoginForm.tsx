import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, FormField, Input } from '../../../components/ui';
import { useRequestOtp, useVerifyOtp } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
    const [phone, setPhone] = useState('+976');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');

    const {t} = useTranslation();
    const requestOtp = useRequestOtp();
    const verifyOtp = useVerifyOtp();

    const handleRequest = () => {
        requestOtp.mutate(phone, {
            onSuccess: () => setStep('otp'),
            onError: (err) => console.error(err),
        });
    };

    const handleVerify = () => {
        verifyOtp.mutate({phone, code});
    };

    const busy = requestOtp.isPending || verifyOtp.isPending;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t("auth.welcome", "Welcome to Tasky")}</Text>

            <FormField label={t("auth.phoneNumber", "Phone Number")}>
                <Input
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={t("auth.phonePlaceholder", "+976...")}
                    keyboardType="phone-pad"
                    editable={!busy && step === 'phone'}
                />
            </FormField>

            {step === 'otp' && (
                <FormField label={t("auth.otpCode", "OTP Code")}>
                    <Input
                        value={code}
                        onChangeText={setCode}
                        placeholder={t("auth.otpPlaceholder", "123456")}
                        keyboardType="number-pad"
                    />
                </FormField>
            )}

            <View style={styles.actions}>
                {step === 'phone' ? (
                    <Button label={t("auth.continue", "Continue")} onPress={handleRequest} loading={busy}/>
                ) : (
                    <Button label={t("auth.verifyLogin", "Verify & Login")} onPress={handleVerify} loading={busy}/>
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
