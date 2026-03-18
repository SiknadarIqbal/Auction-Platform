export const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) {
    return `SAR ${value}`;
  }
  return `SAR ${num.toLocaleString()}`;
};
