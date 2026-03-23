import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function PrivacyPolicyScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <DetailTemplate
            headerTitle={t('shared.legal.privacyTitle', 'Privacy Policy')}
            onBack={() => router.back()}
            testID="privacy-screen"
        >
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.dataCollection', 'Data Collection')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.dataCollectionBody',
                        'We collect information you provide directly, such as your name, phone number, and profile photo, as well as information generated through your use of Tasky.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.dataUsage', 'Data Usage')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.dataUsageBody',
                        'Your data is used to provide and improve our services, match you with tasks or taskers, and ensure the safety of our platform.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.dataStorage', 'Data Storage')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.dataStorageBody',
                        'User data is retained while the account is active. After deletion, data is removed per our retention policy.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.dataSharing', 'Data Sharing')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.dataSharingBody',
                        'We do not sell your personal data. Limited information may be shared with service providers who assist in operating our platform.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.identityData', 'Identity Verification Data')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.identityDataBody',
                        'ID photos and selfies are collected solely for verification. This data is deleted when your account is deleted.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.userRights', 'User Rights')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.userRightsBody',
                        'You have the right to access, modify, and delete your data. Account deletion requests can be submitted from Settings.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.dataRetention', 'Data Retention')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.dataRetentionBody',
                        'User data is retained while the account is active. After deletion, data is removed per policy.',
                    )}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {t('shared.legal.contact', 'Contact')}
                </Text>
                <Text style={styles.sectionBody}>
                    {t(
                        'shared.legal.contactBody',
                        'Contact us with any questions about our privacy policy.',
                    )}
                </Text>
            </View>
        </DetailTemplate>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.subtitle,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.sm,
    },
    sectionBody: {
        fontSize: typography.body,
        color: colors.textSecondary,
        lineHeight: typography.body * 1.6,
    },
});
