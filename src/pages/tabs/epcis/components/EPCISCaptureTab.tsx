import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { api } from "@/api";
import EPCISTable from "./EPCISTable";

/* ================= FIX TYPE MODAL ================= */
type EPCISFormModalProps = {
  open: boolean;
  record?: any;
  onClose: () => void;
  onSuccess: () => void;
};

// Mock để build không lỗi
const EPCISFormModal: React.FC<EPCISFormModalProps> = () => null;
/* ================================================ */

export default function EPCISCaptureTab({ batch }: { batch: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; record?: any }>({
    open: false,
  });

  const fetchEpcisEvents = async () => {
    if (!batch?.code) return;
    try {
      setLoading(true);
      const res = await api().get("/api/epcis/events", {
        params: { batch_code: batch.code },
      });
      setEvents(res.data.items || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load EPCIS events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpcisEvents();
  }, [batch?.code]);

  return (
    <Spin spinning={loading}>
      <EPCISTable
        events={events}
        batchStatus={batch?.status}
        onReload={fetchEpcisEvents}
        onEdit={(record: any) =>
          setModal({
            open: true,
            record,
          })
        }
      />

      <EPCISFormModal
        open={modal.open}
        record={modal.record}
        onClose={() => setModal({ open: false })}
        onSuccess={fetchEpcisEvents}
      />
    </Spin>
  );
}
