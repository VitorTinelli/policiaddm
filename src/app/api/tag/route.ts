import { NextRequest, NextResponse } from 'next/server';
import supabase from '../supabase';

interface TagRequestBody {
  tag: string;
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TagRequestBody = await request.json();
    const { tag, token } = body;

    // Validação dos campos obrigatórios
    if (typeof tag !== 'string' || tag.length !== 3) {
      return NextResponse.json(
        { error: 'A TAG deve conter exatamente 3 letras.' },
        { status: 400 }
      );
    }
    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { error: 'Token é obrigatório.' },
        { status: 400 }
      );
    }

    // Verifica sessão e obtém o email do usuário
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
    if (sessionError || !sessionData.user) {
      return NextResponse.json(
        { error: 'Sessão inválida.' },
        { status: 401 }
      );
    }
    
    const userEmail = sessionData.user.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Usuário sem e-mail.' },
        { status: 400 }
      );
    }

    // Busca UUID do militar associada ao email da sessão
    const { data: militar, error: militarError } = await supabase
      .from('militares')
      .select('id')
      .eq('email', userEmail)
      .single();
      
    if (militarError || !militar) {
      return NextResponse.json(
        { error: 'Militar não encontrado.' },
        { status: 404 }
      );
    }

    const { data: existingTag, error: tagError } = await supabase
      .from('tags')
      .select('id, status')
      .eq('owner_id', militar.id)
      .in('status', ['aguardando', 'aprovado'])
      .maybeSingle();
      
    if (tagError) {
      return NextResponse.json(
        { error: tagError.message },
        { status: 500 }
      );
    }
    
    if (existingTag) {
      return NextResponse.json(
        { error: 'Você já possui uma TAG aguardando aprovação ou já aprovoda.' },
        { status: 400 }
      );
    }

    // Insere pedido de tag com status 'aguardando'
    const { error: insertError } = await supabase
      .from('tags')
      .insert([
        {
          owner_id: militar.id,
          asked_tag: tag,
          status: 'aguardando'
        }
      ]);
      
    if (insertError) {
      return NextResponse.json(
        { error: 'Erro ao registrar pedido de TAG.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro no requestTag:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
