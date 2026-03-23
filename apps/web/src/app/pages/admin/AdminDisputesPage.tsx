import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { Dispute } from "../../../lib/apiClient";

export function AdminDisputesPage() {
    const { t } = useTranslation();
    const { apiClient, session } = useAppContext();
    const navigate = useNavigate();

    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDisputes = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        setError(null);
        try {
            const result = await apiClient.adminListDisputes(session.accessToken);
            setDisputes(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [apiClient, session]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold">{t("admin.disputes.title", "Disputes")}</h1>
                <p>{t("common.loading", "Loading...")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h1 className="text-2xl font-bold">{t("admin.disputes.title", "Disputes")}</h1>
                <p className="text-red-600">{t("common.error", "Error")}: {error}</p>
            </div>
        );
    }

    if (disputes.length === 0) {
        return (
            <div>
                <h1 className="text-2xl font-bold">{t("admin.disputes.title", "Disputes")}</h1>
                <p>{t("admin.disputes.empty", "No disputes found.")}</p>
            </div>
        );
    }

    function truncate(text: string, max: number): string {
        return text.length > max ? text.slice(0, max) + "..." : text;
    }

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString();
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">{t("admin.disputes.title", "Disputes")}</h1>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-2">{t("admin.disputes.reason", "Reason")}</th>
                        <th className="text-left p-2">{t("admin.disputes.status", "Status")}</th>
                        <th className="text-left p-2">{t("admin.disputes.createdAt", "Created")}</th>
                    </tr>
                </thead>
                <tbody>
                    {disputes.map((dispute) => (
                        <tr
                            key={dispute.id}
                            data-testid="dispute-row"
                            className="border-b cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                        >
                            <td className="p-2">{truncate(dispute.reason, 80)}</td>
                            <td className="p-2">{dispute.status}</td>
                            <td className="p-2">{formatDate(dispute.created_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
