import { NextRequest, NextResponse } from 'next/server'
import supabase from '../../supabase'

/**
 * Gera um código no formato DDMxxxx-xx-xxxxBR
 * @returns {string} Código gerado
 */
function generateDDMCode() {
  const part1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  
  return `DDM${part1}-${part2}BR`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nick } = body

    if (typeof nick !== 'string' || !nick.trim()) {
      return NextResponse.json(
        { error: 'Nickname é obrigatório' },
        { status: 400 }
      )
    }

    const { data: user, error: fetchError } = await supabase
      .from('militares')
      .select('status')
      .eq('nick', nick)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (user?.status === 'ativo') {
      return NextResponse.json(
        { error: 'already_registered' },
        { status: 400 }
      )
    }

    if (!user || user.status === 'inativo') {
      return NextResponse.json(
        { error: 'Conta Inativa ou não encontrada' },
        { status: 400 }
      )
    }

    const code = generateDDMCode()

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Erro no checkNick:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
