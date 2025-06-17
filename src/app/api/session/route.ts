import { NextRequest, NextResponse } from "next/server";
import supabase from "../supabase";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Token é obrigatório",
        },
        { status: 400 },
      );
    }

    // Verificar sessão usando o token fornecido
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Erro ao verificar sessão:", error);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ao verificar sessão: ${error.message}`,
          session: null,
        },
        { status: 401 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
          session: null,
        },
        { status: 401 },
      );
    }

    // Buscar dados adicionais do usuário na tabela militares
    const { data: militarData, error: militarError } = await supabase
      .from("militares")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (militarError) {
      console.warn("Dados do militar não encontrados:", militarError);
    }

    return NextResponse.json({
      success: true,
      session: {
        user: {
          ...data.user,
          // Adicionar dados do militar se disponíveis
          ...(militarData && {
            nick: militarData.nick,
            patente: militarData.patente,
            cargo: militarData.cargo,
            tag: militarData.tag,
            status: militarData.status,
          }),
        },
        access_token: token,
      },
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json(
      {
        success: false,
        error: `Erro inesperado: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
        session: null,
      },
      { status: 500 },
    );
  }
}
