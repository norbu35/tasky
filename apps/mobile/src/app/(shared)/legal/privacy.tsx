import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DetailTemplate } from '../../../components/templates/DetailTemplate';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <DetailTemplate testID="SCR-TASK-018">
      <View className="mb-lg">
        <Text className="text-caption text-text-secondary text-left">
          {t('shared.legal.updated', 'Сүүлд шинэчлэгдсэн: 2026.01.01')}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataCollection', 'Мэдээлэл цуглуулах')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.dataCollectionBody',
            'Бид таны нэр, утасны дугаар, профайл зураг зэрэг шууд өгсөн мэдээлэл болон Tasky-г ашиглах явцад үүссэн мэдээллийг цуглуулна.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataUsage', 'Мэдээллийн ашиглалт')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.dataUsageBody',
            'Таны мэдээллийг үйлчилгээ үзүүлэх, сайжруулах, даалгавар болон tasker-уудыг тааруулах, платформын аюулгүй байдлыг хангахад ашиглана.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataStorage', 'Мэдээлэл хадгалах')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.dataStorageBody',
            'Хэрэглэгчийн мэдээллийг бүртгэл идэвхтэй байх хугацаанд хадгална. Устгасны дараа хадгалалтын бодлогын дагуу устгана.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataSharing', 'Мэдээлэл хуваалцах')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.dataSharingBody',
            'Бид таны хувийн мэдээллийг худалдахгүй. Платформыг ажиллуулахад тусалдаг үйлчилгээ үзүүлэгчтэй хязгаарлагдмал мэдээлэл хуваалцаж болно.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.identityData', 'Таниулах баталгаажуулалтын мэдээлэл')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.identityDataBody',
            'Иргэний үнэмлэхний зураг болон амьд зургийг зөвхөн баталгаажуулалтын зорилгоор цуглуулна. Бүртгэл устгахад энэ мэдээлэл устгагдана.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.userRights', 'Хэрэглэгчийн эрх')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.userRightsBody',
            'Та өөрийн мэдээлэлд хандах, засах, устгах эрхтэй. Бүртгэл устгах хүсэлтийг Тохиргоо хэсгээс илгээнэ.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.dataRetention', 'Мэдээлэл хадгалах хугацаа')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.dataRetentionBody',
            'Хэрэглэгчийн мэдээллийг бүртгэл хүчинтэй байх хугацаанд хадгална. Устгасны дараа мэдээллийг бодлогын дагуу устгана.',
          )}
        </Text>
      </View>

      <View className="mb-lg">
        <Text className="text-subtitle font-semibold text-primary-deep mb-sm text-left">
          {t('shared.legal.contact', 'Холбоо барих')}
        </Text>
        <Text className="text-body text-text-secondary text-left" style={{ lineHeight: 24 }}>
          {t(
            'shared.legal.contactBody',
            'Нууцлалын бодлогын талаар асуулт байвал бидэнтэй холбогдоно уу.',
          )}
        </Text>
        <View className="mt-md bg-card rounded-md p-md gap-xs">
          <Text className="text-caption text-text-secondary text-left">
            {t('shared.legal.contactEmail', 'Имэйл')}
          </Text>
          <Text className="text-body font-semibold text-primary-deep text-left">
            support@tasky.mn
          </Text>
        </View>
      </View>
    </DetailTemplate>
  );
}
