import { NextRequest, NextResponse } from 'next/server';
import supabase from '../supabase';

interface Militar {
  id: string;
  nick: string;
  email: string;
  patente?: string;
  cargo?: string;
  tag?: string;
  'tag-promotor'?: string;
  status?: string;
  ativo?: boolean;
  created_at?: string;
}

interface Curso {
  id: string;
  curso: string;
  militar: string;
  'dataAplicação': string;
  'horaAplicação': string;
  created_at: string;
  aplicador?: {
    nick: string;
    patente: string;
  };
}

interface PromocaoPunicao {
  id: string;
  tipo: 'promocao' | 'punicao';
  afetado: string;
  status: 'aceita' | 'rejeitada' | 'pendente';
  motivo?: string;
  'patente-atual'?: string;
  'nova-patente'?: string;
  created_at: string;
  promotor?: {
    nick: string;
    patente: string;
    tag: string;
  };
}

interface TagItem {
  id: string;
  owner_id: string;
  asked_tag: string;
  status: string;
  created_at: string;
}

interface HistoricoItem {
  id: string;
  tipo: 'curso' | 'promocao' | 'punicao' | 'tag';
  titulo: string;
  aplicador: string;
  aplicadorPatente: string;
  aplicadorTag?: string;
  data: Date;
  dataFormatada: string;
  status?: string;
  icone: string;
  motivo?: string;
  patenteAtual?: string;
  novaPatente?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nick = searchParams.get('nick');
  const email = searchParams.get('email');

  if ((!nick || typeof nick !== 'string' || !nick.trim()) && 
      (!email || typeof email !== 'string' || !email.trim())) {
    return NextResponse.json(
      { error: 'Nick ou email é obrigatório' },
      { status: 400 }
    );
  }

  try {
    let militar: Militar | null = null;
    let militarError: Error | null = null;

    if (email) {
      // Busca por email
      const result = await supabase
        .from('militares')
        .select('*')
        .eq('email', email)
        .single();
      militar = result.data as Militar;
      militarError = result.error;
    } else {
      // Busca por nick
      const result = await supabase
        .from('militares')
        .select('*')
        .eq('nick', nick)
        .single();
      militar = result.data as Militar;
      militarError = result.error;
    }

    if (militarError) {
      console.error('Erro ao buscar militar:', militarError);
      return NextResponse.json(
        { error: 'Militar não encontrado' },
        { status: 404 }
      );
    }

    if (!militar) {
      return NextResponse.json(
        { error: 'Militar não encontrado' },
        { status: 404 }
      );
    }

    // Busca cursos com join manual mais simples
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('*')
      .eq('militar', militar.id)
      .order('created_at', { ascending: false });

    if (cursosError) {
      console.error('Erro ao buscar cursos:', cursosError);
    }

    // Busca dados do aplicador separadamente se necessário
    const cursosComAplicador: Curso[] = [];
    if (cursos && cursos.length > 0) {
      for (const curso of cursos) {
        let aplicadorData = null;
        if (curso.aplicador) {
          const { data: aplicador } = await supabase
            .from('militares')
            .select('nick, patente')
            .eq('id', curso.aplicador)
            .single();
          aplicadorData = aplicador;
        }
        cursosComAplicador.push({
          ...curso,
          aplicador: aplicadorData
        } as Curso);
      }
    }

    // Busca promoções/punições
    const { data: promocoesPunicoes, error: promocoesError } = await supabase
      .from('promocoes-punicoes')
      .select('*')
      .eq('afetado', militar.id)
      .order('created_at', { ascending: false });

    if (promocoesError) {
      console.error('Erro ao buscar promoções/punições:', promocoesError);
    }

    // Busca dados do promotor separadamente
    const promocoesPunicoesComPromotor: PromocaoPunicao[] = [];
    if (promocoesPunicoes && promocoesPunicoes.length > 0) {
      for (const promocao of promocoesPunicoes) {
        let promotorData = null;
        if (promocao.promotor) {
          const { data: promotor } = await supabase
            .from('militares')
            .select('nick, patente, tag')
            .eq('id', promocao.promotor)
            .single();
          promotorData = promotor;
        }
        promocoesPunicoesComPromotor.push({
          ...promocao,
          promotor: promotorData
        } as PromocaoPunicao);
      }
    }

    // Busca tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('owner_id', militar.id)
      .order('created_at', { ascending: false });

    if (tagsError) {
      console.error('Erro ao buscar tags:', tagsError);
    }

    // Monta o histórico com tipagem adequada
    const historico: HistoricoItem[] = [];

    // Adiciona cursos ao histórico
    if (cursosComAplicador && cursosComAplicador.length > 0) {
      cursosComAplicador.forEach(curso => {
        historico.push({
          id: curso.id,
          tipo: 'curso',
          titulo: curso.curso,
          aplicador: curso.aplicador?.nick || 'Desconhecido',
          aplicadorPatente: curso.aplicador?.patente || '',
          data: new Date(`${curso['dataAplicação']}T${curso['horaAplicação']}`),
          dataFormatada: new Date(`${curso['dataAplicação']}T${curso['horaAplicação']}`).toLocaleString('pt-BR'),
          icone: '📚'
        });
      });
    }

    // Adiciona promoções/punições ao histórico
    if (promocoesPunicoesComPromotor && promocoesPunicoesComPromotor.length > 0) {      
      promocoesPunicoesComPromotor.forEach(promocao => {        
        let icone = '⭐';
        let titulo = '';
        
        if (promocao.tipo === 'promocao') {
          icone = promocao.status === 'aceita' ? '⭐' : promocao.status === 'rejeitada' ? '❌' : '⏳';
          titulo = `Promoção para ${promocao['nova-patente'] || 'Nova patente'}`;
        } else {
          icone = promocao.status === 'aceita' ? '⚠️' : promocao.status === 'rejeitada' ? '❌' : '⏳';
          titulo = `Punição: ${promocao.motivo || 'Motivo não especificado'}`;
        }

        historico.push({
          id: promocao.id,
          tipo: promocao.tipo,
          titulo: titulo,
          aplicador: promocao.promotor?.nick || 'Desconhecido',
          aplicadorPatente: promocao.promotor?.patente || '',
          aplicadorTag: promocao.promotor?.tag || '',
          data: new Date(promocao.created_at),
          dataFormatada: new Date(promocao.created_at).toLocaleString('pt-BR'),
          status: promocao.status,
          icone: icone,          
          motivo: promocao.motivo,
          patenteAtual: promocao['patente-atual'],
          novaPatente: promocao['nova-patente']
        });
      });
    }

    // Adiciona tags ao histórico
    if (tags && tags.length > 0) {
      (tags as TagItem[]).forEach(tag => {
        const icone = '🏷️';

        historico.push({
          id: tag.id,
          tipo: 'tag',
          titulo: `Criação de TAG: [${tag.asked_tag}]`,
          aplicador: 'Sistema',
          aplicadorPatente: '',
          data: new Date(tag.created_at),
          dataFormatada: new Date(tag.created_at).toLocaleString('pt-BR'),
          status: tag.status,
          icone: icone
        });
      });
    }

    // Ordena o histórico por data decrescente
    historico.sort((a, b) => b.data.getTime() - a.data.getTime());    
    
    // Formata a missão
    const missao = `[DCC] ${militar.patente || 'Soldado'}${militar.cargo ? `/${militar.cargo}` : ''} [${militar['tag-promotor'] || militar.tag || 'DDM'}]`;

    return NextResponse.json({
      success: true,
      data: {
        militar: {
          ...militar,
          missaoFormatada: missao
        },
        historico
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
