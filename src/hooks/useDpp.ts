import { useEffect, useState } from "react";
import { fetchDPP } from "../api/dpp";
import { EPCISEvent, DppResponse } from "../types/epcis";

export default function useDpp(ref: string) {
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const [dpp, setDpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;

    async function load() {
      try {
        setLoading(true);

        const result = await fetchDPP(ref);
        setData(result);

        // Sort events safely
        const sorted = [...(result.events || [])].sort((a, b) => {
          const t1 = a.event_time ? new Date(a.event_time).getTime() : 0;
          const t2 = b.event_time ? new Date(b.event_time).getTime() : 0;
          return t1 - t2;
        });

        setEvents(sorted);

        // Extract DPP
        const dppEvent = sorted.find(e => e.ilmd?.dpp);
        setDpp(dppEvent?.ilmd?.dpp || null);

      } catch (e: any) {
        console.error("DPP load error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ref]);

  return { data, events, dpp, loading, error };
}
