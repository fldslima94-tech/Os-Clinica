export const NEXTJS_PROJECT_STRUCTURE = `
clinica-estetica-saas/
├── .env.local                       # Credenciais do Supabase (URL e Anon Key)
├── next.config.mjs                  # Configurações do Next.js
├── package.json                     # Dependências (@supabase/ssr, lucide-react, tailwindcss)
├── tsconfig.json
├── tailwind.config.ts
├── app/
│   ├── layout.tsx                   # Layout global com fontes e estilos
│   ├── globals.css                  # Tailwind CSS imports
│   ├── login/
│   │   └── page.tsx                 # Autenticação de recepcionista / médico
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts             # OAuth / Magic Link callback Supabase
│   └── (dashboard)/                 # Route group com proteção de login e Sidebar
│       ├── layout.tsx               # Sidebar, Header e contexto global
│       ├── page.tsx                 # Dashboard principal (Visão do Balcão)
│       ├── agendamentos/
│       │   └── page.tsx             # Lista completa & criação de agendamentos
│       ├── pacientes/
│       │   └── page.tsx             # Lista, prontuário e histórico
│       └── estoque/
│           └── page.tsx             # Gestão de insumos e alertas
├── components/
│   ├── dashboard/
│   │   ├── stats-cards.tsx          # Contadores do dia (Confirmados, Pendentes)
│   │   ├── today-appointments.tsx   # Tabela de agendamentos de hoje
│   │   ├── stock-alerts-banner.tsx  # Alertas de itens em baixa
│   │   └── quick-actions.tsx        # Botão de Novo Agendamento
│   ├── forms/
│   │   ├── appointment-modal.tsx    # Modal de agendamento
│   │   ├── patient-modal.tsx        # Modal de cadastro de paciente
│   │   └── stock-modal.tsx          # Modal de entrada de insumo
│   ├── layout/
│   │   ├── sidebar.tsx              # Menu lateral minimalista
│   │   └── header.tsx               # Barra superior do balcão
│   └── ui/                          # Componentes reutilizáveis (Badge, Modal, Button)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # createBrowserClient (Client Components)
│   │   ├── server.ts                # createServerClient (Server Components / Actions)
│   │   └── middleware.ts            # Proteção de rotas com sessão ativa
│   └── utils.ts                     # Formatadores de moeda, telefone e data
└── types/
    └── database.ts                  # Tipagem TypeScript gerada pelo Supabase CLI
`;

export const NEXTJS_SUPABASE_CLIENT_SNIPPET = `// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
`;

export const NEXTJS_ENV_SNIPPET = `# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
`;
