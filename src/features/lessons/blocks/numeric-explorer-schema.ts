import { z } from "zod";
export const numericExplorerSchema = z.object({ initialValue: z.number().finite().min(0).max(1000000), initialPercentage: z.number().finite().min(0).max(500) });
