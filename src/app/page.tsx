'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRequireAuth } from './commons/useRequireAuth';
import { useCompanyPermissions } from './commons/useCompanyPermissions';
import { HabboProfilePicture } from './commons/HabboProfilePicture';
import Footer from './footer/Footer';
import Header from './header/Header';

interface HistoricoItem {
  id: number;
  tipo: string;
  icone: string;
  titulo: string;
  dataFormatada: string;
}

interface MilitarData {
  id: string;
  nick: string;
  patente: number;
  patente_nome?: string;
  contrato?: boolean; 
  tag?: string;
  email?: string;
  acesso_system: string;
  ativo?: boolean;
  created_at: string;
  missaoFormatada: string;
}

interface ProfileData {
  militar: MilitarData;
  historico: HistoricoItem[];
}

export default function Homepage() {
  const { user, loading: authLoading } = useRequireAuth();
  const permissions = useCompanyPermissions();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userEmail = useMemo(() => user?.email, [user?.email]);

  const fetchProfile = useCallback(async () => {
    if (!userEmail) {
      setError('Sessão inválida');
      setLoading(false);
      return;
    }

    const cacheKey = `profile_${userEmail}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
    
    if (cachedData && cacheTimestamp) {
      const isValid = Date.now() - parseInt(cacheTimestamp) < 5 * 60 * 1000;
      if (isValid) {
        setProfileData(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
    }    try {
      setLoading(true);
      setError('');

      console.log(`[Frontend] Buscando perfil para userEmail: ${userEmail}`);

      // Try to fetch by email first, then by nick if that fails
      let userResponse;
      let searchMethod = 'email';
      let finalUrl = '';
      
      // Check if userEmail looks like an email (contains @)
      if (userEmail.includes('@')) {
        finalUrl = `/api/profiles?email=${encodeURIComponent(userEmail)}&requestingUserEmail=${encodeURIComponent(userEmail)}`;
        console.log(`[Frontend] Tentando busca por email: ${finalUrl}`);
        userResponse = await fetch(finalUrl);
      } else {
        // If it doesn't look like an email, try as nick
        searchMethod = 'nick';
        finalUrl = `/api/profiles?nick=${encodeURIComponent(userEmail)}&requestingUserEmail=${encodeURIComponent(userEmail)}`;
        console.log(`[Frontend] Tentando busca por nick: ${finalUrl}`);
        userResponse = await fetch(finalUrl);
      }
      
      // If first attempt fails and we tried by email, try by nick
      if (!userResponse.ok && searchMethod === 'email') {
        console.log('[Frontend] Busca por email falhou, tentando por nick...');
        finalUrl = `/api/profiles?nick=${encodeURIComponent(userEmail)}&requestingUserEmail=${encodeURIComponent(userEmail)}`;
        userResponse = await fetch(finalUrl);
      }
      
      // If both fail or we tried by nick first and it failed, try by email
      if (!userResponse.ok && searchMethod === 'nick') {
        console.log('[Frontend] Busca por nick falhou, tentando por email...');
        finalUrl = `/api/profiles?email=${encodeURIComponent(userEmail)}&requestingUserEmail=${encodeURIComponent(userEmail)}`;
        userResponse = await fetch(finalUrl);
      }      
      if (!userResponse.ok) {
        console.log(`[Frontend] Todas as tentativas falharam. Status: ${userResponse.status}`);
        setError('Perfil não encontrado. Contate o administrador.');
        setLoading(false);
        return;
      }

      const userDataResponse = await userResponse.json();
      const userData = userDataResponse.data;

      console.log(`[Frontend] Dados recebidos:`, userData);
      console.log(`[Frontend] Companhias recebidas:`, userData.companhias);

      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify(userData));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      setProfileData(userData);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setError('Erro de conexão. Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (user && userEmail) {
      fetchProfile();
    }
  }, [fetchProfile, user, userEmail]);

  const getRecentHistory = useMemo(() => {
    if (!profileData?.historico) return [];
    return profileData.historico.slice(0, 3);
  }, [profileData?.historico]);
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-gray-900 dark:text-white text-xl">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-160px)] bg-gray-50 dark:bg-neutral-900 p-8 sm:p-4 md:p-2 lg:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-12 sm:gap-8 md:gap-8 lg:gap-12">
            {/* Welcome Section */}          <section>
            {loading ? (
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-gray-900 dark:text-white text-xl">Carregando perfil...</p>
              </div>            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg p-6 text-center text-red-700 dark:text-red-300">
                <p className="mb-2 font-semibold">{error}</p>
                <p className="text-sm">Email: {user?.email}</p>
              </div>
            ) : profileData ? (
              <div className="flex flex-col gap-8">                {/* Profile Card */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 sm:p-6 md:p-4 lg:p-8 flex flex-col md:flex-col lg:flex-row items-center gap-8 sm:gap-4 md:gap-4 lg:gap-8 relative">
                  <div className="flex-shrink-0">
                    <HabboProfilePicture username={profileData.militar.nick} size="l" direction='2' />
                  </div>
                  <div className="flex-1 text-center md:text-center lg:text-left">
                    <h2 className="text-3xl sm:text-2xl md:text-xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-white">{profileData.militar.nick}</h2>
                    <div className="text-xl sm:text-lg md:text-base lg:text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{profileData.militar.patente_nome || 'Soldado'}</div>
                    {profileData.militar.tag && (
                      <div className="inline-block bg-gray-900 dark:bg-black text-yellow-400 font-bold px-2 py-1 rounded text-base sm:text-sm md:text-xs lg:text-base mb-2">
                        [{profileData.militar.tag}]
                      </div>
                    )}
                  </div>
                  <Link 
                    href={`/profile/${profileData.militar.nick}`} 
                    className="absolute top-4 right-4 md:static md:self-center lg:absolute lg:top-4 lg:right-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-xs md:text-xs lg:text-sm mt-0 md:mt-4 lg:mt-0"
                  >
                    Ver Perfil Completo
                  </Link>
                </div>                {/* Recent Activity */}
                {getRecentHistory.length > 0 && (
                  <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 sm:p-6 md:p-4 lg:p-8">
                    <h3 className="text-2xl sm:text-xl md:text-lg lg:text-2xl font-bold mb-6 sm:mb-4 md:mb-4 lg:mb-6 text-gray-900 dark:text-white">Atividade Recente</h3>
                    <div className="flex flex-col gap-4 sm:gap-3 md:gap-3 lg:gap-4">
                      {getRecentHistory.map((item: HistoricoItem) => (
                        <div key={item.id} className={`flex items-center gap-4 sm:gap-3 md:gap-3 lg:gap-4 p-4 sm:p-3 md:p-3 lg:p-4 rounded-lg bg-gray-50 dark:bg-neutral-700 ${
                          item.tipo === 'curso' ? 'border-l-4 border-yellow-500' :
                          item.tipo === 'promocao' ? 'border-l-4 border-yellow-500' :
                          item.tipo === 'punicao' ? 'border-l-4 border-red-500' :
                          'border-l-4 border-yellow-500'
                        }`}>
                          <span className="text-2xl sm:text-xl md:text-lg lg:text-2xl">{item.icone}</span>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-white text-base sm:text-sm md:text-sm lg:text-base">{item.titulo}</div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs md:text-xs lg:text-sm">{item.dataFormatada}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </section>         
           {/* Quick Links Section */}
          <section className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8 sm:p-6 md:p-4 lg:p-8">
            <h2 className="text-3xl sm:text-2xl md:text-xl lg:text-3xl font-bold mb-8 sm:mb-6 md:mb-4 lg:mb-8 text-gray-900 dark:text-white text-center">Acesso Rápido</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-6 md:gap-4 lg:gap-8">
              {/* Requerimentos */}
              <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-6 sm:p-4 md:p-3 lg:p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-xl sm:text-lg md:text-base lg:text-xl font-bold mb-6 sm:mb-4 md:mb-3 lg:mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b-2 border-gray-200 dark:border-gray-600 pb-2">
                  📋 Requerimentos
                </h3>                <div className="flex flex-col gap-4 sm:gap-3 md:gap-3 lg:gap-4">
                  <Link href="/tags" className="group flex items-center gap-4 sm:gap-3 md:gap-3 lg:gap-4 p-4 sm:p-3 md:p-3 lg:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center text-2xl sm:text-xl md:text-lg lg:text-2xl flex-shrink-0 text-black">
                      🏷️
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white text-lg sm:text-base md:text-sm lg:text-lg mb-1">Solicitar TAG</div>
                      <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs md:text-xs lg:text-sm">Solicite uma TAG personalizada</div>
                    </div>
                  </Link>
                  <Link href="/promotion" className="group flex items-center gap-4 sm:gap-3 md:gap-3 lg:gap-4 p-4 sm:p-3 md:p-3 lg:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center text-2xl sm:text-xl md:text-lg lg:text-2xl flex-shrink-0 text-black">
                      ⭐
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white text-lg sm:text-base md:text-sm lg:text-lg mb-1">Promoções</div>
                      <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs md:text-xs lg:text-sm">Promover militares</div>
                    </div>
                  </Link>
                </div>             
               </div>

              {/* Escola de Formação Básica - Apenas para membros da EFB ou com acesso total */}
              {(permissions.isEFB || permissions.hasFullAccess) && (
                <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-6 sm:p-4 md:p-3 lg:p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-xl sm:text-lg md:text-base lg:text-xl font-bold mb-6 sm:mb-4 md:mb-3 lg:mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b-2 border-gray-200 dark:border-gray-600 pb-2">
                    🎓 Escola de Formação Básica
                    {permissions.hasFullAccess && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-normal">
                        Acesso Total
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-col gap-4 sm:gap-3 md:gap-3 lg:gap-4">
                    <Link href="/postcourse/efb" className="group flex items-center gap-4 sm:gap-3 md:gap-3 lg:gap-4 p-4 sm:p-3 md:p-3 lg:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md">
                      <div className="w-12 h-12 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center text-2xl sm:text-xl md:text-lg lg:text-2xl flex-shrink-0 text-black">
                        📚
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white text-lg sm:text-base md:text-sm lg:text-lg mb-1">Aplicar Cursos</div>
                        <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs md:text-xs lg:text-sm">Registrar cursos para militares</div>
                      </div>
                    </Link>

                    <Link href="/scripts/efb" className="group flex items-center gap-4 sm:gap-3 md:gap-3 lg:gap-4 p-4 sm:p-3 md:p-3 lg:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-yellow-400 hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md">
                      <div className="w-12 h-12 sm:w-10 sm:h-10 md:w-8 md:h-8 lg:w-12 lg:h-12 bg-yellow-400 hover:bg-yellow-500 rounded-lg flex items-center justify-center text-2xl sm:text-xl md:text-lg lg:text-2xl flex-shrink-0 text-black">
                        📃
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white text-lg sm:text-base md:text-sm lg:text-lg mb-1">Scripts</div>
                        <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-xs md:text-xs lg:text-sm">Todos os scripts da Escola de Formação Básica</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Mensagem para usuários sem acesso à EFB */}
              {!permissions.isEFB && !permissions.hasFullAccess && (
                <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-6 sm:p-4 md:p-3 lg:p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-xl sm:text-lg md:text-base lg:text-xl font-bold mb-6 sm:mb-4 md:mb-3 lg:mb-6 text-gray-900 dark:text-white flex items-center gap-2 border-b-2 border-gray-200 dark:border-gray-600 pb-2">
                    🔒 Escola de Formação Básica
                  </h3>
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      <span className="text-4xl">🚫</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Acesso restrito aos membros da EFB
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Entre em contato com a companhia para obter acesso
                    </p>
                    {permissions.userCompanies.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                          Suas companhias atuais:
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {permissions.userCompanies.map(company => (
                            <span key={company.id} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {company.sigla} - {company.nome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}