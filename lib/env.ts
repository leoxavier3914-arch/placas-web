export function getCompanyId(): string {
  const companyId = process.env.COMPANY_ID;
  if (!companyId) {
    throw new Error('COMPANY_ID not configured');
  }
  return companyId;
}
