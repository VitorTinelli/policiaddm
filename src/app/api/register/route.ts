import { NextRequest, NextResponse } from 'next/server'
import supabase from '../supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nick, email, password } = body

    if (typeof email !== 'string' || !email.trim() || 
        typeof password !== 'string' || !password ||
        typeof nick !== 'string' || !nick.trim()) {
      return NextResponse.json(
        { error: 'Email, senha e nick são obrigatórios' },
        { status: 400 }
      )
    }

    const { error: authError } = await supabase.auth.signUp({ email, password })
    
    if (authError) {
      console.error('Erro na criação do usuário:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('militares')
      .update({ 
        email,
        status: 'ativo'
      })
      .eq('nick', nick)

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no register:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
