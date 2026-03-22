import { useTranslation } from "react-i18next";

export function AdminDisputeDetailPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.disputeDetail.title", "Dispute Detail")}</h1>
    </div>
  );
}
