// Creates, updates or removes a code account in .env.local (ADR 0031). The code is stored only as a
// scrypt hash and never printed. Usage:
//   node scripts/create-account.mjs "Nome" 123456 [--admin] [--id account-nome]
//   node scripts/create-account.mjs --remove "Nome"
// For production, copy KNOW_OS_ACCOUNTS and AUTH_SECRET from .env.local to the hosting environment.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

// Importing the TypeScript module directly relies on Node type stripping; hide its typeless-package notice.
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) => { if (!String(warning).includes("Module type of")) emitWarning.call(process, warning, ...rest); };
const { hashAccessCode, parseCodeAccounts } = await import("../src/features/auth/code-accounts.ts");

const ENV_FILE = ".env.local";
const args = process.argv.slice(2);
const flag = (name) => { const index = args.indexOf(name); if (index === -1) return undefined; const [, value] = args.splice(index, 2); return value; };
const remove = args.includes("--remove") ? (args.splice(args.indexOf("--remove"), 1), true) : false;
const admin = args.includes("--admin") ? (args.splice(args.indexOf("--admin"), 1), true) : false;
const customId = flag("--id");
const [name, code] = args;
const fail = (message) => { console.error(message); process.exit(1); };

if (!name?.trim()) fail('Uso: node scripts/create-account.mjs "Nome" 123456 [--admin] [--id account-nome]  |  --remove "Nome"');
if (!remove && !/^\d{6}$/.test(code ?? "")) fail("O código precisa ter exatamente 6 dígitos.");

const slug = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const id = customId ?? `account-${slug}`;
if (!/^[a-z0-9-]{3,64}$/.test(id)) fail(`Id inválido: ${id}`);

const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").replace(/\r?\n$/, "").split(/\r?\n/) : [];
const valueOf = (key) => {
  const line = lines.find((entry) => entry.startsWith(`${key}=`));
  return line?.slice(key.length + 1).replace(/^'(.*)'$/, "$1");
};
const setValue = (key, value) => {
  const index = lines.findIndex((entry) => entry.startsWith(`${key}=`));
  if (index === -1) lines.push(`${key}=${value}`);
  else lines[index] = `${key}=${value}`;
};

const sameAccount = (account) => account.id === id || account.name.toLocaleLowerCase("pt-BR") === name.trim().toLocaleLowerCase("pt-BR");
const accounts = (parseCodeAccounts(valueOf("KNOW_OS_ACCOUNTS")) ?? []).filter((account) => !sameAccount(account));
if (!remove) accounts.push({ id, name: name.trim(), role: admin ? "ADMIN" : "STUDENT", code: hashAccessCode(code) });

// Single quotes keep the JSON literal in dotenv files.
setValue("KNOW_OS_ACCOUNTS", accounts.length ? `'${JSON.stringify(accounts)}'` : "");
if ((valueOf("AUTH_SECRET") ?? "").length < 32) setValue("AUTH_SECRET", randomBytes(32).toString("base64url"));
writeFileSync(ENV_FILE, `${lines.join("\n")}\n`);

console.log(remove ? `Conta "${name}" removida.` : `Conta "${name.trim()}" (${admin ? "ADMIN" : "STUDENT"}, id ${id}) salva.`);
console.log(`Contas em ${ENV_FILE}: ${accounts.map((account) => `${account.name} (${account.role})`).join(", ") || "nenhuma — login por código desativado"}.`);
console.log("Reinicie o servidor para aplicar. Em produção, copie KNOW_OS_ACCOUNTS e AUTH_SECRET para as variáveis de ambiente do host.");
