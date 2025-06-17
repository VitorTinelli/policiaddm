import { NextRequest, NextResponse } from 'next/server';
import supabase from '../supabase';

interface Militar {
  id: string;
  nick: string;
  email: string;
  patente?: number; 
  patente_nome?: string; 
  contrato?: boolean; 
  tag?: string;
  'tag-promotor'?: string;
  acesso_system?: boolean; 
  ativo?: boolean;
  created_at?: string;
}

interface Curso {
  id: string;
  curso: number;
  curso_nome?: string; 
  curso_sigla?: string; 
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
  status: 'aprovado' | 'aguardando' | 'rejeitado';
  motivo?: string;
  'patente-atual'?: string | number;
  'nova-patente'?: string | number;
  'patente-atual-nome'?: string;
  'nova-patente-nome'?: string;
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

interface CompanhiaInfo {
  id: string;
  companhiaId: number;
  nome: string;
  sigla: string;
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

// Função para verificar se o militar faz parte de uma companhia
async function handleCompanyCheck(email: string | null, companyId: string | null) {
  if (!email) {
    return NextResponse.json(
      { error: 'Email é obrigatório para verificar companhia' },
      { status: 400 }
    );
  }

  try {
    // Primeiro, buscar o militar pelo email
    const { data: militar, error: militarError } = await supabase
      .from('militares')
      .select('id')
      .eq('email', email)
      .single();

    if (militarError || !militar) {
      return NextResponse.json(
        { error: 'Militar não encontrado' },
        { status: 404 }
      );
    }

    // Se companyId for fornecido, verifica se o militar faz parte dessa companhia específica
    if (companyId) {
      const { data, error } = await supabase
        .from('militares-companhia')
        .select('*')
        .eq('militarfk', militar.id)
        .eq('companhiafk', companyId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao verificar militar na companhia:', error);
        return NextResponse.json(
          { error: 'Erro interno do servidor' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        isMember: !!data,
        relationship: data
      });
    }

    // Se companyId não for fornecido, retorna todas as companhias do militar
    const { data, error } = await supabase
      .from('militares-companhia')
      .select(`
        *,
        companhias (
          id,
          nome,
          sigla
        )
      `)
      .eq('militarfk', militar.id);

    if (error) {
      console.error('Erro ao buscar companhias do militar:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      companies: data || []
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nick = searchParams.get('nick');
  const email = searchParams.get('email');
  const checkCompany = searchParams.get('checkCompany'); // Novo parâmetro para verificar companhia
  const companyId = searchParams.get('companyId'); // ID da companhia para verificar
  const requestingUserEmail = searchParams.get('requestingUserEmail'); // Email do usuário que está fazendo a solicitação

  // Se for apenas para verificar companhia
  if (checkCompany === 'true') {
    return await handleCompanyCheck(email, companyId);
  }

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
      // Busca por email com JOIN na tabela patentes
      const result = await supabase
        .from('militares')
        .select(`
          *,
          patentes!inner(patente)
        `)
        .eq('email', email)
        .single();
      
      if (result.data) {
        militar = {
          ...result.data,
          patente_nome: result.data.patentes?.patente
        } as Militar;
      }
      militarError = result.error;
    } else {
      // Busca por nick com JOIN na tabela patentes
      const result = await supabase
        .from('militares')
        .select(`
          *,
          patentes!inner(patente)
        `)
        .eq('nick', nick)
        .single();
      
      if (result.data) {
        militar = {
          ...result.data,
          patente_nome: result.data.patentes?.patente
        } as Militar;
      }
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

    // Busca cursos (sem JOIN devido ao hífen no nome da tabela)
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('*')
      .eq('militar', militar.id)
      .order('created_at', { ascending: false });

    if (cursosError) {
      console.error('Erro ao buscar cursos:', cursosError);
    }

    // Busca dados do aplicador e curso separadamente
    const cursosComDetalhes: Curso[] = [];
    if (cursos && cursos.length > 0) {
      for (const curso of cursos) {
        let aplicadorData = null;
        let cursoInfo = null;

        // Buscar dados do aplicador
        if (curso.aplicador) {
          const { data: aplicador } = await supabase
            .from('militares')
            .select(`
              nick,
              patente,
              patentes!inner(patente)
            `)
            .eq('id', curso.aplicador)
            .single();
          
          if (aplicador) {
            aplicadorData = {
              nick: aplicador.nick,
              patente: aplicador.patentes?.[0]?.patente || ''
            };
          }
        }

        // Buscar informações do curso
        if (curso.curso) {
          const { data: cursoDetalhes } = await supabase
            .from('cursos-companhias')
            .select('sigla, nome')
            .eq('id', curso.curso)
            .single();
          
          if (cursoDetalhes) {
            cursoInfo = cursoDetalhes;
          }
        }

        cursosComDetalhes.push({
          ...curso,
          aplicador: aplicadorData,
          curso_nome: cursoInfo?.nome || `Curso ${curso.curso}`,
          curso_sigla: cursoInfo?.sigla || 'N/A'
        } as Curso);
      }
    }

    // Busca promoções/punições
    const { data: promocoesPunicoes, error: promocoesError } = await supabase
      .from('promocoes-punicoes')
      .select('*')
      .eq('afetado', militar.id)
      .order('created_at', { ascending: false });

    console.log('Promoções encontradas para', militar.nick, ':', promocoesPunicoes);

    if (promocoesError) {
      console.error('Erro ao buscar promoções/punições:', promocoesError);
    }

    // Busca dados do promotor separadamente
    const promocoesPunicoesComPromotor: PromocaoPunicao[] = [];
    if (promocoesPunicoes && promocoesPunicoes.length > 0) {
      for (const promocao of promocoesPunicoes) {
        let promotorData = null;
        let patenteAtualNome = null;
        let novaPatenteNome = null;

        // Busca dados do promotor
        if (promocao.promotor) {
          const { data: promotor } = await supabase
            .from('militares')
            .select(`
              nick,
              patente,
              tag,
              patentes!inner(patente)
            `)
            .eq('id', promocao.promotor)
            .single();
          
          if (promotor) {
            promotorData = {
              nick: promotor.nick,
              patente: promotor.patentes?.[0]?.patente || '',
              tag: promotor.tag
            };
          }
        }

        // Busca nome da patente atual
        if (promocao['patente-atual']) {
          const { data: patenteAtual } = await supabase
            .from('patentes')
            .select('patente')
            .eq('id', promocao['patente-atual'])
            .single();
          patenteAtualNome = patenteAtual?.patente;
        }

        // Busca nome da nova patente
        if (promocao['nova-patente']) {
          const { data: novaPatente } = await supabase
            .from('patentes')
            .select('patente')
            .eq('id', promocao['nova-patente'])
            .single();
          novaPatenteNome = novaPatente?.patente;
        }

        promocoesPunicoesComPromotor.push({
          ...promocao,
          promotor: promotorData,
          'patente-atual-nome': patenteAtualNome,
          'nova-patente-nome': novaPatenteNome
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
    if (cursosComDetalhes && cursosComDetalhes.length > 0) {
      cursosComDetalhes.forEach(curso => {
        historico.push({
          id: curso.id,
          tipo: 'curso',
          titulo: curso.curso_nome || `Curso ${curso.curso}`,
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
        const icone = promocao.tipo === 'promocao' ? '⭐' : '⚠️';
        let titulo = '';
        
        if (promocao.tipo === 'promocao') {
          titulo = `Promoção para ${promocao['nova-patente-nome'] || 'Nova patente'}`;
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
          patenteAtual: promocao['patente-atual-nome'],
          novaPatente: promocao['nova-patente-nome']
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
    }    // Ordena o histórico por data decrescente
    historico.sort((a, b) => b.data.getTime() - a.data.getTime());    
    const missao = `[DDM] ${militar.patente_nome || 'Soldado'} [${militar['tag-promotor'] || militar.tag || 'DDM'}]`;    // Verificar se é o próprio usuário ou não para filtrar dados sensíveis
    // Para casos onde o email do auth pode ser diferente do email cadastrado,
    // vamos buscar se existe um militar com o requestingUserEmail
    let isOwnProfile = false;
    
    if (requestingUserEmail) {
      // Verificação básica
      isOwnProfile = militar.email === requestingUserEmail || 
                    militar.nick === requestingUserEmail;
      
      // Se não deu match e requestingUserEmail parece ser um email,
      // vamos verificar se existe um militar com esse email que seja o mesmo usuário
      if (!isOwnProfile && requestingUserEmail.includes('@')) {
        try {
          const { data: militarByEmail } = await supabase
            .from('militares')
            .select('id, nick')
            .eq('email', requestingUserEmail)
            .single();
          
          if (militarByEmail && militarByEmail.id === militar.id) {
            isOwnProfile = true;
            console.log(`[API] Match encontrado por email alternativo: ${requestingUserEmail} -> ${militar.nick}`);
          }
        } catch (err) {
          // Ignore errors, não é crítico
        }
      }
    }

    console.log(`[API] Verificação de próprio perfil: requestingUserEmail=${requestingUserEmail}, militar.email=${militar.email}, militar.nick=${militar.nick}, isOwnProfile=${isOwnProfile}`);// Buscar informações de companhia se for o próprio perfil
    let companhias: CompanhiaInfo[] = [];
    if (isOwnProfile) {
      try {
        const { data: companhiasData, error: companhiasError } = await supabase
          .from('militares-companhia')
          .select(`
            id,
            companhiafk,
            companhias!inner(
              id,
              nome,
              sigla
            )
          `)
          .eq('militarfk', militar.id);        if (!companhiasError && companhiasData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          companhias = companhiasData.map((rel: any) => ({
            id: rel.id,
            companhiaId: rel.companhiafk,
            nome: rel.companhias?.nome || 'Nome não encontrado',
            sigla: rel.companhias?.sigla || 'Sigla não encontrada'
          }));
          console.log(`[API] Companhias carregadas para próprio perfil ${militar.nick}: ${companhias.length}`);
        } else {
          console.error('[API] Erro ao buscar companhias:', companhiasError);
        }
      } catch (error) {
        console.error('[API] Erro ao buscar informações de companhia:', error);
      }
    }

    // Filtrar dados sensíveis se não for o próprio perfil
    const filteredMilitar = isOwnProfile ? militar : {
      ...militar,
      email: undefined, 
    };    console.log(`[API] Perfil ${isOwnProfile ? 'próprio' : 'de outro usuário'} solicitado: ${militar.nick}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData: any = {
      militar: {
        ...filteredMilitar,
        missaoFormatada: missao
      },
      historico
    };

    // Adicionar companhias se for o próprio perfil
    if (isOwnProfile && companhias.length > 0) {
      responseData.companhias = companhias;
    }

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
