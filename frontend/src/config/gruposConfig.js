export const TIPOS_GRUPO = [
  { value: 'tributario', label: 'Tributário', icon: '💰' },
  { value: 'piloto_governo', label: 'Piloto Governo', icon: '🏛️' },
];

const findByValue = (list, value) => list.find((item) => item.value === value);

export const getTipoGrupo = (value) => findByValue(TIPOS_GRUPO, value) || TIPOS_GRUPO[0];
