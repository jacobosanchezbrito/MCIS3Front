"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email"); // 👈 lo recibimos aquí

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await api.post<{ message: string }>(
        "/autenticacion/confirm-email",
        { email, code } // 👈 mandamos email + código
      );
      setMessage(res.data.message);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al confirmar el correo");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFEAEA] to-[#FFF5F5] p-8">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-6 text-text">
          Confirmar Correo
        </h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {message && <p className="text-green-600 mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Código de confirmación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-[#B33A3A]"
          />

          <button
            type="submit"
            className="primary py-3 mt-2 shadow-md hover:shadow-lg transition-all"
          >
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
