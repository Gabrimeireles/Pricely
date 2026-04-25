const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDateTime(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatFreshnessLabel(value: string) {
  const current = new Date();
  const updated = new Date(value);
  const hours = Math.max(
    1,
    Math.round((current.getTime() - updated.getTime()) / (1000 * 60 * 60)),
  );

  if (hours < 24) {
    return `Atualizado há ${hours}h`;
  }

  const days = Math.round(hours / 24);
  return `Atualizado há ${days}d`;
}

