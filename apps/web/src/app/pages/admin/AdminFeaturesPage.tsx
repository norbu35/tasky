import { useTranslation } from "react-i18next";

export function AdminFeaturesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.features.title", "Features")}</h1>
    </div>
  );
}
