"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
axios.defaults.baseURL = "http://localhost:3001";
interface User {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  verificado: boolean;
}

interface LoginResponse {
  access_token: string;
}

interface ProfileResponse {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  verificado: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Cargar user/token del localStorage al iniciar
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const saveAuth = (userData: User, jwt: string) => {
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/auth/login");
  };

  // ----------------- Funciones de Auth -----------------

  const login = async (email: string, password: string) => {
    const res = await axios.post<LoginResponse>("/autenticacion/login", { email, password });
    const jwt = res.data.access_token;

    const profileRes = await axios.get<ProfileResponse>("/autenticacion/perfil", {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    saveAuth(profileRes.data, jwt);

    if (profileRes.data.rol === "admin") router.push("/admin");
    else router.push("/");
  };

  const register = async (data: any) => {
    await axios.post("/autenticacion/registro", data);
  };

  const confirmEmail = async (token: string) => {
    await axios.post("/autenticacion/confirm-email", { token });
  };

  const resendConfirmation = async (email: string) => {
    await axios.post("/autenticacion/resend-confirmation", { email });
  };

  const requestPasswordReset = async (email: string) => {
    await axios.post("/autenticacion/request-password-reset", { email });
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await axios.post("/autenticacion/reset-password", { token, newPassword });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, confirmEmail, resendConfirmation, requestPasswordReset, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
