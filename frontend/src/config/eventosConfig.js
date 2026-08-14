export const TIPOS_EVENTO = [
  { value: 'reuniao', label: 'Reunião', icon: '🤝' },
  { value: 'treinamento', label: 'Treinamento', icon: '🎓' },
  { value: 'workshop', label: 'Workshop', icon: '🛠️' },
  { value: 'apresentacao', label: 'Apresentação', icon: '📊' },
  { value: 'outro', label: 'Outro', icon: '📌' },
];

export const FORMATOS_EVENTO = [
  { value: 'presencial', label: 'Presencial', icon: '🏢' },
  { value: 'remoto', label: 'Remoto', icon: '💻' },
];

export const STATUS_EVENTO = [
  { value: 'agendado', label: 'Agendado', badge: 'badge-info' },
  { value: 'confirmado', label: 'Confirmado', badge: 'badge-success' },
  { value: 'cancelado', label: 'Cancelado', badge: 'badge-danger' },
  { value: 'concluido', label: 'Concluído', badge: 'badge-orange' },
];

export const PUBLICOS_EVENTO = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'parceiros', label: 'Parceiros' },
  { value: 'internos', label: 'Internos' },
  { value: 'todos', label: 'Todos' },
];

const findByValue = (list, value) => list.find((item) => item.value === value);

export const getTipoEvento = (value) => findByValue(TIPOS_EVENTO, value) || TIPOS_EVENTO[TIPOS_EVENTO.length - 1];
export const getFormatoEvento = (value) => findByValue(FORMATOS_EVENTO, value);
export const getStatusEvento = (value) => findByValue(STATUS_EVENTO, value) || STATUS_EVENTO[0];
export const getPublicoEvento = (value) => findByValue(PUBLICOS_EVENTO, value);
