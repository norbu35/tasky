import { useTranslation } from "react-i18next";

export function AdminDisputesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.disputes.title", "Disputes")}</h1>
    </div>
  );
}
