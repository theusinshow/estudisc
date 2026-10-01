import { z } from "zod";
export const atomModelSchema=z.object({kind:z.literal("atom"),protons:z.number().int().min(1).max(118).default(6),neutrons:z.number().int().min(0).max(300).default(6),electrons:z.number().int().min(0).max(150).default(6)});
export function atomValues(protons:number,neutrons:number,electrons:number){return {atomicNumber:protons,massNumber:protons+neutrons,charge:protons-electrons};}
