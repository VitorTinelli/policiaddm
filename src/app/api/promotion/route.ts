import { NextRequest, NextResponse } from "next/server";
import supabase from "../supabase";

interface PromotionRequestBody {
  afetado: string;
  motivo: string;
  email: string;
  permissao?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PromotionRequestBody = await request.json();
    const { afetado, motivo, email, permissao } = body;

    // Validação dos campos obrigatórios
    if (
      typeof afetado !== "string" ||
      !afetado.trim() ||
      typeof motivo !== "string" ||
      !motivo.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: afetado, motivo e email" },
        { status: 400 },
      );
    }

    console.log("Dados recebidos:", { afetado, motivo, email, permissao });

    // Buscar dados do promotor com JOIN na tabela patentes
    const { data: promotorData, error: promotorError } = await supabase
      .from("militares")
      .select(
        `
        id,
        patente,
        tag,
        patentes!inner(patente)
      `,
      )
      .eq("email", email)
      .single();

    if (promotorError || !promotorData) {
      console.error("Erro ao buscar promotor:", promotorError);
      return NextResponse.json(
        { error: "Promotor não encontrado" },
        { status: 404 },
      );
    }

    const promotorId = promotorData.id;
    const promotorTag = promotorData.tag;

    // Buscar dados do militar afetado
    const { data: afetadoData, error: afetadoError } = await supabase
      .from("militares")
      .select("id, patente, email")
      .eq("nick", afetado)
      .eq("ativo", true)
      .single();

    if (afetadoError || !afetadoData) {
      console.error("Erro ao buscar militar afetado:", afetadoError);
      return NextResponse.json(
        { error: "Militar não encontrado ou inativo." },
        { status: 404 },
      );
    }

    const afetadoId = afetadoData.id;
    const patenteAtualId = afetadoData.patente;

    // Buscar o nome da patente atual
    const { data: patenteAtual, error: patenteAtualError } = await supabase
      .from("patentes")
      .select("patente")
      .eq("id", patenteAtualId)
      .single();

    if (patenteAtualError || !patenteAtual) {
      console.error("Erro ao buscar patente atual:", patenteAtualError);
      return NextResponse.json(
        { error: "Patente atual não encontrada" },
        { status: 400 },
      );
    }

    const patenteAtualNome = patenteAtual.patente;

    console.log("Patente atual ID:", patenteAtualId);
    console.log("Patente atual nome:", patenteAtualNome);

    // Buscar a próxima patente na hierarquia
    const { data: proximaPatente, error: proximaPatenteError } = await supabase
      .from("patentes")
      .select("id, patente")
      .eq("id", patenteAtualId + 1)
      .single();

    if (proximaPatenteError || !proximaPatente) {
      return NextResponse.json(
        {
          error: "O militar já está na patente máxima e não pode ser promovido",
        },
        { status: 400 },
      );
    }

    const novaPatenteId = proximaPatente.id;
    const novaPatenteNome = proximaPatente.patente;

    // Verificar se já existe promoção pendente
    const { data: existingPromotion, error: checkError } = await supabase
      .from("promocoes-punicoes")
      .select("id")
      .eq("afetado", afetadoId)
      .eq("status", "aguardando")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Erro ao verificar promoções pendentes:", checkError);
      return NextResponse.json(
        { error: "Erro ao verificar promoções existentes" },
        { status: 500 },
      );
    }

    if (existingPromotion) {
      return NextResponse.json(
        { error: "Este militar já possui uma promoção aguardando aprovação" },
        { status: 400 },
      );
    }

    // Preparar dados para inserção
    const insertData = {
      promotor: promotorId,
      afetado: afetadoId,
      "nova-patente": novaPatenteId,
      "patente-atual": patenteAtualId,
      permissao: permissao || null,
      motivo: motivo,
      tipo: "promocao",
      status: "aguardando",
      tag: promotorTag,
    };

    console.log("Dados para inserção:", insertData);

    // Inserir promoção
    const { error: insertError } = await supabase
      .from("promocoes-punicoes")
      .insert([insertData]);

    if (insertError) {
      console.error("Erro ao inserir promoção:", insertError);
      console.error("Detalhes do erro:", JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: "Erro ao processar promoção", details: insertError.message },
        { status: 500 },
      );
    }

    console.log("Promoção inserida com sucesso");

    return NextResponse.json(
      {
        success: true,
        message: "Promoção registrada com sucesso",
        data: {
          afetado: afetado,
          afetadoId: afetadoId,
          patenteAtual: patenteAtualNome,
          novaPatente: novaPatenteNome,
          tipo: "promocao",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
