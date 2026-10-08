import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const root='src/db/migrations', client=new PGlite();
for(const file of (await readdir(root)).filter(f=>f.endsWith('.sql')).sort())await client.exec((await readFile(`${root}/${file}`,'utf8')).replaceAll('--> statement-breakpoint',''));
// PG18 also catalogs NOT NULL constraints; PG17 records them only in pg_attribute.
// attnotnull above verifies the same invariant on both versions.
const shapeSql=`SELECT json_build_object('columns',(SELECT json_agg(json_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass($1) AND a.attnum>0 AND NOT a.attisdropped),'constraints',(SELECT json_agg(json_build_object('name',conname,'definition',pg_get_constraintdef(oid,true)) ORDER BY conname) FROM pg_constraint WHERE conrelid=to_regclass($1) AND contype<>'n'),'indexes',(SELECT json_agg(json_build_object('name',indexname,'definition',indexdef) ORDER BY indexname) FROM pg_indexes WHERE schemaname='public' AND tablename=$2)) AS shape`;
const migrations=[];
for(const [name,when,tables] of [['0019_rainy_shooting_star',1791314994132,['study_plans','study_plan_previews']],['0020_giant_grey_gargoyle',1791331567000,['lesson_resumes']]]){
 const sql=(await readFile(`${root}/${name}.sql`,'utf8')).replaceAll('\r\n','\n');const shapes={};for(const table of tables)shapes[table]=(await client.query(shapeSql,[`public.${table}`,table])).rows[0].shape;
 migrations.push({name,when,hash:createHash('sha256').update(sql).digest('hex'),sql,tables,shapes});
}
const id='evolution-user-state.0019-0020';const hash=createHash('sha256').update(JSON.stringify(migrations)).digest('hex');
await writeFile('src/db/evolution-rollout-artifact.json',JSON.stringify({id,hash,shapeSql,migrations},null,2)+'\n');await client.close();
process.stdout.write(`Pinned ${id} / three empty table additions\n`);
