import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../supabase";
import { getNomePatenteById } from "../../commons/Patentes";

interface RankRequirementRequest {
  action: "promotion" | "sell";
  // Campos para promoção
  afetado?: string;
  motivo?: string;
  permissao?: string;
  email?: string;
  // Campos para venda
  nickComprador?: string;
  patenteComprada?: number;
  vendedorEmail?: string;
  vendedorTag?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RankRequirementRequest = await request.json();
    const { action } = body;

    if (action === "promotion") {
      return await handlePromotion(body);
    } else if (action === "sell") {
      return await handleSell(body);
    } else {
      return NextResponse.json(
        { error: "Ação inválida" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erro interno na API rank-requirements:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function handlePromotion(body: RankRequirementRequest) {
  const { afetado, motivo, permissao, email } = body;

  // Validar dados de entrada
  if (!afetado || !motivo || !email) {
    return NextResponse.json(
      { error: "Dados obrigatórios faltando para promoção" },
      { status: 400 }
    );
  }

  // Buscar o promotor pelos dados do email
  const { data: promotorData, error: promotorError } = await supabase
    .from("militares")
    .select("id, nick, patente, tag")
    .eq("email", email)
    .single();

  if (promotorError || !promotorData) {
    return NextResponse.json(
      { error: "Promotor não encontrado" },
      { status: 404 }
    );
  }

  // Buscar o militar a ser promovido
  const { data: afetadoData, error: afetadoError } = await supabase
    .from("militares")
    .select("id, nick, patente, ativo")
    .eq("nick", afetado)
    .single();

  if (afetadoError || !afetadoData) {
    return NextResponse.json(
      { error: "Militar não encontrado" },
      { status: 404 }
    );
  }

  if (!afetadoData.ativo) {
    return NextResponse.json(
      { error: "Militar inativo não pode ser promovido" },
      { status: 400 }
    );
  }

  // Verificar se há promoção pendente
  const { data: promocaoPendente } = await supabase
    .from("promocoes-punicoes")
    .select("id")
    .eq("afetado", afetadoData.id)
    .eq("tipo", "promocao")
    .eq("status", "aguardando")
    .maybeSingle();

  if (promocaoPendente) {
    return NextResponse.json(
      { error: "Militar já possui uma promoção pendente" },
      { status: 400 }
    );
  }

  const novaPatente = afetadoData.patente + 1;

  // Buscar nomes das patentes
  const patenteAtualNome = getNomePatenteById(afetadoData.patente);
  const novaPatenteNome = getNomePatenteById(novaPatente);

  // Registrar a promoção na tabela promocoes-punicoes
  const { error: promocaoError } = await supabase
    .from("promocoes-punicoes")
    .insert({
      promotor: promotorData.id,
      afetado: afetadoData.id,
      "nova-patente": novaPatente,
      "patente-atual": afetadoData.patente,
      tipo: "promocao",
      tag: promotorData.tag,
      motivo: motivo,
      permissao: permissao || null,
      status: "aguardando",
    });

  if (promocaoError) {
    console.error("Erro ao registrar promoção:", promocaoError);
    return NextResponse.json(
      { error: "Erro ao registrar promoção" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Promoção registrada com sucesso",
    data: {
      afetado: afetadoData.nick,
      patenteAtual: patenteAtualNome,
      novaPatente: novaPatenteNome,
      promotor: promotorData.nick,
      status: "aguardando"
    }
  });
}

async function handleSell(body: RankRequirementRequest) {
  const { nickComprador, patenteComprada, vendedorEmail, vendedorTag } = body;

  // Validar dados de entrada
  if (!nickComprador || !patenteComprada || !vendedorEmail || !vendedorTag) {
    return NextResponse.json(
      { error: "Dados obrigatórios faltando para venda" },
      { status: 400 }
    );
  }

  // Buscar o vendedor pelos dados do email
  const { data: vendedorData, error: vendedorError } = await supabase
    .from("militares")
    .select("id, nick, tag")
    .eq("email", vendedorEmail)
    .single();

  if (vendedorError || !vendedorData) {
    return NextResponse.json(
      { error: "Vendedor não encontrado" },
      { status: 404 }
    );
  }

  // Verificar se o comprador já existe
  const { data: compradorExistente, error: compradorError } = await supabase
    .from("militares")
    .select("id, nick, patente, ativo")
    .eq("nick", nickComprador)
    .single();

  let compradorId: string;
  let patenteAtual: number = 1; // Padrão para novos militares

  if (compradorExistente && !compradorError) {
    // Comprador existe
    compradorId = compradorExistente.id;
    patenteAtual = compradorExistente.patente;

    // Atualizar patente do militar existente
    const { error: updateError } = await supabase
      .from("militares")
      .update({
        patente: patenteComprada,
        ativo: true,
        contrato: true,
        "tag-promotor": vendedorTag
      })
      .eq("id", compradorId);

    if (updateError) {
      console.error("Erro ao atualizar militar:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar dados do militar" },
        { status: 500 }
      );
    }
  } else {
    // Criar novo militar
    const { data: novoMilitar, error: createError } = await supabase
      .from("militares")
      .insert({
        nick: nickComprador,
        patente: patenteComprada,
        contrato: true,
        ativo: true,
        acesso_system: false,
        "tag-promotor": vendedorTag
      })
      .select("id")
      .single();

    if (createError || !novoMilitar) {
      console.error("Erro ao criar militar:", createError);
      return NextResponse.json(
        { error: "Erro ao cadastrar novo militar" },
        { status: 500 }
      );
    }

    compradorId = novoMilitar.id;
    patenteAtual = 1; // Patente inicial para novos militares
  }

  // Registrar a venda na tabela promocoes-punicoes
  const { error: promocaoError } = await supabase
    .from("promocoes-punicoes")
    .insert({
      promotor: vendedorData.id,
      afetado: compradorId,
      "nova-patente": patenteComprada,
      "patente-atual": patenteAtual,
      tipo: "venda",
      tag: vendedorTag,
      motivo: `Venda de cargo realizada por ${vendedorData.nick}`,
      status: "aprovado" 
    });

  if (promocaoError) {
    console.error("Erro ao registrar venda:", promocaoError);
    return NextResponse.json(
      { error: "Erro ao registrar venda no histórico" },
      { status: 500 }
    );
  }

  // Obter nome da patente pela função utilitária
  const nomePatenteComprada = getNomePatenteById(patenteComprada);

  const mensagem = compradorExistente
    ? `Militar ${nickComprador} promovido para ${nomePatenteComprada}`
    : `Novo militar ${nickComprador} cadastrado com patente ${nomePatenteComprada}`;

  return NextResponse.json({
    success: true,
    message: mensagem,
    data: {
      comprador: nickComprador,
      compradorId,
      patenteAnterior: patenteAtual,
      patenteNova: patenteComprada,
      vendedor: vendedorData.nick,
      novoMilitar: !compradorExistente
    }
  });
}
