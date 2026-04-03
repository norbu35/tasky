import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, spacing, typography } = mobileTheme;

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <DetailTemplate
      testID="privacy-screen"
    >
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>
          {t('shared.legal.updated', 'Сүүлд шинэчлэгдсэн: 2026.01.01')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.dataCollection', 'Мэдээлэл цуглуулах')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.dataCollectionBody',
            'Бид таны нэр, утасны дугаар, профайл зураг зэрэг шууд өгсөн мэдээлэл болон Tasky-г ашиглах явцад үүссэн мэдээллийг цуглуулна.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.dataUsage', 'Мэдээллийн ашиглалт')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.dataUsageBody',
            'Таны мэдээллийг үйлчилгээ үзүүлэх, сайжруулах, даалгавар болон tasker-уудыг тааруулах, платформын аюулгүй байдлыг хангахад ашиглана.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.dataStorage', 'Мэдээлэл хадгалах')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.dataStorageBody',
            'Хэрэглэгчийн мэдээллийг бүртгэл идэвхтэй байх хугацаанд хадгална. Устгасны дараа хадгалалтын бодлогын дагуу устгана.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.dataSharing', 'Мэдээлэл хуваалцах')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.dataSharingBody',
            'Бид таны хувийн мэдээллийг худалдахгүй. Платформыг ажиллуулахад тусалдаг үйлчилгээ үзүүлэгчтэй хязгаарлагдмал мэдээлэл хуваалцаж болно.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.identityData', 'Таниулах баталгаажуулалтын мэдээлэл')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.identityDataBody',
            'Иргэний үнэмлэхний зураг болон амьд зургийг зөвхөн баталгаажуулалтын зорилгоор цуглуулна. Бүртгэл устгахад энэ мэдээлэл устгагдана.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('shared.legal.userRights', 'Хэрэглэгчийн эрх')}</Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.userRightsBody',
            'Та өөрийн мэдээлэлд хандах, засах, устгах эрхтэй. Бүртгэл устгах хүсэлтийг Тохиргоо хэсгээс илгээнэ.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('shared.legal.dataRetention', 'Мэдээлэл хадгалах хугацаа')}
        </Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.dataRetentionBody',
            'Хэрэглэгчийн мэдээллийг бүртгэл хүчинтэй байх хугацаанд хадгална. Устгасны дараа мэдээллийг бодлогын дагуу устгана.',
          )}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('shared.legal.contact', 'Холбоо барих')}</Text>
        <Text style={styles.sectionBody}>
          {t(
            'shared.legal.contactBody',
            'Нууцлалын бодлогын талаар асуулт байвал бидэнтэй холбогдоно уу.',
          )}
        </Text>
        <View style={styles.supportCard}>
          <Text style={styles.supportLabel}>{t('shared.legal.contactEmail', 'Имэйл')}</Text>
          <Text style={styles.supportEmail}>support@tasky.mn</Text>
        </View>
      </View>
    </DetailTemplate>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    marginBottom: spacing.lg,
  },
  metaLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.6,
    textAlign: 'left',
  },
  supportCard: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: mobileTheme.radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  supportLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  supportEmail: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.primaryDeep,
    textAlign: 'left',
  },
});
