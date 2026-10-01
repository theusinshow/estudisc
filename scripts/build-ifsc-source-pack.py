"""Build a private editorial source pack. Inventory is not teaching coverage or approval."""
from pathlib import Path
import hashlib,json,re,importlib.util,sys
sys.dont_write_bytecode=True
import pdfplumber
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ifsc_ingestion',ROOT/'scripts/ingest-ifsc-official.py')
ingestion=importlib.util.module_from_spec(spec);spec.loader.exec_module(ingestion)
inventory=ingestion.concepts_from_docs()
golden=json.loads((ROOT/'packs/seeds/ifsc-2027.golden.track.v2.json').read_text(encoding='utf8'))
bank=json.loads((ROOT/'.local/ifsc-official/bank.draft.json').read_text(encoding='utf8'))
edital=next((ROOT/'sources/ifsc').glob('EDITAL 05*'))
with pdfplumber.open(edital) as pdf:
    text='\n'.join('\n'.join(line for line in page.extract_text().splitlines() if line.strip()!='z' and not re.match(r'^\[\s*\d+\s*\]$',line.strip())) for page in pdf.pages[40:43])
sections=['LÍNGUA PORTUGUESA','MATEMÁTICA','GEOGRAFIA E HISTÓRIA','CIÊNCIAS']
subject_codes=['POR','MAT','GH','CIE']
# Source paragraph -> explicit approved editorial groupings, never a similarity/title readiness heuristic.
groups={
 'POR':{'1':[1,2],'2':[3,5,6,9,10],'3':[2,3,4,6,7],'4':[8]},
 'MAT':{'1':list(range(1,11)),'2':list(range(11,16)),'3':[16,17],'4':[18]},
 'GH':{'1':[1],'2':[2,3,4],'3':list(range(5,13)),'4':[13],'5':list(range(14,19))},
 'CIE':{'1':[1,2,3,4,5,6,7,8,9],'1.1':[1],'1.2':[2,3],'1.3':[4],'1.4':[5,6,7,8,9],'2':list(range(10,21)),'2.1':[10,11,12],'2.2':[13,14],'2.3':[15],'2.4':[16],'2.5':[17,18,19],'2.6':[20],'3':[21],'3.1':[21]}
}
requirements=[];source_id='src-ifsc-anexo-v-transcript-2027'
for index,(heading,subject) in enumerate(zip(sections,subject_codes)):
    start=text.index(heading)+len(heading);end=text.index(sections[index+1],start) if index<3 else len(text)
    fragment=text[start:end];markers=list(re.finditer(r'(?m)^\s*(\d+(?:\.\d+)?)\.\s*',fragment))
    for position,marker in enumerate(markers):
        number=marker[1];label=re.sub(r'\s+',' ',fragment[marker.end():markers[position+1].start() if position+1<len(markers) else len(fragment)]).strip()
        lesson_ids=[f'{subject}-{n:02d}' for n in groups[subject][number]]
        mapped=sorted(set(c['id'] for lesson_id in lesson_ids for c in inventory[lesson_id]['concepts']))
        requirement={'id':f'ANEXO-V.{subject}.{number}','subjectCode':subject,'label':label,'sourceId':source_id,'sourceLocator':{'annex':'V','section':heading,'number':number,'pages':[41] if subject in ['MAT','POR'] else [42] if subject=='GH' else [42,43],'mappingStatus':'pending_independent_review'},'mappedConceptIds':mapped}
        if '.' in number:requirement['parentId']=f'ANEXO-V.{subject}.{number.split(".")[0]}'
        requirements.append(requirement)
assert len(requirements)==27,(len(requirements),[r['id'] for r in requirements])
existing={l['id']:l for m in golden['track']['modules'] for l in m['lessons']}
golden_concepts={c['id'] for lesson in existing.values() for c in lesson['concepts']}
for module in golden['track']['modules']:
    subject=module['subjectCode']
    for lesson_id,entry in inventory.items():
        if not lesson_id.startswith(subject+'-'):continue
        if lesson_id in existing:
            lesson=existing[lesson_id];ids={c['id'] for c in lesson['concepts']}
            lesson['concepts'] += [c for c in entry['concepts'] if c['id'] not in ids]
            # Adding Concepts requires a new immutable lesson version.
            if any(c['id'] not in ids for c in entry['concepts']):lesson['version']+=1
        else:
            # Honest editorial backlog: no placeholder prose, activities or fake teaching coverage.
            lesson={'id':lesson_id,'version':1,'title':entry['title'],'kind':'core','estimatedMinutes':30,'status':'draft','concepts':[c for c in entry['concepts'] if c['id'] not in golden_concepts],'objectives':[],'sourceIds':[source_id],'prerequisiteConceptIds':[],'exitTicketQuestionIds':[],'blocks':[],'activities':[]}
            module['lessons'].append(lesson)
    module['lessons'].sort(key=lambda lesson:lesson['id'])
golden['version']=2
golden['track']['metadata'].update({'examDate':'2026-11-29T14:00:00-03:00','sourceScopeVerified':False,'editorialCoverage':'inventory_only_pending_content_and_independent_qa'})
golden['curriculumRequirements']=requirements
golden['sources'] += [{'id':source_id,'type':'official_curriculum','title':'Edital 05/DEING/2027/1 — Anexo V completo','locator':{'privateFile':edital.name,'pages':[41,42,43]},'metadata':{'sha256':hashlib.sha256(edital.read_bytes()).hexdigest(),'transcriptionStatus':'visually_checked','mappingStatus':'pending_independent_review'}}]+bank['sources']
golden['questions'] += bank['questions']
out=ROOT/'.local/ifsc-official';(out/'track.source-pack.v2.json').write_text(json.dumps(golden,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
report={'requirements':len(requirements),'unmapped':sum(not r['mappedConceptIds'] for r in requirements),'lessons':sum(len(m['lessons']) for m in golden['track']['modules']),'concepts':len(set(c['id'] for m in golden['track']['modules'] for l in m['lessons'] for c in l['concepts'])),'questions':len(golden['questions']),'complete':False,'contentGaps':[l['id'] for m in golden['track']['modules'] for l in m['lessons'] if not l['blocks'] or not l['exitTicketQuestionIds']]}
(out/'coverage.inventory.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(report))
