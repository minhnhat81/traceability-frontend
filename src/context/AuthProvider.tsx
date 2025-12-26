import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useQueryClient } from "@tanstack/react-query";

export type Claims = {
  sub: string;
  exp?: number;
  roles?: string[];
};

type AuthContextType = {
  token: string | null;
  claims: Claims | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  );

  const claims = useMemo<Claims | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<Claims>(token);
    } catch {
      return null;
    }
  }, [token]);

  const isAuthenticated = !!token && !!claims;

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("access_token", newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("access_token");

    // 🔥 QUAN TRỌNG: clear toàn bộ cache
    queryClient.clear();
  };

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("access_token", token);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        claims,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
