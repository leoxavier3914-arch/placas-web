import { z } from 'zod';

export const getValidationErrorMsg = (
  parsed: z.SafeParseReturnType<any, any>
): string => {
  const invalid =
    parsed.error.errors.length === 1 &&
    parsed.error.errors[0].path.length === 0;
  return invalid
    ? 'Requisição inválida (corpo ausente ou inválido).'
    : parsed.error.errors.map((e) => e.message).join(' ');
};
