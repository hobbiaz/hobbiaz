export const formatAzn = (cents: number) =>
  `${(cents / 100).toLocaleString("az-AZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₼`;
