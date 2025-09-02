"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push("/"); // Redirige al home tras login exitoso
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6 text-text">Iniciar Sesión</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />
            <div className="mt-6 text-center text-sm text-neutral">
                ¿Olvidaste tu contraseña?{" "}
                <button
                    onClick={() => router.push("/auth/request-password-reset")}
                    className="text-secondary hover:text-secondary-light font-semibold"
                >
                    Recuperar contraseña
                </button>
            </div>
          <button
            type="submit"
            className="primary py-3 mt-2 shadow-md hover:shadow-lg transition-all"
          >
            Ingresar
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-neutral">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => router.push("/auth/registro")}
            className="text-secondary hover:text-secondary-light font-semibold"
          >
            Regístrate
          </button>
        </div>
        
      </div>
    </div>
  );
}
