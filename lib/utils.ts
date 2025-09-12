export const normalizePlate = (s: string) =>
  s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

export const logError = (context: string, error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error);
};
