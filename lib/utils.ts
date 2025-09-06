export const normalizePlate = (s: string) =>
  s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

export const onlyDigits = (s: string) => s.replace(/\D/g, '');
