import PublicLayout from "../components/layout/PublicLayout";
import DppLandingPage from "./DppLandingPage";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Spin, Alert } from "antd";
import { DppResponse, EventItem } from "../types/dpp";

export default function PublicConsumerDppPage() {
  const { refId } = useParams<{ refId: string }>();

  const [data, setData] = useState<DppResponse | null>(null);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔥 PublicConsumerDppPage mounted, refId =", refId);

    if (!refId) {
      setError("Missing DPP reference");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await api().get(
          `/api/public/dpp/${encodeURIComponent(refId)}`,
          { params: { mode: "full" } }
        );

        console.log("✅ DPP API response:", res.data);

        setData(res.data);

        /**
         * IMPORTANT:
         * - Landing page cần toàn bộ EPCIS events
         * - Ưu tiên events từ API chính
         */
        setAllEvents(res.data.events || []);
      } catch (e: any) {
        console.error("❌ Failed to load public DPP", e);
        setError(e?.response?.data?.detail || e?.message || "Failed to load DPP");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [refId]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <PublicLayout>
        <div style={{ padding: 40, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </PublicLayout>
    );
  }

  /* ================= ERROR ================= */
  if (error || !data) {
    return (
      <PublicLayout>
        <div style={{ padding: 24 }}>
          <Alert
            type="error"
            message="DPP not available"
            description={error || "DPP not found"}
            showIcon
          />
        </div>
      </PublicLayout>
    );
  }

  /* ================= SUCCESS ================= */
  console.log("🎉 Rendering DppLandingPage");

  return (
    <PublicLayout>
      <DppLandingPage data={data} allEvents={allEvents} />
    </PublicLayout>
  );
}
