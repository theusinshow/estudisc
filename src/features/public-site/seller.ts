import { getServerEnv } from "@/lib/env";

export type SellerIdentity = Readonly<{ name: string; document: string; email: string }>;

/** Seller data for the legal pages. Null until all three variables are set, so the pages never show blanks. */
export function getSellerIdentity(env = getServerEnv()): SellerIdentity | null {
  const name = env.ESTUDISC_SELLER_NAME, document = env.ESTUDISC_SELLER_DOCUMENT, email = env.ESTUDISC_SELLER_EMAIL;
  return name && document && email ? { name, document, email } : null;
}
