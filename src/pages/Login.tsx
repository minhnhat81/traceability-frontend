import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../store/auth";
import { api } from "../api";

export default function Login() {
  const { setToken } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("LOGIN JSON VERSION 2025-01-15"); // 👈 để verify build

    try {
      const res = await api().post(
        "/auth/login",
        {
          username,
          password,
        }
      );

      if (res.data?.access_token) {
        setToken(res.data.access_token);
        window.location.href = "/";
      } else {
        setError("Sai thông tin đăng nhập");
      }
    } catch (err: any) {
      console.error("LOGIN ERROR:", err?.response?.data || err);
      setError("Không thể đăng nhập. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-center text-xl font-semibold mb-6">
          Traceability Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
}
