export const ADDON_CATEGORIES = [
  { id: 'lideranca', label: 'Liderança' },
  { id: 'pm', label: 'PM' },
  { id: 'po', label: 'PO' },
  { id: 'ba', label: 'BA' },
  { id: 'geral', label: 'Geral' },
];

export const ADDONS = [
  {
    id: 'budget',
    name: 'Gestor de Budget',
    description:
      'Recursos, jobs description, alocação e conta corrente de despesas dos produtos Tax One, Tax One For SAP, Integrações-OBI e DF-e.',
    path: '/dashboard',
    tag: 'GB',
    status: 'Disponível',
    category: 'geral',
  },
  {
    id: 'consultorias',
    name: 'Gestão de Consultorias',
    description:
      'Cadastro de consultorias, suas entregas e o controle das agendas realizadas em cada entrega.',
    path: '/consultorias',
    tag: 'GC',
    status: 'Disponível',
    category: 'geral',
  },
  {
    id: 'cockpit-produtos',
    name: 'Cockpit Produtos',
    description:
      'Cockpit executivo da área de Produtos: apresentação, indicadores, calendário, consultorias e roadmap em um só painel.',
    path: '/cockpit-produtos',
    tag: 'CP',
    status: 'Disponível',
    category: 'lideranca',
  },
  {
    id: 'eventos',
    name: 'Gestor de Calendário e Eventos',
    description:
      'Cadastro de eventos, calendário estilo Outlook (dia/semana/mês) e principais eventos do mês.',
    path: '/eventos',
    tag: 'GE',
    status: 'Disponível',
    category: 'geral',
  },
  {
    id: 'ia-boas-praticas',
    name: 'IA - Boas Práticas',
    description:
      'Catálogo colaborativo de skills de IA: prompt, funcionalidade, benefício e como usar, compartilhado entre a equipe.',
    path: '/ia-boas-praticas',
    tag: 'IA',
    status: 'Disponível',
    category: 'geral',
  },
  {
    id: 'playbook',
    name: 'Playbook',
    description:
      'Playbook RTC (Reforma Tributária sobre o Consumo): checklist de fases e tarefas de implementação, com relatório e compartilhamento em HTML.',
    path: '/playbook',
    tag: 'PB',
    status: 'Disponível',
    category: 'geral',
  },
];
