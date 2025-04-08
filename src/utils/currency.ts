// No seu arquivo currency.ts ou similar
export const formatCurrency = (value: string | number | null): string => {
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }
  
  // Se o valor já for uma string que parece com moeda, retorne-o
  if (typeof value === 'string' && value.trim().startsWith('R$')) {
    return value;
  }
  
  // Converte para número
  let numberValue: number;
  if (typeof value === 'string') {
    // Remove o símbolo de moeda e caracteres não numéricos, exceto o separador decimal
    const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    numberValue = parseFloat(cleanValue);
  } else {
    numberValue = value;
  }
  
  if (isNaN(numberValue)) {
    return 'R$ 0,00';
  }
  
  // Formata para o formato de moeda brasileira
  return `R$ ${numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const parseCurrency = (currencyStr: string | null): number => {
  if (!currencyStr) return 0;

  // Converte do formato brasileiro para um número
  const numericString = currencyStr
    .replace(/[^\d,.-]/g, '')  // Remove qualquer coisa que não seja dígito, vírgula, ponto ou traço
    .replace(',', '.');        // Substitui vírgula por ponto para o parseFloat do JS
  
  const value = parseFloat(numericString);
  return isNaN(value) ? 0 : value;
};

export const sumCurrencyValues = (values: (string | null)[]): number => {
  return values
    .filter(Boolean)
    .reduce((sum, val) => sum + parseCurrency(val), 0);
};