import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { api } from "../api";

export default function PublicQRRedirect() {
  const { ref } = useParams<{ ref: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    async function check() {
      const res = await api().get(`/api/public/qr/${ref}`);
      if (res.data.status === "ACTIVE") {
        navigate(`/dpp/${ref}`);
      } else if (res.data.status === "RECALLED") {
        navigate(`/qr/recalled/${ref}`);
      } else if (res.data.status === "UPDATED") {
        navigate(`/dpp/${res.data.new_ref}`);
      }
    }
    check();
  }, [ref]);

  return <Spin style={{ marginTop: 100 }} />;
}
