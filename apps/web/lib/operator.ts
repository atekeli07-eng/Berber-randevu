/**
 * Yasal sayfaların tek kaynağı. Değerler Vercel ortam değişkenlerinden gelir.
 * Sayfalara şirket adı yazmayın; burayı kullanın.
 */
export type Operator = {
  companyName: string;
  address: string;
  contactEmail: string;
  kvkkEmail: string;
  ready: boolean;
  missing: string[];
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export function operator(): Operator {
  const companyName = clean(process.env.NEXT_PUBLIC_COMPANY_NAME);
  const address = clean(process.env.NEXT_PUBLIC_COMPANY_ADDRESS);
  const contactEmail = clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
  const kvkkEmail = clean(process.env.NEXT_PUBLIC_KVKK_EMAIL) || contactEmail;
  const missing = [
    !companyName ? "NEXT_PUBLIC_COMPANY_NAME" : "",
    !address ? "NEXT_PUBLIC_COMPANY_ADDRESS" : "",
    !contactEmail ? "NEXT_PUBLIC_CONTACT_EMAIL" : "",
    !kvkkEmail ? "NEXT_PUBLIC_KVKK_EMAIL" : "",
  ].filter(Boolean);
  return {
    companyName,
    address,
    contactEmail,
    kvkkEmail,
    ready: missing.length === 0,
    missing,
  };
}
