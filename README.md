# SGD/DDM - Sistema de Gestão Departamental

Sistema de gestão para o Departamento de Desenvolvimento Militar (DDM) construído com Next.js 13+, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Next.js 15.3.3** - Framework React com App Router
- **React 19** - Biblioteca de interface de usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Framework CSS utilitário
- **Supabase** - Backend como serviço (autenticação e banco de dados)
- **React Hook Form** - Gerenciamento de formulários

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação
- Login com nickname (busca automática do email)
- Registro de novos usuários com validação
- Logout automático
- Proteção de rotas
- Gerenciamento de sessões com Supabase

### 🎨 Interface de Usuário
- Design responsivo (mobile-first)
- Tema escuro/claro automático
- Componentes reutilizáveis
- Animações e transições suaves

### 👤 Perfil de Usuário
- Integração com API do Habbo Hotel
- Exibição de avatar personalizado
- Informações de patente e cargo
- Histórico de atividades

### 🛡️ Segurança
- Row Level Security (RLS) no Supabase
- Tokens JWT gerenciados automaticamente
- Validação de dados no frontend e backend
- Políticas de acesso granulares

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone <repository-url>
cd policiaddm
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Aguarde a inicialização

#### 3.2. Configure o banco de dados
1. Acesse o SQL Editor no dashboard do Supabase
2. Execute o script `supabase-setup.sql` (incluso no projeto)

#### 3.3. Configure as variáveis de ambiente
1. Copie o arquivo `.env.example` para `.env.local`
2. Preencha com suas credenciais do Supabase:
   ```bash
   cp .env.example .env.local
   ```
3. Edite `.env.local` com suas chaves do Supabase

### 4. Execute o projeto
```bash
npm run dev
```

Acesse http://localhost:3000

## 📁 Estrutura do Projeto

```
src/app/
├── api/                    # Configurações de API
│   ├── supabase.ts        # Cliente Supabase (servidor)
│   ├── supabase-client.ts # Cliente Supabase (browser)
│   └── logout/route.ts    # Endpoint de logout
├── commons/               # Componentes e hooks compartilhados
│   ├── AuthContext.tsx    # Context de autenticação
│   ├── useRequireAuth.tsx # Hook de proteção de rotas
│   ├── HabboProfile.tsx   # Integração com Habbo API
│   └── HabboProfilePicture.tsx
├── header/               # Componente de cabeçalho
│   └── Header.tsx
├── footer/               # Componente de rodapé
│   └── Footer.tsx
├── login/                # Página de login
│   └── page.tsx
├── register/             # Página de registro
│   └── page.tsx
├── layout.tsx            # Layout principal
├── page.tsx              # Homepage
└── globals.css           # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Linting do código
```

## 🎯 Como Usar

### Registro de Usuário
1. Acesse `/register`
2. Preencha nickname único, email, senha
3. Confirme a senha
4. Clique em "Registrar"

### Login
1. Acesse `/login` 
2. Digite seu nickname (não o email)
3. Digite sua senha
4. Clique em "Entrar"

### Navegação
- Homepage mostra perfil e atividades recentes
- Header com busca e botão de logout
- Footer com informações do sistema

## 🔒 Segurança

### Autenticação
- JWT tokens gerenciados pelo Supabase
- Sessões com renovação automática
- Logout automático em caso de token expirado

### Banco de Dados
- Row Level Security habilitado
- Políticas de acesso por usuário
- Índices otimizados para performance

### Frontend
- Validação de formulários
- Sanitização de inputs
- Proteção contra XSS

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- 📱 **Mobile** (320px+)
- 📱 **Tablet** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large Desktop** (1440px+)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📋 Roadmap

### Próximas Funcionalidades
- [ ] Sistema de patentes e promoções
- [ ] Dashboard administrativo
- [ ] Sistema de notificações
- [ ] Chat em tempo real
- [ ] Módulo de treinamentos
- [ ] Relatórios e estatísticas
- [ ] API REST completa
- [ ] Aplicativo mobile (React Native)

### Melhorias Técnicas
- [ ] Testes automatizados (Jest + Testing Library)
- [ ] Storybook para componentes
- [ ] PWA (Progressive Web App)
- [ ] CI/CD com GitHub Actions
- [ ] Monitoramento e analytics
- [ ] Cache otimizado
- [ ] Internacionalização (i18n)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@ddm.com
- 💬 Discord: [Servidor DDM]
- 📱 WhatsApp: +55 (11) 99999-9999

## 🏆 Créditos

Desenvolvido pela equipe do Departamento de Desenvolvimento Militar (DDM).

---

**Status**: ✅ Em produção | **Versão**: 1.0.0 | **Última atualização**: Junho 2025
