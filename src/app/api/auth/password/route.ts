import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {  try {
    const { action, email, password, accessToken, refreshToken, token, type } = await request.json();

    if (action === 'forgot') {
      return await handleForgotPassword(email);
    } else if (action === 'reset') {
      return await handleResetPassword(password, accessToken, refreshToken, token, type);
    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para lidar com solicitação de recuperação de senha
async function handleForgotPassword(email: string) {
  if (!email) {
    return NextResponse.json(
      { error: 'Email é obrigatório' },
      { status: 400 }
    );
  }

  // Validar formato do email
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Email inválido' },
      { status: 400 }
    );
  }

  // Verificar se o email existe no banco de dados
  const { data: existingUser, error: userError } = await supabase
    .from('militares')
    .select('email')
    .eq('email', email)
    .single();

  if (userError || !existingUser) {
    // Por segurança, retornamos sucesso mesmo se o email não existir
    // Isso evita que pessoas mal-intencionadas descubram emails válidos
    return NextResponse.json(
      { message: 'Se o email estiver cadastrado, você receberá um link de recuperação.' },
      { status: 200 }
    );
  }

  // Enviar email de recuperação usando Supabase Auth
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://policiaddm.com.br/reset-password',
  });

  if (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email de recuperação. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Link de recuperação enviado com sucesso!' },
    { status: 200 }
  );
}

// Função para lidar com redefinição de senha
async function handleResetPassword(password: string, accessToken?: string, refreshToken?: string, token?: string, type?: string) {
  // Validar senha
  if (!password) {
    return NextResponse.json(
      { error: 'Senha é obrigatória' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'A senha deve ter pelo menos 6 caracteres' },
      { status: 400 }
    );
  }

  try {
    // Método 1: Se temos access_token e refresh_token (método tradicional)
    if (accessToken && refreshToken) {
      const userSupabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: sessionError } = await userSupabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !user) {
        console.error('Erro ao definir sessão:', sessionError);
        return NextResponse.json(
          { error: 'Token de recuperação inválido ou expirado' },
          { status: 400 }
        );
      }

      // Atualizar a senha
      const { error: updateError } = await userSupabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar senha. Tente novamente.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Senha alterada com sucesso!' },
        { status: 200 }
      );
    }
      // Método 2: Se temos um token de recovery (método recomendado pela documentação)
    if (token && type === 'recovery') {
      const userSupabase = createClient(supabaseUrl, supabaseKey);
      
      // Trocar o código pelo session usando o token de recovery
      const { data, error: exchangeError } = await userSupabase.auth.exchangeCodeForSession(token);
      
      if (exchangeError || !data.session || !data.user) {
        console.error('Erro ao trocar código por sessão:', exchangeError);
        return NextResponse.json(
          { error: 'Token de recuperação inválido ou expirado' },
          { status: 400 }
        );
      }

      // Definir a sessão obtida
      const { error: sessionError } = await userSupabase.auth.setSession(data.session);
      
      if (sessionError) {
        console.error('Erro ao definir sessão:', sessionError);
        return NextResponse.json(
          { error: 'Erro ao processar token de recuperação' },
          { status: 400 }
        );
      }

      // Atualizar a senha do usuário
      const { error: updateError } = await userSupabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        return NextResponse.json(
          { error: 'Erro ao atualizar senha. Tente novamente.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Senha alterada com sucesso!' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Token de recuperação não encontrado' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao processar redefinição de senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
