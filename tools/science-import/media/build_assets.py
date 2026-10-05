"""Mechanical draft-only Science V2 SVG fallbacks. Never changes source content."""
from pathlib import Path
import hashlib
import html
import json
import textwrap
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'packs/drafts/ifsc-2027-science/source'
OUT = ROOT / '.local/science-integration/media'
OUT.mkdir(parents=True, exist_ok=True)
QUEUE = json.loads((SOURCE / 'MEDIA-PRODUCTION/DETERMINISTIC-ASSET-QUEUE.json').read_text(encoding='utf-8-sig'))
REQUESTS = {r['lessonId']: r for r in QUEUE['requests']}
WIDTH = 360
assets, coverage = [], []


def load(number):
    lesson_id = f'CIE-{number:02}'
    base = SOURCE / 'workspace' / lesson_id
    lesson = json.loads((base / 'author/lesson.json').read_text(encoding='utf-8-sig'))
    source = json.loads((base / 'research/source-pack.json').read_text(encoding='utf-8-sig'))
    return lesson_id, lesson, source


class Diagram:
    def __init__(self, title):
        self.parts, self.labels, self.y = [], [], 22
        self.text(title, 22, 26, '#102a43', 24, True)
        self.y += 15

    def text(self, value, x=26, wrap=30, color='#102a43', size=17, bold=False):
        self.labels.append(value)
        lines = textwrap.wrap(value, width=wrap, break_long_words=False, break_on_hyphens=False) or ['']
        for line in lines:
            self.parts.append(f'<text x="{x}" y="{self.y + size}" fill="{color}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}">{html.escape(line)}</text>')
            self.y += size + 7

    def card(self, heading, facts):
        start, index = self.y, len(self.parts)
        self.y += 16
        if heading:
            self.text(heading, bold=True)
            self.y += 7
        for value in facts:
            self.text(value)
            self.y += 10
        self.y += 7
        self.parts.insert(index, f'<rect x="12" y="{start}" width="336" height="{self.y-start}" rx="8" fill="#ffffff" stroke="#607d8b"/>')
        self.y += 18

    def arrow(self):
        center = self.y - 5
        self.parts.append(f'<path d="M180 {center}v18m-6-6 6 6 6-6" fill="none" stroke="#102a43" stroke-width="2"/>')
        self.y += 24

    def finish(self):
        height = self.y + 10
        title = html.escape(self.labels[0])
        description = html.escape('\n'.join(self.labels))
        raw = f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" role="img" aria-labelledby="title description"><title id="title">{title}</title><desc id="description">{description}</desc><rect width="360" height="{height}" fill="#f4f7f9"/>{"".join(self.parts)}</svg>\n'
        return raw, height


def register(number, drawing, family, limitation=None):
    lesson_id, lesson, source = load(number)
    request = REQUESTS[lesson_id]
    raw, height = drawing.finish()
    filename = f'{lesson_id.lower()}-draft.svg'
    path = OUT / filename
    path.write_text(raw, encoding='utf-8')
    text_equivalent = '\n'.join(drawing.labels)
    assets.append({
        'requestId': request['id'], 'path': path.relative_to(ROOT).as_posix(),
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'mime': 'svg+xml',
        'alt': lesson['title'], 'caption': request['description'] + ' Versão estática em rascunho; revisão humana pendente.',
        'credit': 'VECTA Science V2 — representação determinística local; revisão humana pendente.',
        'longDescription': text_equivalent, 'width': WIDTH, 'height': height,
        'status': 'LOCAL_DETERMINISTIC_DRAFT',
    })
    coverage.append({
        'requestId': request['id'], 'lessonId': lesson_id, 'family': family,
        'status': 'LOCAL_DETERMINISTIC_DRAFT', 'delivery': 'STATIC_FALLBACK',
        'factualReviewStatus': 'PENDING', 'visualReviewStatus': 'PENDING',
        'sourceRefs': request['sourceRefs'],
        'sourceFiles': {name: hashlib.sha256((SOURCE / 'workspace' / lesson_id / name).read_bytes()).hexdigest()
                        for name in ['author/lesson.json', 'research/source-pack.json']},
        'visibleLabels': drawing.labels,
        'remainingRequirement': limitation,
    })


def source_cards(number, groups, family='SOURCE_FACT_COMPARISON', flow=False, limitation=None):
    _, lesson, source = load(number)
    drawing = Diagram(lesson['title'])
    for i, (heading, indexes) in enumerate(groups):
        if i and flow:
            drawing.arrow()
        drawing.card(heading, [source['keyFacts'][index] for index in indexes])
    register(number, drawing, family, limitation)


# Circuits use only the battery/switch/lamp/wires requested in the queue.
# Both topologies have identical connections except for the switch contact.
_, lesson, source = load(6)
drawing = Diagram(lesson['title'])
for closed in [False, True]:
    drawing.card('Circuito fechado' if closed else 'Circuito aberto', [source['keyFacts'][1]])
    top = drawing.y + 35
    drawing.parts.append(f'<path d="M80 {top}H165M207 {top}H280V{top+120}H80V{top+79}M80 {top+47}V{top}" fill="none" stroke="#102a43" stroke-width="3"/>')
    drawing.parts.append(f'<path d="M65 {top+47}H95M71 {top+79}H89" stroke="#102a43" stroke-width="3"/>')
    drawing.parts.append(f'<circle cx="165" cy="{top}" r="3" fill="#102a43"/><circle cx="207" cy="{top}" r="3" fill="#102a43"/><path d="M165 {top}L207 {top if closed else top-22}" stroke="#102a43" stroke-width="3"/>')
    drawing.parts.append(f'<rect x="246" y="{top+41}" width="68" height="44" fill="#f4f7f9"/><circle cx="280" cy="{top+63}" r="22" fill="#ffffff" stroke="#102a43" stroke-width="3"/><path d="M265 {top+48}l30 30m0-30-30 30" stroke="#102a43" stroke-width="2"/>')
    drawing.y = top + 143
    drawing.text('bateria · chave · lâmpada · fios', wrap=33, size=16)
    drawing.y += 20
register(6, drawing, 'CIRCUIT_OPEN_CLOSED')

# Exact worked example is the static fallback for the requested calculator.
_, lesson, source = load(7)
example = next(b for b in lesson['blocks'] if b['type'] == 'WORKED_EXAMPLE')
drawing = Diagram(lesson['title'])
drawing.card(None, [source['keyFacts'][2]])
drawing.card('1.000 W · 2 horas', [example['prompt'], example['answer']])
assert 1000 / 1000 * 2 == 2
register(7, drawing, 'EXACT_WORKED_CALCULATION', 'Interactive calculator is not supported by the figure/img contract; supplied example is a static fallback.')

# Historical model descriptions are copied exactly, with no new atomic geometry.
source_cards(9, [('Dalton', [1]), ('Thomson', [2]), ('Rutherford', [3]), ('Bohr', [4])], 'HISTORICAL_MODEL_TIMELINE', True,
             'Historical descriptions only; no speculative atomic geometry or chronological dates added.')

_, lesson, source = load(10)
example = next(b for b in lesson['blocks'] if b['type'] == 'WORKED_EXAMPLE')
drawing = Diagram(lesson['title'])
drawing.card('Z = 15 · A = 31', [example['prompt']])
drawing.card('15 prótons · 16 nêutrons', [source['keyFacts'][0], source['keyFacts'][1], source['keyFacts'][2]])
drawing.card('15 elétrons', [source['keyFacts'][3], example['answer']])
drawing.card('Cátion e ânion', [source['keyFacts'][4]])
assert 31 - 15 == 16
register(10, drawing, 'EXACT_ATOMIC_COUNTS', 'Static supplied atom/count example; interactive atom editing and optional external embed remain unavailable.')

# Relationship is not drawn as a causal gene -> chromosome transformation.
source_cards(17, [('DNA', [0]), ('Gene', [1]), ('Cromossomos', [2, 3])], 'GENETIC_RELATIONSHIP_COMPARISON', limitation='Schematic text relationships; no molecular/anatomical scale or chromosome geometry is asserted.')
source_cards(18, [('Mitose', [0, 1]), ('Meiose', [2, 3]), ('Gametogênese', [4, 5])], 'CELL_DIVISION_COMPARISON', limitation='Static mitosis/meiosis comparison; detailed stage geometry is not provided by the source and is not invented.')
source_cards(22, [('Efeito estufa', [0, 1]), ('Camada de ozônio', [4, 5])], 'SEPARATE_RADIATION_COMPARISON')

# Aa x Aa is the exact worked example; no extra inheritance traits are introduced.
_, lesson, source = load(25)
example = next(b for b in lesson['blocks'] if b['type'] == 'WORKED_EXAMPLE')
assert 'Aa × Aa' in example['prompt'] and example['answer'] == '1 AA : 2 Aa : 1 aa.'
drawing = Diagram(lesson['title'])
drawing.card(None, [example['prompt']])
start = drawing.y
alleles = ['A', 'a']
cells = [['Aa × Aa', 'A', 'a'], ['A', 'AA', 'Aa'], ['a', 'Aa', 'aa']]
assert sorted([''.join(sorted(left + right, key=lambda value: (value.islower(), value))) for left in alleles for right in alleles]) == ['AA', 'Aa', 'Aa', 'aa']
for row, items in enumerate(cells):
    for col, value in enumerate(items):
        x, y = 15 + col * 110, start + row * 66
        drawing.parts.append(f'<rect x="{x}" y="{y}" width="110" height="66" fill="{ "#e2e8ef" if row == 0 or col == 0 else "#ffffff"}" stroke="#102a43"/>')
        drawing.labels.append(value)
        drawing.parts.append(f'<text x="{x+55}" y="{y+39}" text-anchor="middle" fill="#102a43" font-family="Arial, sans-serif" font-size="{16 if len(value)>4 else 24}">{html.escape(value)}</text>')
drawing.y = start + 220
drawing.card(None, [example['answer'], source['keyFacts'][5]])
drawing.labels.append('Quadro Aa × Aa. Cabeçalhos de coluna: A, a. Cabeçalhos de linha: A, a. Linha A: coluna A = AA; coluna a = Aa. Linha a: coluna A = Aa; coluna a = aa.')
register(25, drawing, 'EXACT_PUNNETT_TABLE', 'Static Punnett table; interactive crossing controls remain unavailable.')

# Source order is preserved. It describes taxonomy categories, not exact phylogeny.
source_cards(27, [('Classificação biológica', [0]), ('Espécie', [1]), ('Categorias taxonômicas', [2]), ('Nomes científicos', [3])], 'TAXONOMY_CLASSIFICATION', limitation='Static hierarchy statements only; no exact phylogenetic tree is claimed.')

source_cards(30, [('Vacina → antígeno → resposta', [0]), ('Células de memória → resposta futura', [1])], 'VACCINATION_MEMORY_FLOW', True)
source_cards(33, [('Preservativos', [0]), ('Métodos hormonais', [1]), ('DIU e implante', [2]), ('Métodos definitivos', [3]), ('Dupla proteção', [5])], 'CONTRACEPTION_COMPARISON', limitation='Single-column mobile comparison of supplied method facts; no unsupplied efficacy percentages, legal criteria or medical advice added.')
source_cards(34, [('Lamarck', [0]), ('Darwin-Wallace', [1]), ('Síntese moderna', [5])], 'EVOLUTION_THEORY_TIMELINE', True, 'No historical dates or licensed portraits supplied; source statements only.')
_, lesson, source = load(40)
drawing = Diagram(lesson['title'])
drawing.card('Evolução estelar', source['keyFacts'][0:3])
common_end = drawing.y - 18
branch_centers = []
for heading, index in [('Massa semelhante à do Sol', 3), ('Estrelas muito massivas', 4)]:
    branch_start = drawing.y
    drawing.card(heading, [source['keyFacts'][index]])
    branch_centers.append((branch_start + drawing.y - 18) / 2)
drawing.parts.append(f'<path d="M180 {common_end}v9H5V{branch_centers[-1]}" fill="none" stroke="#102a43" stroke-width="2"/>')
for center in branch_centers:
    drawing.parts.append(f'<path d="M5 {center}H12" fill="none" stroke="#102a43" stroke-width="2"/>')
register(40, drawing, 'STELLAR_MASS_BRANCH_COMPARISON', 'Two mass cases shown as separate branches with the exact source qualifications; no unsupplied stage, timing or mass thresholds added.')

PENDING = {
    8: 'Source supplies qualitative states/transitions but no particle-layout model. Exact structural particle diagram remains pending rather than inventing state geometry.',
    11: 'Complete reliable periodic element/atomic-number/group/period dataset is absent from the package; a few cited element symbols cannot form a periodic table.',
    13: 'Filtration/decantation/distillation facts are supplied but reviewed apparatus/vector geometry is absent.',
    15: 'Reviewed prokaryotic/animal/plant cell vector geometry and label coordinates are absent.',
    16: 'Reviewed organelle/cell vector geometry and metabolic-flow specification are absent.',
    29: 'Licensed/reviewed anatomical illustration and system hotspot coordinates are absent.',
    31: 'Reviewed eye/myopia/hypermetropia optical ray geometry is absent.',
    32: 'Licensed/reviewed reproductive anatomy and specified menstrual-cycle timeline are absent.',
    37: 'Planet classes are supplied, but schematic orbit placement/order/geometry is not explicitly specified. No speculative Solar System diagram produced.',
    38: 'Phase/eclipse relative positions, solar-eclipse geometry and gravity-vector specification are absent; static facts cannot substitute for the requested geometry.',
    39: 'UA/year-light definitions are supplied but numerical powers-of-ten comparison values are absent; no quantitative scale is fabricated.',
}
for number, reason in PENDING.items():
    lesson_id, lesson, source = load(number)
    coverage.append({'requestId': REQUESTS[lesson_id]['id'], 'lessonId': lesson_id,
                     'status': 'IMPLEMENTATION_REQUIRED', 'reason': reason,
                     'factualReviewStatus': 'PENDING', 'visualReviewStatus': 'PENDING'})

assets.sort(key=lambda row: row['requestId'])
coverage.sort(key=lambda row: row['requestId'])
assert len(assets) == 13 and len(coverage) == 24
assert set(row['requestId'] for row in coverage) == {row['id'] for row in QUEUE['requests']}

validation = []
for asset in assets:
    path = ROOT / asset['path']
    raw = path.read_bytes()
    root = ET.fromstring(raw)
    assert len(raw) <= 200000
    assert root.tag == '{http://www.w3.org/2000/svg}svg'
    assert root.attrib['viewBox'] == f"0 0 {asset['width']} {asset['height']}"
    assert asset['width'] == 360 and asset['height'] > 0
    assert hashlib.sha256(raw).hexdigest() == asset['sha256']
    for element in root.iter():
        local_name = element.tag.rsplit('}', 1)[-1]
        assert local_name not in ['script', 'foreignObject', 'image', 'use', 'iframe']
        assert all(not key.lower().startswith('on') and not key.endswith('href') for key in element.attrib)
        if local_name == 'text':
            assert ''.join(element.itertext()).strip()
            assert float(element.attrib['font-size']) >= 16
    assert len(asset['alt']) >= 12
    record = next(row for row in coverage if row['requestId'] == asset['requestId'])
    assert all(label in asset['longDescription'] for label in record['visibleLabels'])
    validation.append({'requestId': asset['requestId'], 'bytes': len(raw), 'validXml': True,
                       'sha256Verified': True, 'safeSvg': True, 'completeTextEquivalent': True,
                       'width': 360, 'height': asset['height'], 'minimumFontSize': 16,
                       'mobileViewBoxVerified': True})

for filename, value in [('assets.json', {'assets': assets}),
                        ('asset-status.json', {'sourceQueueCount': 24, 'localDraftStaticFallbacks': 13,
                          'pendingWithoutAssets': 11, 'factualReviewStatus': 'PENDING',
                          'visualReviewStatus': 'PENDING', 'requests': coverage}),
                        ('validation.json', {'status': 'PASSED_PROGRAMMATIC_CHECKS',
                          'visualHumanReview': 'PENDING', 'factualHumanReview': 'PENDING',
                          'checks': validation})]:
    (OUT / filename).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'Created {len(assets)} draft SVG static fallbacks; {len(PENDING)} requests remain without assets. XML, safety, hashes, viewBox, dimensions, labels and exact calculation/Punnett checks passed.')
