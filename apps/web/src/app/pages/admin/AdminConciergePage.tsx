import { useTranslation } from "react-i18next";

export function AdminConciergePage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.concierge.title", "Concierge")}</h1>
    </div>
  );
}
