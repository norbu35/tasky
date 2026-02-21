import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Button, FormField, Input } from '../../../components/ui';
import { useRequestOtp, useVerifyOtp, useDevLogin } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
    const [phone, setPhone] = useState('+976');
    const [code, setCode] = useState('');
    const [step, setStep] = useState<'options' | 'phone' | 'otp'>('options');

    const { t } = useTranslation();
    const requestOtp = useRequestOtp();
    const verifyOtp = useVerifyOtp();
    const devLogin = useDevLogin();

    const handleRequest = () => {
        requestOtp.mutate(phone, {
            onSuccess: () => setStep('otp'),
            onError: (err) => console.error(err),
        });
    };

    const handleVerify = () => {
        verifyOtp.mutate({ phone, code });
    };

    const handleDevBypass = () => {
        // Dev Mode Bypass - Automatically injects a superuser testing footprint
        devLogin.mutate({ phone: "+97699999999", role: "CUSTOMER" });
    };

    const handleFacebookLogin = () => {
        Alert.alert("Coming Soon", "Facebook OAuth integration is pending backend callback support.");
    };

    const busy = requestOtp.isPending || verifyOtp.isPending || devLogin.isPending;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t("auth.welcome", "Welcome to Tasky")}</Text>

            {step === 'options' && (
                <View style={styles.optionsContainer}>
                    <Button
                        label={t("auth.continueFacebook", "Continue with Facebook")}
                        onPress={handleFacebookLogin}
                        style={styles.fbButton}
                    />

                    <View style={styles.divider}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.line} />
                    </View>

                    <Button
                        label={t("auth.continuePhone", "Login with Phone (OTP)")}
                        variant="outline"
                        onPress={() => setStep('phone')}
                    />

                    {__DEV__ && (
                        <Button
                            label="Developer Bypass Login"
                            variant="secondary"
                            onPress={handleDevBypass}
                            style={styles.devButton}
                            isLoading={busy}
                        />
                    )}
                </View>
            )}

            {step === 'phone' && (
                <FormField label={t("auth.phoneNumber", "Phone Number")}>
                    <Input
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t("auth.phonePlaceholder", "+976...")}
                        keyboardType="phone-pad"
                        editable={!busy && step === 'phone'}
                    />
                </FormField>
            )}

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
                {step === 'phone' && (
                    <Button label={t("auth.continue", "Continue")} onPress={handleRequest} isLoading={busy} />
                )}

                {step === 'otp' && (
                    <Button label={t("auth.verifyLogin", "Verify & Login")} onPress={handleVerify} isLoading={busy} />
                )}

                {(step === 'phone' || step === 'otp') && (
                    <Button
                        label={t("common.back", "Back")}
                        variant="ghost"
                        onPress={() => setStep(step === 'otp' ? 'phone' : 'options')}
                        disabled={busy}
                        style={{ marginTop: 8 }}
                    />
                )}
            </View>

            {(requestOtp.error || verifyOtp.error || devLogin.error) && (
                <Text style={styles.error}>
                    {requestOtp.error?.message || verifyOtp.error?.message || devLogin.error?.message}
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
        marginBottom: 30,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
    },
    fbButton: {
        backgroundColor: '#1877F2', // Official Facebook Blue
        marginBottom: 20,
    },
    devButton: {
        marginTop: 40,
        backgroundColor: '#f59e0b', // Amber to distinguish it
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#6b7280',
        fontWeight: '500',
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
