import { useTranslation } from "react-i18next";

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.categories.title", "Categories")}</h1>
    </div>
  );
}
