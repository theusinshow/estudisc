"""Preserve user-supplied Integrated exams in a private draft bank. Never publish OCR output."""
from pathlib import Path
import argparse, hashlib, json, re, subprocess, unicodedata, uuid
import pdfplumber
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'sources/ifsc/historical'
OUTPUT=ROOT/'.local/ifsc-official'
NAMESPACE=uuid.UUID('145c1956-287d-5172-b121-b1b2b7e6bc61')
HEADER=re.compile(r'^(MINIST[ÉE]RIO|INSTITUTO FEDERAL|PR[ÓO]-REITORIA|DEPARTAMENTO DE INGRESSO|Exame de Classifica|\d{1,2}$)')
def normalized(text):return ''.join(c for c in unicodedata.normalize('NFD',text.upper()) if unicodedata.category(c)!='Mn')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def clean(text):return '\n'.join(line for line in text.splitlines() if not HEADER.match(line.strip())).strip()
def ocr_text(data):
    # WinRT returns blocks in reading order, which can split Roman numerals/choice labels.
    # Recompose nearby lines by their vertical midpoint and left edge; originals remain the authority.
    lines=[]
    for line in data['lines']:
        words=line['words']
        if not words:continue
        lines.append((min(word['y'] for word in words),min(word['x'] for word in words),line['text']))
    rows=[]
    for y,x,text in sorted(lines):
        if rows and abs(rows[-1][0]-y)<9:rows[-1][1].append((x,text))
        else:rows.append([y,[(x,text)]])
    return '\n'.join(' '.join(text for x,text in sorted(row)) for y,row in rows)
def concepts_from_docs():
    result={}
    for file in (ROOT/'docs/ifsc/curriculum').glob('*.md'):
        lesson=None
        for line in file.read_text(encoding='utf-8').splitlines():
            heading=re.match(r'##\s+((?:MAT|POR|CIE|GH)-\d+)\s+[—–-]\s+(.+)',line)
            if heading:lesson=heading.groups();result[lesson[0]]={'title':lesson[1],'concepts':[]}
            concept=re.match(r'- `([^`]+)`(?:\s+[—–-]\s+(.+))?',line)
            if concept and lesson:result[lesson[0]]['concepts'].append({'id':concept[1],'title':(concept[2] or concept[1]).rstrip('.'),'importance':'high'})
    return result
def proposed_concepts(subject,stem,known):
    words=normalized(stem)
    rules={
      'POR':[(r'INFER|CONCLUI|AFIRMAC|COM BASE','POR.READ.INFER'),(r'VERBO|VERBAL','POR.GRAM.VERB'),(r'PRONOME','POR.GRAM.PRONOUN'),(r'FIGURA|METAFOR','POR.SEM.FIGURES'),(r'COES|CONJUN|CONECT','POR.TEXT.COHESION')],
      'MAT':[(r'%|PORCENT|PERCENT','MAT.PCT.INTERPRET'),(r'JUROS','MAT.INTEREST.SIMPLE'),(r'PROBABIL','MAT.PROB.BASIC'),(r'EQUAC|RAIZ|FUNC','MAT.EQ2.SOLVE'),(r'VOLUME|CILINDR|CUBO','MAT.VOLUME.CONTEXT'),(r'AREA|PERIMETR|TRIANG','MAT.GEO.AREA'),(r'DISTANC|QUILOMETR|KM','MAT.NUM.OPERATIONS'),(r'MEDIA|GRAFICO|TABELA','MAT.DATA.INTERPRET'),(r'FRAC|DENOMIN','MAT.FRACTION.CONTEXT')],
      'CIE':[(r'ATOM|PROTON|ELETRON|PERIODICA','CIE.ATOM.STRUCTURE'),(r'ENERG|ELETRIC|WATT','CIE.ELEC.ENERGY_CONSUMPTION'),(r'GENET|MENDEL|HEREDIT','CIE.GEN.MENDEL'),(r'EVOLUC|DARWIN','CIE.EVOL.DARWIN'),(r'CELUL|MITOSE|DNA','CIE.CELL.STRUCTURE'),(r'VACIN|DOENC|VIRUS','CIE.HEALTH.VACCINES'),(r'ECO|AMBIENT|POLUIC','CIE.ECO.SUSTAINABILITY')],
      'GH':[(r'ESCRAV|ABOLI|QUILOMB','GH.BR.ABOLITION.PROCESS'),(r'CONTESTADO','GH.SC.CONTESTADO.CONTEXT'),(r'VARGAS','GH.BR.VARGAS'),(r'GUERRA|IMPERIAL|TOTALIT','GH.WORLD.WAR'),(r'CATARIN','GH.SC.REGIONS'),(r'GLOBAL|CAPITALIS','GH.GLOBAL.CAPITALISM'),(r'COLONI|INDIGENA','GH.BR.COLONIZATION')]
    }
    for pattern,concept in rules[subject]:
        if re.search(pattern,words) and concept in known:return concept
    # A conservative broad anchor is proposed, never treated as an independently approved classification.
    defaults={'POR':'POR.READ.EXPLICIT','MAT':'MAT.NUM.OPERATIONS','CIE':'CIE.MATTER.GENERAL_PROPERTIES','GH':'GH.HIST.SOURCE'}
    return defaults[subject] if defaults[subject] in known else sorted(id for id in known if id.startswith(subject+'.'))[0]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--render',action='store_true');args=parser.parse_args();OUTPUT.mkdir(parents=True,exist_ok=True)
    curriculum=concepts_from_docs();known={concept['id'] for lesson in curriculum.values() for concept in lesson['concepts']}
    bank=[];sources=[];assets=[];issues=[];summaries=[]
    for edition in ['2025.1','2025.2','2026.1','2026.2']:
        exam=next(p for p in SOURCE.glob('*.pdf') if edition.replace('.','-') in p.name and 'INT PROVA' in p.name)
        key=next(p for p in SOURCE.glob('INTEGRADO*.pdf') if edition in p.name)
        exam_id='IFSC-INT-'+edition;source_id='src-'+exam_id.lower();key_id=source_id+'-definitive-key';protected=edition.startswith('2026')
        sources.extend([{'id':source_id,'type':'official_exam','title':'IFSC Integrated '+edition,'locator':{'privateFile':exam.name},'metadata':{'examId':exam_id,'protected':protected,'sha256':sha(exam),'transcriptionStatus':'pending_review'}},{'id':key_id,'type':'official_exam','title':'Definitive key — '+edition,'locator':{'privateFile':key.name},'metadata':{'examId':exam_id,'protected':protected,'sha256':sha(key),'kind':'definitive_key'}}])
        with pdfplumber.open(key) as pdf:key_text='\n'.join(page.extract_text() or '' for page in pdf.pages)
        keys={int(number):answer for number,answer in re.findall(r'\b(\d{2})\s+(ANULADA|[A-E])\b',key_text)}
        if set(keys)!=set(range(1,29)):raise ValueError('Incomplete definitive key '+edition)
        page_dir=OUTPUT/edition/'pages';page_dir.mkdir(parents=True,exist_ok=True)
        if args.render:subprocess.run(['pdftoppm','-f','3','-l','24','-scale-to','1800','-png',str(exam),str(page_dir/'page')],check=True)
        pages=[]
        with pdfplumber.open(exam) as pdf:
            for i,page in enumerate(pdf.pages):
                if edition=='2025.2' and i>=2:
                    ocr_file=ROOT/'.local/ifsc-source-review/2025-2-ocr'/f'page-{i+1:02d}.json'
                    if not ocr_file.exists():raise ValueError('Run the local WinRT OCR script first')
                    text=ocr_text(json.loads(ocr_file.read_text(encoding='utf-8-sig')))
                else:text=page.dedupe_chars().extract_text() or ''
                pages.append(clean(text))
        markers=[];offset=0
        for page_index,page in enumerate(pages):
            for match in re.finditer(r'QUEST[ÃA]O\s+(\d{1,2})',page,re.I):markers.append({'number':int(match[1]),'offset':offset+match.start(),'page':page_index+1})
            offset+=len(page)+2
        text='\n\n'.join(pages)
        if [marker['number'] for marker in markers]!=list(range(1,29)):raise ValueError('Question marker integrity failure '+edition)
        for index,marker in enumerate(markers):
            number=marker['number'];end=markers[index+1]['offset'] if index<27 else len(text);raw=text[marker['offset']:end]
            matches=list(re.finditer(r'(?m)^\s*\(([A-E])\)\s*',raw))
            valid=len(matches)==5 and [match[1] for match in matches]==list('ABCDE')
            if not valid:issues.append({'exam':exam_id,'question':number,'code':'choice_transcription_pending','count':len(matches)})
            stem=raw[raw.find('\n')+1:matches[0].start()].strip() if valid else raw[raw.find('\n')+1:].strip()
            choices=[]
            if valid:
                for choice_index,match in enumerate(matches):
                    finish=matches[choice_index+1].start() if choice_index<4 else len(raw)
                    content=raw[match.end():finish].strip();content=re.split(r'(?m)^(?:Leia|Observe|Analise) (?:o|a|as|os)|^TEXTO\s+[IVXLCDM]+|^LÍNGUA PORTUGUESA|^MATEMÁTICA|^CIÊNCIAS|^GEOGRAFIA E HISTÓRIA',content)[0].strip()
                    choices.append({'id':match[1],'content':content or '(transcrição pendente; consulte a imagem original)','correct':keys[number]==match[1]})
            else:
                # Do not invent alternatives. These placeholders are explicitly unpublishable representations.
                choices=[{'id':letter,'content':'Alternativa '+letter+' — transcrição pendente; consulte o caderno original.','correct':keys[number]==letter} for letter in 'ABCDE']
            if edition=='2025.2' and number==18:
                # Manual transcription from original page 15 after OCR merged the adjacent cartoon column.
                stem='A Imagem V nos alerta, principalmente, que:'
                alternatives=['vivemos um momento de forte questionamento dos direitos trabalhistas.','os trabalhadores nos dias de hoje têm muitos direitos e ganham altos salários.','os robôs também devem ter direito às férias, intervalo de almoço e licença-maternidade.','as férias são prejudiciais à economia e deveriam ser abolidas.','os trabalhadores exploram os patrões que lhe concedem muitos benefícios.']
                choices=[{'id':letter,'content':text,'correct':keys[number]==letter} for letter,text in zip('ABCDE',alternatives)]
                issues=[issue for issue in issues if not(issue['exam']==exam_id and issue['question']==18)]
            subject='POR' if number<=7 else 'MAT' if number<=14 else 'GH' if number<=21 else 'CIE';concept=proposed_concepts(subject,stem,known)
            question_id=f'{exam_id}-Q{number:02d}';source_pages=sorted(set([max(3,marker['page']-1),marker['page']]+list(range(marker['page'],min(24,(markers[index+1]['page'] if index<27 else marker['page']))+1))))
            question_assets=[]
            for page_number in source_pages:
                image=page_dir/f'page-{page_number:02d}.png'
                if not image.exists():raise ValueError('Render source page images first '+str(image))
                width,height=Image.open(image).size;asset_id=str(uuid.uuid5(NAMESPACE,f'{sha(exam)}:{number}:{page_number}'))
                question_assets.append({'id':asset_id,'sourceId':source_id,'page':page_number,'alt':f'Página original {page_number} da prova IFSC Integrado {edition}, associada à questão {number}. A descrição acessível dos elementos visuais aguarda revisão.','width':width,'height':height})
                assets.append({'id':asset_id,'questionId':question_id,'version':1,'file':str(image.relative_to(OUTPUT)),'sha256':sha(image)})
            bank.append({'id':question_id,'version':1,'subjectCode':subject,'primaryConceptId':concept,'conceptIds':[concept],'type':'multiple_choice','difficulty':'ifsc','cognitiveOperations':['interpret','apply'],'stem':stem or f'Questão {number} — consulte o caderno original.','choices':choices,'answer':{'kind':'multiple_choice','choiceId':keys[number] if keys[number]!='ANULADA' else 'ANNULLED'},'sourceIds':[source_id,key_id],'assets':question_assets,'provenance':{'type':'official_exam','examId':exam_id,'officialNumber':number},'exposurePolicy':{'minimumDaysBetween':7,'reservedForAssessment':protected},'status':'annulled' if keys[number]=='ANULADA' else 'draft'})
            summaries.append({'id':question_id,'subject':subject,'proposedConcept':concept,'stemPreview':stem[:180],'classificationStatus':'pending_review','representationStatus':'pending_review','key':keys[number],'sourcePages':source_pages})
    payload={'sources':sources,'questions':bank,'curriculumLessons':curriculum,'assets':assets,'issues':issues,'classification':summaries}
    (OUTPUT/'bank.draft.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'questions':len(bank),'editions':4,'annulled':sum(q['status']=='annulled' for q in bank),'protected':sum(q['exposurePolicy']['reservedForAssessment'] for q in bank),'assets':len(assets),'transcriptionIssues':len(issues),'output':str(OUTPUT/'bank.draft.json')}))
if __name__=='__main__':main()
