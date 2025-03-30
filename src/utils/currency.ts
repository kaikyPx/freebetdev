// Format number to Brazilian Real
export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return 'R$ 0,00';
  
  // Convert to number and handle invalid inputs
  const number = typeof value === 'string' ? 
    parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) : 
    value;

  if (isNaN(number)) return 'R$ 0,00';

  // Format the number to Brazilian Real
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(number);
}

// Parse currency string to number
export function parseCurrency(value: string | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

// Calculate sum of currency values
export function sumCurrencyValues(values: (string | null | undefined)[]): number {
  return values.reduce((sum, value) => sum + parseCurrency(value), 0);
}