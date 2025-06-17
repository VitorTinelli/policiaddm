import { NextRequest, NextResponse } from "next/server";
import supabase from "../supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nick, email, password } = body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      typeof nick !== "string" ||
      !nick.trim()
    ) {
      return NextResponse.json(
        { error: "Email, senha e nick são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar se o militar existe e está elegível para registro
    const { data: militar, error: militarError } = await supabase
      .from("militares")
      .select("id, nick, ativo, acesso_system")
      .eq("nick", nick)
      .single();

    if (militarError || !militar) {
      return NextResponse.json(
        { error: "Militar não encontrado no sistema" },
        { status: 404 },
      );
    }

    if (!militar.ativo) {
      return NextResponse.json(
        { error: "Militar inativo. Entre em contato com um superior." },
        { status: 403 },
      );
    }

    if (militar.acesso_system) {
      return NextResponse.json(
        { error: "Militar já possui acesso ao sistema." },
        { status: 409 },
      );
    }

    // Criar usuário no Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Erro na criação do usuário:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Atualizar militar: adicionar email e liberar acesso ao sistema
    const { error: updateError } = await supabase
      .from("militares")
      .update({
        email,
        acesso_system: true,
      })
      .eq("nick", nick);

    if (updateError) {
      console.error("Erro ao atualizar perfil:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Conta criada com sucesso! Acesso ao sistema liberado.",
    });
  } catch (error) {
    console.error("Erro no register:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
