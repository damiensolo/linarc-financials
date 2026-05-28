import type { V3Column } from './types';

export const colAlignClass = (col: Pick<V3Column, 'align' | 'type'>) =>
  col.align === 'right' || col.type === 'currency' || col.type === 'number'
    ? 'text-right tabular-nums'
    : 'text-left';

export const formatCurrency = (value: number, fractionDigits = 2) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export const formatCurrencyWhole = (value: number) => formatCurrency(value, 0);

export const formatCellCurrency = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return `$${formatCurrency(num)}`;
};
