"use client";

import { useState, useCallback } from "react";

interface SessionData {
  user: {
    id: string;
    email: string;
    nick?: string;
    patente?: string;
    cargo?: string;
    tag?: string;
    status?: string; // Mantém para outras referências não relacionadas ao militar
  };
  access_token: string;
}

interface SessionResponse {
  success: boolean;
  session: SessionData | null;
  error?: string;
}

export function useSessionVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifySession = useCallback(
    async (token: string): Promise<SessionData | null> => {
      if (!token) {
        setError("Token não fornecido");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data: SessionResponse = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || "Erro ao verificar sessão");
          return null;
        }

        return data.session;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro de conexão";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    verifySession,
    loading,
    error,
  };
}
