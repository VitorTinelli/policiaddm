"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import supabase from "../api/supabase";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    nickname: string,
  ) => Promise<{ error?: string }>;
  verifySessionWithAPI: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Função para verificar sessão usando a API
  const verifySessionWithAPI = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success && data.session) {
          // Criar sessão compatível com os dados da API
          const apiSession: Session = {
            access_token: data.session.access_token,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: "",
            user: data.session.user as User,
          };

          setSession(apiSession);
          setUser(data.session.user as User);
          return true;
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
      return false;
    },
    [],
  );
  useEffect(() => {
    const getInitialSession = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        setUser(session?.user ?? null);
      } else {
        const storedToken = localStorage.getItem("access_token");
        if (storedToken) {
          const isValid = await verifySessionWithAPI(storedToken);
          if (!isValid) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("session");
          }
        }
      }

      setLoading(false);
    };
    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("session");
          }
          router.push("/login");
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, verifySessionWithAPI]);
  const signIn = async (
    username: string,
    password: string,
  ): Promise<{ error?: string }> => {
    try {
      const { data: perfil, error: perfilError } = await supabase
        .from("militares")
        .select("email")
        .eq("nick", username)
        .single();

      if (perfilError || !perfil?.email) {
        return { error: "Usuário não encontrado" };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch {
      return { error: "Erro interno do servidor" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    nickname: string,
  ): Promise<{ error?: string }> => {
    try {
      // Verificar se o nickname já existe
      const { data: existingUser } = await supabase
        .from("militares")
        .select("nick")
        .eq("nick", nickname)
        .single();

      if (existingUser) {
        return { error: "Nickname já está em uso" };
      }

      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Se o usuário foi criado, adicionar na tabela militares
      if (data.user) {
        const { error: insertError } = await supabase.from("militares").insert([
          {
            id: data.user.id,
            email: email,
            nick: nickname,
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error("Erro ao criar perfil:", insertError);
          return { error: "Erro ao criar perfil do usuário" };
        }
      }

      return {};
    } catch {
      return { error: "Erro interno do servidor" };
    }
  };

  const signOut = async () => {
    try {
      // Limpar estados primeiro
      setUser(null);
      setSession(null);
      
      // Limpar localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("session");
      
      // Limpar cache de perfis
      const profileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith("profile_")
      );
      profileKeys.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      });
      
      // Fazer logout no Supabase
      await supabase.auth.signOut();
      
      console.log("[AUTH] Logout realizado com sucesso");
    } catch (error) {
      console.error("[AUTH] Erro durante logout:", error);
      // Mesmo com erro, limpar estados locais
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
        signIn,
        signUp,
        verifySessionWithAPI,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
