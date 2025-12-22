import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { DppResponse, EventItem } from "../types/dpp";
import DppLandingPage from "./DppLandingPage";

export default function PublicConsumerDppPage() {
  const { refId } = useParams();
  const [data, setData] = useState<DppResponse | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!refId) return;
    api()
      .get(`/api/public/dpp/${encodeURIComponent(refId)}`, {
        params: { mode: "full" },
      })
      .then((res) => {
        setData(res.data);
        setEvents(res.data.events || []);
      });
  }, [refId]);

  if (!data) return null;

  return <DppLandingPage data={data} allEvents={events} />;
}
