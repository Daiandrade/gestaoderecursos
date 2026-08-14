export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addWeeks(date, amount) {
  return addDays(date, amount * 7);
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Matriz de 42 dias (6 semanas x 7 dias) cobrindo o mês, incluindo dias de
// meses vizinhos para completar as semanas. gridStart/gridEnd (exclusivo)
// delimitam a janela usada na busca de eventos exibidos.
export function getMonthMatrix(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const rows = [];
  for (let i = 0; i < 6; i++) rows.push(days.slice(i * 7, i * 7 + 7));
  return { days, rows, gridStart, gridEnd: addDays(gridStart, 42) };
}

export function getWeekDates(date) {
  const weekStart = addDays(date, -date.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getHoursRange(startHour = 7, endHour = 20) {
  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  return hours;
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function formatMonthYear(date) {
  return capitalize(date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
}

export function formatDayLabel(date) {
  return capitalize(
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  );
}

export function formatWeekRangeLabel(weekDates) {
  const start = weekDates[0];
  const end = weekDates[weekDates.length - 1];
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `Semana de ${fmt(start)} a ${fmt(end)}`;
}
