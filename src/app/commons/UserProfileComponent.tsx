"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../commons/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  nick: string;
  patente: string;
  cargo?: string;
  tag?: string;
  status: string;
}

export function UserProfileComponent() {
  const { user, session, verifySessionWithAPI } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exemplo de como usar a API de verificação de sessão
  const refreshUserSession = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const isValid = await verifySessionWithAPI(session.access_token);

      if (isValid) {
        console.log("Sessão válida e atualizada");
      } else {
        setError("Sessão inválida. Faça login novamente.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao verificar sessão",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Aqui você usaria a API de sessão para garantir que o token é válido
      // antes de fazer outras chamadas
      if (session?.access_token) {
        const isValidSession = await verifySessionWithAPI(session.access_token);

        if (!isValidSession) {
          setError("Sessão expirada. Faça login novamente.");
          return;
        }
      }

      // Fazer chamada para buscar dados do perfil
      // Exemplo usando fetch direto ou através de outra API
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else {
        throw new Error("Erro ao carregar perfil");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token, verifySessionWithAPI]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  if (loading) {
    return <div className="p-4">Carregando perfil...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button
          onClick={refreshUserSession}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Perfil do Usuário</h2>

      {profile ? (
        <div className="space-y-2">
          <p>
            <strong>Nick:</strong> {profile.nick}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Patente:</strong> {profile.patente}
          </p>
          {profile.cargo && (
            <p>
              <strong>Cargo:</strong> {profile.cargo}
            </p>
          )}
          {profile.tag && (
            <p>
              <strong>Tag:</strong> {profile.tag}
            </p>
          )}
          <p>
            <strong>Status:</strong> {profile.status}
          </p>
        </div>
      ) : (
        <p>Dados do perfil não encontrados</p>
      )}

      <button
        onClick={refreshUserSession}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? "Verificando..." : "Verificar Sessão"}
      </button>
    </div>
  );
}
