import { NextRequest, NextResponse } from 'next/server';
import supabase from '../../supabase';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'username e password são obrigatórios' },
        { status: 400 }
      );
    }   
     // Buscar o usuário pelo nickname e verificar as condições de acesso
    const { data: perfil, error: perfilError } = await supabase
      .from('militares')
      .select('email, ativo, acesso_system')
      .eq('nick', username)
      .single();

    if (perfilError || !perfil?.email) {
      console.error('Usuário não encontrado:', perfilError);
      return NextResponse.json(
        { error: 'Conta não encontrada ou nickname inválido' },
        { status: 404 }
      );
    }

    // Verificar se o usuário está ativo e tem acesso ao sistema
    if (!perfil.ativo) {
      return NextResponse.json(
        { error: 'Conta inativa. Entre em contato com o comando.' },
        { status: 403 }
      );
    }

    if (!perfil.acesso_system) {
      return NextResponse.json(
        { error: 'Acesso ao sistema não liberado. Entre em contato com o comando.' },
        { status: 403 }
      );
    }

    // Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: perfil.email,
      password,
    });

    if (authError || !authData.session) {
      console.error('Falha ao autenticar:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Falha na autenticação' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: authData.user,
      session: authData.session,
    });

  } catch (error) {
    console.error('Erro interno no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
