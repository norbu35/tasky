import { useTranslation } from "react-i18next";

export function AdminVerificationsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.verifications.title", "Verifications")}</h1>
    </div>
  );
}
