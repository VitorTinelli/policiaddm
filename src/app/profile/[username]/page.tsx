"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  Suspense,
} from "react";
import { useParams } from "next/navigation";
import { HabboProfilePicture } from "../../commons/HabboProfilePicture";
import { useAuth } from "../../commons/AuthContext";
import {
  clearOtherUsersCaches,
  isOwnProfile as checkIsOwnProfile,
} from "../../commons/cacheUtils";
import Header from "../../header/Header";
import Footer from "../../footer/Footer";

interface MilitarData {
  id: string;
  nick: string;
  patente: number;
  patente_nome?: string;
  contrato?: boolean;
  tag?: string;
  "tag-promotor"?: string;
  email?: string;
  acesso_system: string;
  ativo?: boolean;
  created_at: string;
  missaoFormatada: string;
}

interface HistoricoItem {
  id: string;
  tipo: "curso" | "promocao" | "punicao" | "tag";
  titulo: string;
  aplicador: string;
  aplicadorPatente?: string;
  aplicadorTag?: string;
  dataFormatada: string;
  icone: string;
  status?: string;
  motivo?: string;
  patenteAtual?: string;
  novaPatente?: string;
}

interface CompanhiaInfo {
  id: string;
  companhiaId: number;
  nome: string;
  sigla: string;
}

interface ProfileData {
  militar: MilitarData;
  historico: HistoricoItem[];
  companhias?: CompanhiaInfo[]; // Opcional, só para o próprio perfil
}

const ProfilesContent = memo(function ProfilesContent() {
  const params = useParams();
  const username = params?.username as string;
  const { user } = useAuth(); // Obter usuário logado
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = useMemo(() => {
    if (!user || !username) return false;

    const userNick = user.user_metadata?.nick || user.user_metadata?.nickname;
    return checkIsOwnProfile(username, userNick, user.email);
  }, [user, username]);

  const getCachedData = useCallback((key: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(`${key}_timestamp`);

    if (cached && timestamp) {
      const isValid = Date.now() - parseInt(timestamp) < 2 * 60 * 1000;
      if (isValid) {
        return JSON.parse(cached);
      }
    }
    return null;
  }, []);

  const setCachedData = useCallback(
    (key: string, data: ProfileData) => {
      if (typeof window === "undefined") {
        return;
      }

      if (isOwnProfile) {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      }
    },
    [isOwnProfile],
  );

  useEffect(() => {
    const userNick = user?.user_metadata?.nick || user?.user_metadata?.nickname;
    clearOtherUsersCaches(userNick, user?.email);
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!username) {
      setError("Username não fornecido");
      setLoading(false);
      return;
    }
    const cacheKey = `profile_${username}`;

    // Apenas tentar buscar do cache se for o próprio perfil do usuário
    if (isOwnProfile) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`[Profile] Usando cache para próprio perfil: ${username}`);
        setProfileData(cachedData);
        setLoading(false);
        return;
      }
    } else {
      console.log(
        `[Profile] Perfil de outro usuário (${username}), não usando cache`,
      );
    }
    try {
      setLoading(true);
      setError("");

      // Debug do usuário logado
      console.log(`[Profile] Debug usuário:`, {
        user: user,
        email: user?.email,
        nick: user?.user_metadata?.nick || user?.user_metadata?.nickname,
        isOwnProfile: isOwnProfile,
      });

      // Construir URL da API com parâmetro do usuário solicitante
      let apiUrl = `/api/profiles?nick=${encodeURIComponent(username)}`;
      if (user?.email) {
        apiUrl += `&requestingUserEmail=${encodeURIComponent(user.email)}`;
        console.log(`[Profile] Enviando requestingUserEmail: ${user.email}`);
      } else {
        console.log(
          `[Profile] Usuário não logado ou sem email, não enviando requestingUserEmail`,
        );
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao carregar perfil");
        return;
      }
      const data = await response.json();
      const profileData = data.data;

      if (isOwnProfile) {
        setCachedData(cacheKey, profileData);
      }

      setProfileData(profileData);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [username, getCachedData, setCachedData, isOwnProfile, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = useCallback(() => {
    const cacheKey = `profile_${username}`;
    if (isOwnProfile && typeof window !== "undefined") {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_timestamp`);
    }
    fetchProfile();
  }, [fetchProfile, username, isOwnProfile]);

  const sortedHistory = useMemo(() => {
    if (!profileData?.historico) return [];
    return [...profileData.historico].sort(
      (a, b) =>
        new Date(b.dataFormatada).getTime() -
        new Date(a.dataFormatada).getTime(),
    );
  }, [profileData?.historico]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "aprovado":
        return "✅";
      case "rejeitado":
        return "❌";
      case "aguardando":
        return "⏳";
      default:
        return "📝";
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      case "aguardando":
        return "Aguardando";
      default:
        return "Indefinido";
    }
  }, []);
  const getHistoryItemBorderColor = (tipo: string) => {
    switch (tipo) {
      case "curso":
        return "border-l-yellow-500";
      case "promocao":
        return "border-l-yellow-500";
      case "punicao":
        return "border-l-red-500";
      case "tag":
        return "border-l-yellow-500";
      default:
        return "border-l-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovado":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "rejeitado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "aguardando":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-16vh)] bg-gray-50 dark:bg-neutral-900 p-8 relative">
          <div className="flex justify-center items-center h-80 bg-white dark:bg-neutral-800 rounded-lg shadow-md mx-auto max-w-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white text-xl">
                Carregando perfil...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-16vh)] bg-gray-50 dark:bg-neutral-900 p-8 relative">
          <div className="flex flex-col justify-center items-center h-80 bg-white dark:bg-neutral-800 rounded-lg shadow-md mx-auto max-w-2xl p-8">
            <p className="mb-4 text-gray-900 dark:text-white text-xl text-center">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg transition-colors duration-200 font-bold"
            >
              Tentar novamente
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profileData) {
    return (
      <>
        <Header />
        <div className="min-h-[calc(100vh-16vh)] bg-gray-50 dark:bg-neutral-900 p-8 relative">
          <div className="flex justify-center items-center h-80 bg-white dark:bg-neutral-800 rounded-lg shadow-md mx-auto max-w-2xl">
            <p className="text-gray-900 dark:text-white text-xl">
              Perfil não encontrado
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const { militar } = profileData;
  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-16vh)] bg-gray-50 dark:bg-neutral-900 p-8 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Container esquerdo - Informações do militar */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 h-fit">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-6 border-b-2 border-gray-100 dark:border-gray-700">
              <div className="flex-shrink-0">
                <HabboProfilePicture
                  username={militar.nick}
                  size="l"
                  direction="2"
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {militar.nick}
                </h1>
                <div className="bg-gray-900 dark:bg-black text-yellow-400 px-3 py-1 rounded-md text-lg font-semibold inline-block mb-2">
                  {militar.patente_nome || "Soldado"}
                </div>
                {militar.tag && (
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded font-bold inline-block">
                    [{militar.tag}]
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Missão
              </h3>
              <div className="bg-gray-50 dark:bg-neutral-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 font-mono text-gray-900 dark:text-white break-words relative">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">{militar.missaoFormatada}</div>
                  <button
                    onClick={() => {
                      navigator.clipboard
                        .writeText(militar.missaoFormatada)
                        .then(() => {
                          const btn =
                            document.activeElement as HTMLButtonElement;
                          const originalText = btn.textContent;
                          btn.textContent = "✅";
                          btn.classList.add(
                            "bg-green-100",
                            "dark:bg-green-800",
                          );
                          setTimeout(() => {
                            btn.textContent = originalText;
                            btn.classList.remove(
                              "bg-green-100",
                              "dark:bg-green-800",
                            );
                          }, 1500);
                        });
                    }}
                    className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Copiar missão"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Status:
                </span>
                <span
                  className={`font-semibold ${
                    militar.ativo
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {militar.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Contrato:
                </span>
                <span
                  className={`font-semibold ${
                    militar.contrato
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {militar.contrato ? "Sim" : "Não"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Alistado em:
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(militar.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>{" "}
          {/* Container direito - Histórico */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 h-fit">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
              Histórico
            </h2>

            {sortedHistory.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 italic py-8">
                <p>Nenhuma atividade registrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 ${getHistoryItemBorderColor(item.tipo)}`}
                  >
                    <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-600 rounded-full shadow-md">
                      <div className="text-xl">{item.icone}</div>
                      {item.status && (
                        <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md">
                          {getStatusIcon(item.status)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="font-medium">
                          Por: {item.aplicador}
                          {item.aplicadorPatente &&
                            ` (${item.aplicadorPatente})`}
                          {item.aplicadorTag && ` [${item.aplicadorTag}]`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                          {item.dataFormatada}
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.titulo}
                      </h3>

                      {item.status && (
                        <div
                          className={`text-sm px-2 py-1 rounded mb-2 font-medium inline-block ${getStatusColor(item.status)}`}
                        >
                          {getStatusText(item.status)}
                        </div>
                      )}

                      {item.motivo && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <strong>Motivo:</strong> {item.motivo}
                        </div>
                      )}

                      {item.patenteAtual && item.novaPatente && (
                        <div className="text-sm">
                          <div className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-2 py-1 rounded font-semibold inline-block">
                            {item.patenteAtual} → {item.novaPatente}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
});

function ProfilesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-16vh)] bg-gray-50 dark:bg-neutral-900 p-8 relative">
          <div className="flex justify-center items-center h-80 bg-white dark:bg-neutral-800 rounded-lg shadow-md mx-auto max-w-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <ProfilesContent />
    </Suspense>
  );
}

export default ProfilesPage;
