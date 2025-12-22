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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!refId) return;

    async function load() {
      try {
        const res = await api().get(`/api/public/dpp/${encodeURIComponent(refId)}`, {
          params: { mode: "full" },
        });
        setData(res.data);
        setEvents(res.data.events || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load DPP");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [refId]);

  if (loading) {
    return (
      <PublicLayout>
        <Spin style={{ marginTop: 40 }} />
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <Alert type="error" message={error || "DPP not found"} />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <DppLandingPage data={data} allEvents={events} />
    </PublicLayout>
  );
}
