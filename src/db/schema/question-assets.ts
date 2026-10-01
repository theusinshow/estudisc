import { customType,integer,pgTable,text,uniqueIndex,uuid } from "drizzle-orm/pg-core";
import { questionVersions } from "./questions";
const binary=customType<{data:Buffer;driverData:Uint8Array}>({
  dataType:()=>"bytea",
  toDriver(value){return new Uint8Array(value);},
  fromDriver(value){return Buffer.from(value);}
});
export const questionAssets=pgTable("question_assets",{id:uuid("id").primaryKey(),questionVersionId:uuid("question_version_id").notNull().references(()=>questionVersions.id),contentHash:text("content_hash").notNull(),mimeType:text("mime_type").notNull(),bytes:binary("bytes").notNull(),width:integer("width").notNull(),height:integer("height").notNull(),alt:text("alt").notNull()},table=>[uniqueIndex("question_asset_identity_hash_idx").on(table.id,table.contentHash)]);
