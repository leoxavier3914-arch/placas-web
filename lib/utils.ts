export const normalizePlate = (s: string): string | null => {
  const plate = s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (plate.length !== 7) return null;
  const classic = /^[A-Z]{3}\d{4}$/.test(plate);
  const mercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate);
  return classic || mercosul ? plate : null;
};

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

export const logError = (context: string, error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error);
};
