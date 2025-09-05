"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios"; // usamos la instancia con baseURL
// ↑ recuerda que en src/lib/axios.ts está centralizada la configuración

type User = {
  id: number;
  email: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  rol: string;
  verificado: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
  }) => Promise<string>;
  confirmEmail: (token: string) => Promise<string>;
  resendConfirmation: (email: string) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (storedToken) {
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          const profileRes = await api.get<User>("/autenticacion/perfil");
          setUser(profileRes.data);
          setToken(storedToken);
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const saveAuth = (userData: User, jwt: string) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
    setToken(jwt);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>(
      "/autenticacion/login",
      { email, password }
    );
    const jwt = res.data.access_token;
    api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

    const profileRes = await api.get<User>("/autenticacion/perfil");
    saveAuth(profileRes.data, jwt);

    if (profileRes.data.rol === "admin") router.push("/admin");
    else router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
    router.push("/auth/login");
  };

  const register = async (data: {
    email: string;
    password: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
  }) => {
    const res = await api.post<{ message: string; user: User }>(
      "/autenticacion/registro",
      data
    );
    return res.data.message;
  };

  const confirmEmail = async (token: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/confirm-email",
      { token }
    );
    return res.data.message;
  };

  const resendConfirmation = async (email: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/resend-confirmation",
      { email }
    );
    return res.data.message;
  };

  const requestPasswordReset = async (email: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/request-password-reset",
      { email }
    );
    return res.data.message;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await api.post<{ message: string }>(
      "/autenticacion/reset-password",
      { token, newPassword }
    );
    return res.data.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        confirmEmail,
        resendConfirmation,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
