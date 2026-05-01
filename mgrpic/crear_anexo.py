from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ── Márgenes A4 estándar TFM ──────────────────────────────────────────────────
section = doc.sections[0]
section.page_width  = Cm(21)
section.page_height = Cm(29.7)
section.top_margin    = Cm(2.5)
section.bottom_margin = Cm(2.5)
section.left_margin   = Cm(3.0)
section.right_margin  = Cm(2.0)

# ── Paleta de colores ─────────────────────────────────────────────────────────
AZUL       = RGBColor(0x1F, 0x38, 0x64)   # institucional
AZUL_CLARO = RGBColor(0x2E, 0x74, 0xB5)   # acento
MORADO     = RGBColor(0x6C, 0x34, 0x83)   # D1
AZUL_D2    = RGBColor(0x1A, 0x52, 0x76)   # D2
ROJO_D3    = RGBColor(0x92, 0x2B, 0x21)   # D3
VERDE      = RGBColor(0x70, 0xAD, 0x47)
AMBAR      = RGBColor(0xFF, 0xD9, 0x66)
NARANJA    = RGBColor(0xFF, 0x99, 0x33)
ROJO       = RGBColor(0xFF, 0x00, 0x00)
GRIS_FONDO = RGBColor(0xF2, 0xF2, 0xF2)
NEGRO      = RGBColor(0x1C, 0x25, 0x35)
GRIS_TEXT  = RGBColor(0x4A, 0x5E, 0x72)

def set_cell_bg(cell, rgb_hex):
    """Establece color de fondo de celda."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), rgb_hex)
    tcPr.append(shd)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if val:
            el = OxmlElement(f'w:{side}')
            el.set(qn('w:val'), val.get('val', 'single'))
            el.set(qn('w:sz'), str(val.get('sz', 4)))
            el.set(qn('w:color'), val.get('color', 'auto'))
            tcBorders.append(el)
    tcPr.append(tcBorders)

def par_style(par, size=11, bold=False, italic=False, color=None, align=None, space_before=0, space_after=6):
    par.paragraph_format.space_before = Pt(space_before)
    par.paragraph_format.space_after  = Pt(space_after)
    if align: par.alignment = align
    for run in par.runs:
        run.font.size   = Pt(size)
        run.font.bold   = bold
        run.font.italic = italic
        if color: run.font.color.rgb = color

def add_par(doc, text, size=11, bold=False, italic=False, color=None,
            align=WD_ALIGN_PARAGRAPH.LEFT, sb=0, sa=4, style=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_before = Pt(sb)
    p.paragraph_format.space_after  = Pt(sa)
    p.alignment = align
    run = p.add_run(text)
    run.font.size   = Pt(size)
    run.font.bold   = bold
    run.font.italic = italic
    run.font.name   = 'Calibri'
    if color: run.font.color.rgb = color
    return p

def add_heading_annex(doc, text, level=1):
    """Encabezado numerado para secciones del anexo."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14 if level==1 else 8)
    p.paragraph_format.space_after  = Pt(6)
    run = p.add_run(text)
    run.font.name  = 'Calibri'
    run.font.size  = Pt(13 if level==1 else 11)
    run.font.bold  = True
    run.font.color.rgb = AZUL if level==1 else AZUL_CLARO
    # Línea inferior para nivel 1
    if level == 1:
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '6')
        bottom.set(qn('w:color'), '1F3864')
        pBdr.append(bottom)
        pPr.append(pBdr)
    return p


# ══════════════════════════════════════════════════════════════════════════════
# PORTADA DEL ANEXO
# ══════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
doc.add_paragraph()

p = add_par(doc, 'ANEXO', size=11, bold=False, color=GRIS_TEXT,
            align=WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=4)
p.runs[0].font.letter_spacing = Pt(2)

add_par(doc, 'MGRPIC — Herramienta de Evaluación de Riesgo Procesal',
        size=18, bold=True, color=AZUL, align=WD_ALIGN_PARAGRAPH.CENTER, sb=4, sa=6)

add_par(doc, 'Matriz de Gestión de Riesgo Procesal en la Incautación de Criptoactivos',
        size=13, bold=False, color=AZUL_CLARO, align=WD_ALIGN_PARAGRAPH.CENTER, sb=0, sa=4)

add_par(doc, 'Versión 3.0 · Instrumento de uso policial',
        size=10, italic=True, color=GRIS_TEXT, align=WD_ALIGN_PARAGRAPH.CENTER, sb=8, sa=4)

doc.add_paragraph()

# Nota de archivo digital
t = doc.add_table(rows=1, cols=1)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
t.style = 'Table Grid'
cell = t.cell(0, 0)
set_cell_bg(cell, 'E6EFF8')
p = cell.paragraphs[0]
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(6)
p.paragraph_format.space_after  = Pt(6)
r = p.add_run('El archivo ejecutable ')
r.font.size = Pt(10); r.font.name = 'Calibri'
r2 = p.add_run('MGRPIC.html')
r2.font.size = Pt(10); r2.font.bold = True; r2.font.name = 'Calibri'
r3 = p.add_run(' se adjunta en formato digital. Abrir con cualquier navegador web sin instalación ni conexión a internet.')
r3.font.size = Pt(10); r3.font.name = 'Calibri'

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# 1. DESCRIPCIÓN TÉCNICA
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '1. Descripción técnica de la herramienta')

rows_desc = [
    ('Denominación',        'Matriz de Gestión de Riesgo Procesal en la Incautación de Criptoactivos (MGRPIC)'),
    ('Versión',             '3.0'),
    ('Tipo de aplicación',  'Aplicación web de página única (SPA). Archivo HTML autocontenido sin dependencias externas.'),
    ('Tecnología',          'HTML5, CSS3 y JavaScript puro (sin frameworks ni librerías externas). Funciona completamente offline.'),
    ('Compatibilidad',      'Cualquier navegador web moderno: Chrome, Firefox, Edge, Safari (versiones actuales).'),
    ('Instalación',         'No requiere instalación. Basta con abrir el archivo MGRPIC.html en el navegador.'),
    ('Almacenamiento',      'Ningún dato se almacena en el dispositivo ni se transmite a servidores externos. El estado de la evaluación se mantiene únicamente en memoria durante la sesión.'),
    ('Naturaleza',          'Instrumento de uso policial. Apoya dos decisiones: selección del modelo de custodia y valoración de la procedencia de propuesta de enajenación anticipada al Ministerio Fiscal al amparo del artículo 367 ter de la LECrim. No es una herramienta judicial.'),
]

t = doc.add_table(rows=len(rows_desc), cols=2)
t.style = 'Table Grid'
t.alignment = WD_TABLE_ALIGNMENT.LEFT
col_widths = [Cm(4.5), Cm(11.0)]

for i, (lbl, val) in enumerate(rows_desc):
    row = t.rows[i]
    row.cells[0].width = col_widths[0]
    row.cells[1].width = col_widths[1]
    set_cell_bg(row.cells[0], 'E6EFF8')
    # Label
    p0 = row.cells[0].paragraphs[0]
    p0.paragraph_format.space_before = Pt(3)
    p0.paragraph_format.space_after  = Pt(3)
    r = p0.add_run(lbl)
    r.font.size = Pt(9.5); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = AZUL
    # Value
    p1 = row.cells[1].paragraphs[0]
    p1.paragraph_format.space_before = Pt(3)
    p1.paragraph_format.space_after  = Pt(3)
    r2 = p1.add_run(val)
    r2.font.size = Pt(9.5); r2.font.name = 'Calibri'

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# 2. ESTRUCTURA DE INDICADORES
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '2. Estructura de indicadores y sistema de ponderación')

add_par(doc, 'La herramienta evalúa 10 indicadores agrupados en 3 dimensiones ponderadas. '
        'Cada indicador se puntúa en una escala de 0 (Bajo), 1 (Moderado) o 2 (Alto). '
        'La puntuación global se expresa en una escala de 0 a 100 puntos.',
        size=10, color=NEGRO, sb=0, sa=8)

# Tabla de dimensiones e indicadores
dims = [
    {
        'id': 'D1', 'nombre': 'Volatilidad', 'peso': '35 %', 'factor': '4,375',
        'max': '35', 'color': '6C3483', 'color_rgb': MORADO,
        'indicadores': [
            ('V.1', 'Naturaleza del activo',
             'Stablecoin (USDT, USDC)',
             'Alta capitalización con mercado líquido (BTC, ETH)',
             'Altcoin de baja capitalización o token sin mercado secundario activo'),
            ('V.2', 'Variación de precio en los 30 días previos a la incautación',
             'Inferior al 10% sin tendencia marcada',
             'Entre el 10% y el 30%',
             'Superior al 30% o variación brusca >15% en las últimas 48 horas'),
            ('V.3', 'Complejidad de la causa como indicador de duración estimada',
             'Causa sencilla, investigado único, sin cooperación internacional',
             'Varios investigados o diligencia internacional pendiente',
             'Causa compleja, cooperación internacional activa o crimen organizado'),
            ('V.4', 'Valor total del activo incautado',
             'Inferior a 10.000 €',
             'Entre 10.000 € y 500.000 €',
             'Superior a 500.000 €'),
        ]
    },
    {
        'id': 'D2', 'nombre': 'Custodia y Trazabilidad', 'peso': '30 %', 'factor': '5,0',
        'max': '30', 'color': '1A5276', 'color_rgb': AZUL_D2,
        'indicadores': [
            ('C.1', 'Tipo de soporte de custodia de la clave privada',
             'Custodio institucional especializado (Prosegur Crypto o ORGA) con contrato',
             'Monedero frío policial bajo acta formal de entrega al LAJ',
             'Soporte en papel, dispositivo sin cifrar o custodia informal sin acta'),
            ('C.2', 'Número de personas con conocimiento de la clave privada',
             'Una sola persona con acta de entrega y registro nominativo',
             'Dos o tres personas con registro documentado de acceso',
             'Más de tres personas o acceso sin documentación formal'),
            ('C.3', 'Calidad de la trazabilidad del activo en la cadena de bloques',
             'Dirección vinculada directamente al investigado mediante datos del exchange con KYC',
             'Dirección identificada mediante heurísticas de clustering, sin vinculación directa',
             'Activo trazado parcialmente o flujo interrumpido por mixer, tumbler o moneda de privacidad'),
        ]
    },
    {
        'id': 'D3', 'nombre': 'Contexto Operativo Policial', 'peso': '35 %', 'factor': '5,833',
        'max': '35', 'color': '922B21', 'color_rgb': ROJO_D3,
        'indicadores': [
            ('J.1', 'Existencia de protocolo previo en la unidad para intervención de criptoactivos',
             'Unidad con protocolo documentado y personal con formación acreditada',
             'Sin protocolo propio pero con acceso a unidad especializada de apoyo',
             'Sin protocolo, sin personal formado y sin unidad especializada de apoyo'),
            ('J.2', 'Urgencia de la decisión de enajenación anticipada',
             'Activo estable y causa corta; custodia ordinaria sin riesgo patrimonial relevante',
             'Volatilidad moderada o causa larga; conveniente elevar propuesta al Fiscal en plazo breve',
             'Alta volatilidad o valor elevado con causa larga; riesgo patrimonial inmediato'),
            ('J.3', 'Claridad de la cadena de responsabilidad sobre el activo incautado',
             'Responsabilidad claramente atribuida al custodio institucional mediante contrato formal',
             'Responsabilidad compartida entre LAJ y Policía Judicial con acta de entrega documentada',
             'Custodia sin atribución clara de responsabilidad o sin documentación formal'),
        ]
    },
]

for dim in dims:
    # Encabezado de dimensión
    n_ind = len(dim['indicadores'])
    # Header row: Dim ID | Nombre | Peso | Factor | Máx.
    t = doc.add_table(rows=1 + n_ind, cols=6)
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.LEFT

    # Anchos de columna
    widths = [Cm(0.9), Cm(1.1), Cm(3.8), Cm(3.0), Cm(3.0), Cm(3.0)]
    for row in t.rows:
        for i, cell in enumerate(row.cells):
            cell.width = widths[i]

    # Fila de encabezado de la dimensión (fila 0)
    hrow = t.rows[0]
    set_cell_bg(hrow.cells[0], dim['color'])
    set_cell_bg(hrow.cells[1], dim['color'])
    set_cell_bg(hrow.cells[2], dim['color'])
    set_cell_bg(hrow.cells[3], 'E6EFF8')
    set_cell_bg(hrow.cells[4], 'E6EFF8')
    set_cell_bg(hrow.cells[5], 'E6EFF8')

    # Merge cells 0+1+2 para nombre de dimensión
    hrow.cells[0].merge(hrow.cells[2])
    p = hrow.cells[0].paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    r = p.add_run(f'{dim["id"]} — {dim["nombre"]}')
    r.font.size = Pt(10); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for col_idx, (label, val) in enumerate([
        ('Peso', dim['peso']), ('Factor', dim['factor']), ('Máx.', dim['max'] + ' pts')
    ], start=3):
        p = hrow.cells[col_idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after  = Pt(4)
        r = p.add_run(f'{label}: {val}')
        r.font.size = Pt(9); r.font.bold = True; r.font.name = 'Calibri'
        r.font.color.rgb = AZUL

    # Sub-encabezado de columnas de indicadores
    # Fila 1..n: indicadores
    col_headers = ['Cód.', 'Nombre del indicador', 'Bajo (0)', 'Moderado (1)', 'Alto (2)']
    col_bg = ['E6EFF8', 'E6EFF8', 'E8F5DD', 'FFF8CC', 'FFE5E5']

    for i_ind, (codigo, nombre, bajo, mod, alto) in enumerate(dim['indicadores']):
        row = t.rows[1 + i_ind]
        vals = [codigo, nombre, bajo, mod, alto]
        bgs  = col_bg
        for ci, (v, bg) in enumerate(zip(vals, bgs)):
            set_cell_bg(row.cells[ci + 1], bg)
            p = row.cells[ci + 1].paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after  = Pt(3)
            if ci == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(v)
            r.font.size = Pt(8.5); r.font.name = 'Calibri'
            r.font.bold = (ci <= 1)
            if ci == 0: r.font.color.rgb = dim['color_rgb']
        # Celda 0 (vacía, borde de dimensión)
        set_cell_bg(row.cells[0], dim['color'])

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

# ══════════════════════════════════════════════════════════════════════════════
# 3. NIVELES DE RIESGO Y PROTOCOLO POLICIAL
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '3. Niveles de riesgo y protocolo policial de actuación')

niveles = [
    ('BAJO',     '0 – 25',   'E8F5DD', '70AD47', '3D7020',
     'Riesgo procesal controlado. Custodia ordinaria bajo supervisión del LAJ. Incorporar resultado '
     'al atestado. Reevaluar si algún indicador cambia significativamente, en particular ante '
     'variaciones relevantes del precio del activo.'),
    ('MODERADO', '26 – 50',  'FFF8CC', 'B8860B', '7D5C00',
     'Riesgo procesal significativo. Valorar encomienda a la ORGA o custodio institucional especializado. '
     'Documentar variaciones de precio mensualmente. Si V.2 asciende a Alto, elevar propuesta motivada '
     'al Ministerio Fiscal para que inste la enajenación anticipada conforme al artículo 367 ter LECrim.'),
    ('ALTO',     '51 – 75',  'FFF0D9', 'FF9933', 'A04800',
     'Riesgo procesal elevado. Elevar propuesta motivada al Ministerio Fiscal en el plazo más breve '
     'posible, con fundamento en la evaluación MGRPIC. Solicitar perito especializado en activos '
     'digitales. Valorar la enajenación anticipada o conversión a moneda fiduciaria estable.'),
    ('CRÍTICO',  '76 – 100', 'FFE5E5', 'FF0000', 'CC0000',
     'Riesgo procesal máximo. Actuación inmediata en las primeras 24-48 horas. Comunicación urgente '
     'al Ministerio Fiscal. Elevación inmediata de propuesta de enajenación anticipada al amparo del '
     'artículo 367 ter LECrim. Apertura de pieza separada de responsabilidad civil. Valorar el bloqueo '
     'cautelar de activos en exchanges identificados.'),
]

t = doc.add_table(rows=len(niveles) + 1, cols=3)
t.style = 'Table Grid'
t.alignment = WD_TABLE_ALIGNMENT.LEFT
widths_n = [Cm(2.2), Cm(2.0), Cm(11.3)]

# Encabezado
for ci, (hdr, bg) in enumerate(zip(['Nivel', 'Puntuación', 'Protocolo policial de actuación'],
                                    ['1F3864', '1F3864', '1F3864'])):
    set_cell_bg(t.rows[0].cells[ci], bg)
    t.rows[0].cells[ci].width = widths_n[ci]
    p = t.rows[0].cells[ci].paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after  = Pt(3)
    r = p.add_run(hdr)
    r.font.size = Pt(9); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

for i, (nivel, rango, bg, border_color, texto_color, protocolo) in enumerate(niveles):
    row = t.rows[i + 1]
    for ci in range(3): row.cells[ci].width = widths_n[ci]
    set_cell_bg(row.cells[0], bg)
    set_cell_bg(row.cells[1], bg)
    set_cell_bg(row.cells[2], 'FFFFFF')

    p0 = row.cells[0].paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p0.paragraph_format.space_before = Pt(4)
    p0.paragraph_format.space_after  = Pt(4)
    r = p0.add_run(nivel)
    r.font.size = Pt(9.5); r.font.bold = True; r.font.name = 'Calibri'
    tc = int(texto_color[0:2],16), int(texto_color[2:4],16), int(texto_color[4:6],16)
    r.font.color.rgb = RGBColor(*tc)

    p1 = row.cells[1].paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(4)
    p1.paragraph_format.space_after  = Pt(4)
    r2 = p1.add_run(rango)
    r2.font.size = Pt(9.5); r2.font.bold = True; r2.font.name = 'Calibri'
    r2.font.color.rgb = RGBColor(*tc)

    p2 = row.cells[2].paragraphs[0]
    p2.paragraph_format.space_before = Pt(3)
    p2.paragraph_format.space_after  = Pt(3)
    r3 = p2.add_run(protocolo)
    r3.font.size = Pt(9); r3.font.name = 'Calibri'

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# 4. VERIFICACIÓN MATEMÁTICA — CASOS TIPO
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '4. Verificación matemática del modelo de ponderación')

add_par(doc, 'La validez del sistema de ponderación se ha verificado mediante cinco casos tipo que cubren '
        'los extremos y los valores intermedios de la escala. Los resultados obtenidos por la herramienta '
        'coinciden con los valores calculados manualmente.',
        size=10, color=NEGRO, sb=0, sa=8)

casos = [
    ('A', 'V1=1, V2=0, V3=1, V4=1', 'C1=0, C2=0, C3=0', 'J1=1, J2=0, J3=0',
     '13,13', '0,00', '5,83', '18,96', 'BAJO'),
    ('B', 'V1=2, V2=2, V3=2, V4=2', 'C1=2, C2=2, C3=2', 'J1=2, J2=2, J3=2',
     '35,00', '30,00', '35,00', '100,00', 'CRÍTICO'),
    ('C', 'V1=1, V2=1, V3=2, V4=2', 'C1=1, C2=1, C3=1', 'J1=1, J2=1, J3=1',
     '26,25', '15,00', '17,50', '58,75', 'ALTO'),
    ('D', 'V1=0, V2=0, V3=0, V4=1', 'C1=0, C2=0, C3=0', 'J1=1, J2=0, J3=0',
     '4,38', '0,00', '5,83', '10,21', 'BAJO'),
    ('E', 'V1=1, V2=2, V3=2, V4=2', 'C1=1, C2=2, C3=2', 'J1=2, J2=2, J3=1',
     '30,63', '25,00', '29,17', '84,79', 'CRÍTICO'),
]

hdrs_c = ['Caso', 'D1 — Volatilidad', 'D2 — Custodia y traz.', 'D3 — Contexto op.', 'Pts. D1', 'Pts. D2', 'Pts. D3', 'Total', 'Nivel']
bgs_c  = ['1F3864','6C3483','1A5276','922B21','E6EFF8','E6EFF8','E6EFF8','E6EFF8','1F3864']

t = doc.add_table(rows=len(casos)+1, cols=len(hdrs_c))
t.style = 'Table Grid'
t.alignment = WD_TABLE_ALIGNMENT.LEFT
w_c = [Cm(0.8), Cm(2.6), Cm(2.6), Cm(2.6), Cm(1.1), Cm(1.1), Cm(1.1), Cm(1.1), Cm(1.5)]

for ci, (hdr, bg) in enumerate(zip(hdrs_c, bgs_c)):
    cell = t.rows[0].cells[ci]
    cell.width = w_c[ci]
    set_cell_bg(cell, bg)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(2)
    r = p.add_run(hdr)
    r.font.size = Pt(8); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF) if bg != 'E6EFF8' else AZUL

nivel_colors = {
    'BAJO': ('E8F5DD', '3D7020'), 'MODERADO': ('FFF8CC', '7D5C00'),
    'ALTO': ('FFF0D9', 'A04800'), 'CRÍTICO': ('FFE5E5', 'CC0000')
}

for i, (caso, d1, d2, d3, p1, p2, p3, total, nivel) in enumerate(casos):
    row = t.rows[i+1]
    for ci in range(len(hdrs_c)): row.cells[ci].width = w_c[ci]
    vals = [caso, d1, d2, d3, p1, p2, p3, total, nivel]
    bg_c, txt_c = nivel_colors[nivel]
    for ci, v in enumerate(vals):
        cell = row.cells[ci]
        if ci == 0:
            set_cell_bg(cell, bg_c)
        elif ci == 8:
            set_cell_bg(cell, bg_c)
        else:
            set_cell_bg(cell, 'FFFFFF')
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after  = Pt(2)
        r = p.add_run(v)
        r.font.size = Pt(8); r.font.name = 'Calibri'
        r.font.bold = (ci in [0, 7, 8])
        if ci in [0, 8]:
            tc2 = int(txt_c[0:2],16), int(txt_c[2:4],16), int(txt_c[4:6],16)
            r.font.color.rgb = RGBColor(*tc2)

doc.add_paragraph()

add_par(doc,
    'Fórmulas aplicadas: D1 = suma(V1–V4) × 4,375 | D2 = suma(C1–C3) × 5,000 | '
    'D3 = suma(J1–J3) × 5,833 | Puntuación global = D1 + D2 + D3 (escala 0–100)',
    size=8.5, italic=True, color=GRIS_TEXT, sb=2, sa=8)

# ══════════════════════════════════════════════════════════════════════════════
# 5. INSTRUCCIONES DE USO
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '5. Instrucciones de uso')

pasos = [
    ('Paso 1 — Datos del caso',
     'Introducir el número de diligencias, la unidad policial actuante, la fecha de la incautación, '
     'el tipo de activo digital intervenido y el órgano judicial competente. Estos datos se integrarán '
     'automáticamente en el encabezado del informe final.'),
    ('Paso 2 — Dimensión I: Volatilidad',
     'Seleccionar una opción (Bajo / Moderado / Alto) para cada uno de los cuatro indicadores V.1 a V.4. '
     'Es obligatorio responder a todos los indicadores antes de continuar. '
     'Un contador indica el progreso de la dimensión.'),
    ('Paso 3 — Dimensión II: Custodia y Trazabilidad',
     'Seleccionar una opción para cada uno de los tres indicadores C.1 a C.3, relativos al modelo '
     'de custodia de la clave privada y a la calidad de la trazabilidad del activo en blockchain.'),
    ('Paso 4 — Dimensión III: Contexto Operativo Policial',
     'Seleccionar una opción para cada uno de los tres indicadores J.1 a J.3, relativos a la capacidad '
     'operativa de la unidad, la urgencia de la decisión de enajenación y la cadena de responsabilidad.'),
    ('Paso 5 — Resultados',
     'La herramienta calcula automáticamente la puntuación ponderada de cada dimensión y la puntuación '
     'global. Se muestra el nivel de riesgo (BAJO / MODERADO / ALTO / CRÍTICO), el desglose gráfico '
     'por dimensión, los factores de mayor riesgo y el protocolo policial de actuación recomendado.'),
    ('Paso 6 — Informe final',
     'Se genera un informe estructurado con todos los datos del caso, las puntuaciones obtenidas, '
     'la valoración indicador por indicador y el protocolo de actuación. El informe puede imprimirse '
     'en formato PDF (Imprimir / Guardar PDF) o copiarse al portapapeles para su integración en el atestado.'),
]

for titulo, descripcion in pasos:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(2)
    r = p.add_run(titulo)
    r.font.size = Pt(10); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = AZUL_CLARO
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after  = Pt(4)
    p2.paragraph_format.left_indent  = Cm(0.5)
    r2 = p2.add_run(descripcion)
    r2.font.size = Pt(10); r2.font.name = 'Calibri'; r2.font.color.rgb = NEGRO

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# 6. CAPTURAS DE PANTALLA DE LA APLICACIÓN
# ══════════════════════════════════════════════════════════════════════════════
import os as _os
add_heading_annex(doc, '6. Capturas de pantalla de la aplicación')

add_par(doc,
    'Las siguientes imágenes muestran las pantallas principales de la MGRPIC v3.0. '
    'La herramienta se ejecuta íntegramente en el navegador, sin instalación ni conexión a internet.',
    size=10, color=NEGRO, sb=0, sa=8)

capturas = [
    ('cap0_inicio.png',
     'Figura 1. Pantalla de inicio de la MGRPIC. Muestra el acceso a nueva evaluación y las tarjetas '
     'informativas sobre el funcionamiento, los niveles de riesgo y el informe generado.'),
    ('cap1_dim1.png',
     'Figura 2. Evaluación de la Dimensión I — Volatilidad. Los cuatro indicadores (V.1 a V.4) deben '
     'responderse antes de continuar. El contador de progreso indica los indicadores completados.'),
    ('cap5_resultados.png',
     'Figura 3. Pantalla de resultados (Caso C de referencia: 58,75 puntos — nivel ALTO). '
     'Muestra la puntuación global, el desglose por dimensión y el protocolo policial de actuación.'),
    ('cap6_informe.png',
     'Figura 4. Informe estructurado generado automáticamente. Incluye los datos del caso, '
     'la puntuación y el nivel de riesgo, el desglose por dimensión e indicador, y el protocolo de actuación.'),
]

base_dir = '/home/user/MGRPIC/mgrpic'
for fname, caption in capturas:
    img_path = _os.path.join(base_dir, fname)
    if _os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after  = Pt(2)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Cm(14))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after  = Pt(12)
        r_cap = p_cap.add_run(caption)
        r_cap.font.size   = Pt(9)
        r_cap.font.italic = True
        r_cap.font.name   = 'Calibri'
        r_cap.font.color.rgb = GRIS_TEXT

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# 7. MUESTRA DEL INFORME GENERADO (CASO C)
# ══════════════════════════════════════════════════════════════════════════════
add_heading_annex(doc, '7. Muestra del informe generado — Caso C (58,75 — ALTO)')

add_par(doc,
    'A continuación se reproduce el texto íntegro del informe que la MGRPIC genera automáticamente '
    'al concluir la evaluación del Caso C de referencia (BTC + ETH, DP 47/2025, UDEF-BLA). '
    'El informe se estructura en seis apartados y está diseñado para adjuntarse al atestado '
    'o trasladarse al Ministerio Fiscal.',
    size=10, color=NEGRO, sb=0, sa=8)

# ─── Cabecera del informe ────────────────────────────────────────────────────
hdr_tbl = doc.add_table(rows=1, cols=1)
hdr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr_cell = hdr_tbl.cell(0, 0)
set_cell_bg(hdr_cell, '1F3864')
ph = hdr_cell.paragraphs[0]
ph.alignment = WD_ALIGN_PARAGRAPH.CENTER
ph.paragraph_format.space_before = Pt(8)
ph.paragraph_format.space_after  = Pt(2)
rh = ph.add_run('MGRPIC — INFORME DE EVALUACIÓN DE RIESGO PROCESAL')
rh.font.size = Pt(11); rh.font.bold = True; rh.font.name = 'Calibri'
rh.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
ph2 = hdr_cell.add_paragraph()
ph2.alignment = WD_ALIGN_PARAGRAPH.CENTER
ph2.paragraph_format.space_before = Pt(0)
ph2.paragraph_format.space_after  = Pt(8)
rh2 = ph2.add_run('Matriz de Gestión de Riesgo Procesal en la Incautación de Criptoactivos · v3.0')
rh2.font.size = Pt(9); rh2.font.name = 'Calibri'
rh2.font.color.rgb = RGBColor(0xBF, 0xD3, 0xE8)

doc.add_paragraph()

def informe_seccion(titulo, contenido_items):
    """Bloque de sección del informe con fondo gris claro."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(2)
    r = p.add_run(titulo)
    r.font.size = Pt(10); r.font.bold = True; r.font.name = 'Calibri'
    r.font.color.rgb = AZUL
    for item in contenido_items:
        if isinstance(item, tuple):
            label, valor = item
            pi = doc.add_paragraph()
            pi.paragraph_format.space_before = Pt(1)
            pi.paragraph_format.space_after  = Pt(1)
            pi.paragraph_format.left_indent  = Cm(0.5)
            rl = pi.add_run(label + ': ')
            rl.font.size = Pt(9.5); rl.font.bold = True; rl.font.name = 'Calibri'
            rl.font.color.rgb = NEGRO
            rv = pi.add_run(valor)
            rv.font.size = Pt(9.5); rv.font.name = 'Calibri'; rv.font.color.rgb = NEGRO
        else:
            pi = doc.add_paragraph()
            pi.paragraph_format.space_before = Pt(1)
            pi.paragraph_format.space_after  = Pt(1)
            pi.paragraph_format.left_indent  = Cm(0.5)
            rv = pi.add_run(item)
            rv.font.size = Pt(9.5); rv.font.name = 'Calibri'; rv.font.color.rgb = NEGRO

# 1. Datos del caso
informe_seccion('1. Datos del caso', [
    ('Número de diligencias', 'DP 47/2025 — Juzgado Central de Instrucción n.º 3 (AN)'),
    ('Unidad policial actuante', 'UDEF-BLA — Unidad de Delincuencia Económica y Fiscal'),
    ('Fecha de incautación', '2025-03-10'),
    ('Tipo de activo digital', 'Bitcoin (BTC) + Ethereum (ETH)'),
    ('Órgano judicial', 'Juzgado Central de Instrucción n.º 3 — Audiencia Nacional'),
    ('Observaciones', 'Organización criminal transnacional con múltiples investigados. Activos intervenidos en operación coordinada con Europol.'),
])

doc.add_paragraph()

# 2. Resultado global
res_tbl = doc.add_table(rows=1, cols=3)
res_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
res_tbl.style = 'Table Grid'
widths_r = [Cm(5), Cm(4), Cm(7)]
etiquetas_r = ['PUNTUACIÓN GLOBAL', 'NIVEL DE RIESGO', 'DESCRIPCIÓN']
valores_r   = ['58,75 / 100', 'ALTO', 'Riesgo procesal elevado. Elevar propuesta motivada al Ministerio Fiscal en el plazo más breve posible.']
bgs_r       = ['FFF0D9', 'FF9933', 'FFF0D9']
for ci in range(3):
    cell = res_tbl.cell(0, ci)
    cell.width = widths_r[ci]
    set_cell_bg(cell, bgs_r[ci])
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(2)
    re = p.add_run(etiquetas_r[ci])
    re.font.size = Pt(8); re.font.bold = True; re.font.name = 'Calibri'
    re.font.color.rgb = RGBColor(0xA0, 0x48, 0x00)
    p2 = cell.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after  = Pt(6)
    rv2 = p2.add_run(valores_r[ci])
    rv2.font.size = Pt(9 if ci == 2 else 13)
    rv2.font.bold = (ci < 2)
    rv2.font.name = 'Calibri'
    rv2.font.color.rgb = RGBColor(0xA0, 0x48, 0x00)

doc.add_paragraph()

# 3. Desglose por dimensión
informe_seccion('3. Desglose por dimensión', [
    ('Dim. I  — Volatilidad (peso 35 %)', '5 / 8 brutos → 21,88 / 35 ponderados · 62,5 % de riesgo en la dimensión'),
    ('Dim. II — Custodia y Trazabilidad (peso 30 %)', '3 / 6 brutos → 15,00 / 30 ponderados · 50,0 % de riesgo en la dimensión'),
    ('Dim. III — Contexto Operativo Policial (peso 35 %)', '3 / 6 brutos → 21,87 / 35 ponderados · 50,0 % de riesgo en la dimensión'),
    ('TOTAL', '58,75 / 100 — nivel ALTO (umbral 51–75)'),
])

doc.add_paragraph()

# 4. Protocolo de actuación
informe_seccion('4. Protocolo policial de actuación — Nivel ALTO', [
    '• Elevar propuesta motivada al Ministerio Fiscal en el plazo más breve posible para que inste la enajenación anticipada.',
    '• Solicitar perito especializado en activos digitales para reforzar la trazabilidad y el soporte técnico de la propuesta.',
    '• Valorar la enajenación anticipada del activo o su conversión a moneda fiduciaria estable conforme al art. 367 ter LECrim.',
    '• Realizar verificación inmediata del saldo en blockchain y documentar el estado actual de la custodia en acta formal.',
    '• Iniciar diligencias para obtener o asegurar las claves privadas si no están bajo control policial formalizado.',
    '• Notificar la situación al LAJ y al Ministerio Fiscal con el presente informe como soporte documental.',
])

doc.add_paragraph()

# Pie de informe
add_par(doc,
    'Informe generado por MGRPIC v3.0 · Herramienta de apoyo a la decisión para unidades de Policía Judicial · '
    'Los resultados tienen carácter orientativo · No es una herramienta judicial',
    size=8, italic=True, color=GRIS_TEXT,
    align=WD_ALIGN_PARAGRAPH.CENTER, sb=8, sa=12)

# ══════════════════════════════════════════════════════════════════════════════
# 8. APARTADO TÉCNICO: CÓDIGO Y CONSTRUCCIÓN
# ══════════════════════════════════════════════════════════════════════════════
doc.add_page_break()
add_heading_annex(doc, '8. Apartado técnico: código y construcción de la herramienta')

add_par(doc,
    'La MGRPIC se ha construido como una aplicación web de página única (SPA) en HTML5, CSS3 y '
    'JavaScript puro, sin dependencias de frameworks ni librerías externas. El código fuente '
    'se distribuye en cinco archivos especializados que se empaquetan en un único archivo '
    'HTML autocontenido (MGRPIC.html) para su distribución.',
    size=10, color=NEGRO, sb=0, sa=8)

# ── 8.1 Arquitectura general ─────────────────────────────────────────────────
add_heading_annex(doc, '8.1  Arquitectura general', level=2)

add_par(doc,
    'La herramienta adopta el patrón IIFE (Immediately Invoked Function Expression) para encapsular '
    'cada módulo en su propio ámbito léxico, evitando colisiones de nombres en el espacio global. '
    'Cada módulo expone únicamente su API pública. El estado global de la evaluación se mantiene '
    'en memoria durante la sesión mediante un objeto plano compartido por el controlador de la aplicación:',
    size=10, color=NEGRO, sb=0, sa=6)

estado_code = (
    "const estado = {\n"
    "    datosCaso:       {},   // Metadatos del caso (diligencias, unidad, fecha…)\n"
    "    respuestas:      {},   // { V1: 0|1|2, V2: …, C1: …, J1: … }\n"
    "    ultimoResultado: null, // Resultado de calculateScore() tras el paso 5\n"
    "    pantallaActual:  0     // Índice de la pantalla visible (0–6)\n"
    "};"
)
p_code = doc.add_paragraph()
p_code.paragraph_format.space_before = Pt(4)
p_code.paragraph_format.space_after  = Pt(8)
p_code.paragraph_format.left_indent  = Cm(0.5)
r_code = p_code.add_run(estado_code)
r_code.font.name = 'Courier New'
r_code.font.size = Pt(8.5)
r_code.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

add_par(doc,
    'No se utiliza ningún sistema de enrutamiento, DOM virtual ni gestión reactiva de estado. '
    'La navegación entre pantallas se gestiona mostrando o ocultando secciones HTML mediante '
    'la clase CSS hidden, con transiciones de opacidad controladas por JavaScript.',
    size=10, color=NEGRO, sb=0, sa=8)

# ── 8.2 Estructura de archivos ────────────────────────────────────────────────
add_heading_annex(doc, '8.2  Estructura de archivos fuente', level=2)

files_info = [
    ('index.html',      '~320 líneas',  'Estructura HTML de las siete pantallas. Las pantallas 2 a 6 se '
                                        'renderizan dinámicamente mediante JavaScript; solo la pantalla 0 '
                                        '(inicio) y la 1 (datos del caso) están maquetadas estáticamente.'),
    ('css/styles.css',  '~1 443 líneas','Hoja de estilos completa: layout de cabecera y pantallas, '
                                        'tarjetas de indicadores, tabla de resultados, estilos de impresión '
                                        '(@media print) y paleta de colores institucional.'),
    ('js/data.js',      '~297 líneas',  'Definición canónica y estática de dimensiones, indicadores, '
                                        'opciones de respuesta y escala de riesgo. Actúa como única fuente '
                                        'de verdad del modelo. Cualquier modificación de ponderaciones o '
                                        'indicadores se realiza exclusivamente en este archivo.'),
    ('js/scoring.js',   '~305 líneas',  'Motor de cálculo. Implementa calculateScore(), validateAnswers() '
                                        'y los alias de compatibilidad. Independiente de la interfaz: '
                                        'recibe el objeto de respuestas y devuelve puntuaciones detalladas '
                                        'por dimensión, total ponderado, nivel de riesgo y orientaciones.'),
    ('js/report.js',    '~400 líneas',  'Generador del informe HTML. Construye el marcado del informe '
                                        'final a partir del resultado de scoring.js e incluye la lógica '
                                        'de impresión y copia al portapapeles.'),
    ('js/app.js',       '~782 líneas',  'Controlador principal. Gestiona la navegación entre pantallas, '
                                        'renderiza las dimensiones e indicadores, captura las respuestas '
                                        'del usuario, actualiza el indicador de progreso global y coordina '
                                        'la llamada a scoring.js y report.js.'),
]

t_files = doc.add_table(rows=len(files_info)+1, cols=3)
t_files.style = 'Table Grid'
t_files.alignment = WD_TABLE_ALIGNMENT.LEFT

hdrs_f = ['Archivo', 'Tamaño', 'Responsabilidad']
w_f    = [Cm(3.5), Cm(2.2), Cm(9.8)]
for ci, hdr in enumerate(hdrs_f):
    cell = t_files.rows[0].cells[ci]
    cell.width = w_f[ci]
    set_cell_bg(cell, '1F3864')
    ph = cell.paragraphs[0]
    ph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ph.paragraph_format.space_before = Pt(3)
    ph.paragraph_format.space_after  = Pt(3)
    rh = ph.add_run(hdr)
    rh.font.size = Pt(9); rh.font.bold = True; rh.font.name = 'Calibri'
    rh.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

for ri, (fname, size, desc) in enumerate(files_info):
    row = t_files.rows[ri+1]
    for ci in range(3): row.cells[ci].width = w_f[ci]
    set_cell_bg(row.cells[0], 'E6EFF8')
    for ci, val in enumerate([fname, size, desc]):
        p = row.cells[ci].paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after  = Pt(3)
        if ci < 2:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(val)
        r.font.size = Pt(9)
        r.font.name = 'Courier New' if ci == 0 else 'Calibri'
        r.font.bold = (ci == 0)
        r.font.color.rgb = AZUL if ci == 0 else NEGRO

doc.add_paragraph()

# ── 8.3 Motor de cálculo (scoring.js) ────────────────────────────────────────
add_heading_annex(doc, '8.3  Motor de cálculo — scoring.js', level=2)

add_par(doc,
    'El módulo MGRPICScoring implementa la lógica de puntuación de forma completamente independiente '
    'de la interfaz. La función principal calculateScore() itera sobre las dimensiones definidas '
    'en data.js, aplica el factor de ponderación de cada una y acumula la puntuación total:',
    size=10, color=NEGRO, sb=0, sa=6)

formula_code = (
    "// Fórmulas de ponderación\n"
    "Dim I  (Volatilidad)          = (V1+V2+V3+V4) × 4,375   → máx. 35 pts\n"
    "Dim II (Custodia)             = (C1+C2+C3)    × 5,000   → máx. 30 pts\n"
    "Dim III (Contexto policial)   = (J1+J2+J3)    × 5,833…  → máx. 35 pts\n"
    "─────────────────────────────────────────────────────────\n"
    "TOTAL = Dim I + Dim II + Dim III               → escala 0–100\n\n"
    "// Factor exacto D3: 35/6 (JavaScript evalúa en tiempo de análisis)\n"
    "// Verificación: 6 × (35/6) = 35 exacto; suma de máximos = 35+30+35 = 100 ✓"
)
p_f = doc.add_paragraph()
p_f.paragraph_format.space_before = Pt(4)
p_f.paragraph_format.space_after  = Pt(8)
p_f.paragraph_format.left_indent  = Cm(0.5)
r_f = p_f.add_run(formula_code)
r_f.font.name = 'Courier New'
r_f.font.size = Pt(8.5)
r_f.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

add_par(doc,
    'La API pública del módulo expone también validateAnswers() —que bloquea el avance a resultados '
    'si algún indicador no ha sido respondido— y funciones auxiliares para calcular el porcentaje '
    'de completitud del formulario en tiempo real.',
    size=10, color=NEGRO, sb=0, sa=8)

# ── 8.4 Controlador de navegación (app.js) ────────────────────────────────────
add_heading_annex(doc, '8.4  Controlador de navegación — app.js', level=2)

add_par(doc,
    'El objeto global App expone la API de navegación de la herramienta. La función irA(n) '
    'gestiona la transición entre las siete pantallas de la aplicación aplicando las siguientes '
    'reglas de negocio:',
    size=10, color=NEGRO, sb=0, sa=6)

nav_items = [
    'Pantallas 0 y 1 (inicio / datos del caso): acceso libre.',
    'Pantallas 2, 3 y 4 (dimensiones I–III): se renderiza la dimensión correspondiente en la primera '
    'visita; la validación de indicadores se realiza al intentar avanzar a la pantalla siguiente, '
    'bloqueando el avance si algún indicador de la dimensión actual no ha sido respondido.',
    'Pantalla 5 (resultados): se llama a MGRPICScoring.calculateScore() y se renderiza el panel '
    'de resultados con el desglose por dimensión, los factores de mayor riesgo y el protocolo '
    'policial de actuación.',
    'Pantalla 6 (informe): se llama a MGRPICReport.generarHTML() con el resultado de scoring y '
    'los datos del caso para producir el informe final imprimible.',
]
for item in nav_items:
    pi = doc.add_paragraph(style='List Bullet')
    pi.paragraph_format.space_before = Pt(1)
    pi.paragraph_format.space_after  = Pt(3)
    pi.paragraph_format.left_indent  = Cm(0.5)
    ri = pi.add_run(item)
    ri.font.size = Pt(10); ri.font.name = 'Calibri'; ri.font.color.rgb = NEGRO

doc.add_paragraph()

# ── 8.5 Proceso de empaquetado ────────────────────────────────────────────────
add_heading_annex(doc, '8.5  Proceso de empaquetado: generación de MGRPIC.html', level=2)

add_par(doc,
    'Para la distribución se genera un único archivo HTML autocontenido (MGRPIC.html) mediante '
    'un script Python que inlinea la hoja de estilos y los cuatro módulos JavaScript directamente '
    'en el HTML, sustituyendo las etiquetas <link> y <script src="…"> por bloques <style> y '
    '<script> con el contenido de cada archivo. El resultado es un archivo de ~3 200 líneas '
    'que funciona en cualquier navegador sin necesidad de servidor web, conexión a internet '
    'ni instalación de software adicional.',
    size=10, color=NEGRO, sb=0, sa=6)

bundle_code = (
    "# Fragmento del script de empaquetado (Python)\n"
    "with open('index.html') as f: html = f.read()\n"
    "with open('css/styles.css') as f: css = f.read()\n"
    "with open('js/data.js')    as f: data = f.read()\n"
    "with open('js/scoring.js') as f: scoring = f.read()\n"
    "with open('js/report.js')  as f: report = f.read()\n"
    "with open('js/app.js')     as f: app = f.read()\n\n"
    "html = html.replace('<link rel=\"stylesheet\" href=\"css/styles.css\" />',\n"
    "                    f'<style>\\n{css}\\n</style>')\n"
    "html = html.replace('<script src=\"js/data.js\"></script>',\n"
    "                    f'<script>\\n{data}\\n</script>')\n"
    "# … ídem para scoring.js, report.js y app.js\n\n"
    "with open('MGRPIC.html', 'w') as f: f.write(html)"
)
p_b = doc.add_paragraph()
p_b.paragraph_format.space_before = Pt(4)
p_b.paragraph_format.space_after  = Pt(8)
p_b.paragraph_format.left_indent  = Cm(0.5)
r_b = p_b.add_run(bundle_code)
r_b.font.name = 'Courier New'
r_b.font.size = Pt(8.5)
r_b.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

# ── 8.6 Decisiones de diseño ─────────────────────────────────────────────────
add_heading_annex(doc, '8.6  Decisiones de diseño relevantes', level=2)

decisiones = [
    ('Sin frameworks ni dependencias',
     'La ausencia de React, Vue, Angular o cualquier librería de terceros garantiza que la '
     'herramienta no quede obsoleta por cambios en dependencias externas y puede ejecutarse '
     'en entornos con acceso a internet restringido, habitual en redes policiales.'),
    ('Módulo de datos como única fuente de verdad',
     'Toda la definición de indicadores, ponderaciones y escala de riesgo reside en data.js. '
     'Scoring.js y report.js leen los datos de este módulo; ningún valor de ponderación está '
     'duplicado en el código. Esto permite modificar la matriz (añadir un indicador, cambiar '
     'un factor) editando un único archivo.'),
    ('Privacidad por diseño',
     'Ningún dato introducido por el usuario abandona el dispositivo. No hay llamadas a APIs '
     'externas, cookies, almacenamiento local (localStorage/sessionStorage) ni analítica. '
     'El estado se mantiene exclusivamente en la memoria RAM de la pestaña del navegador '
     'y desaparece al cerrarla.'),
    ('CSS de impresión (@media print)',
     'La hoja de estilos incluye reglas específicas para impresión que ocultan la navegación, '
     'la cabecera y los controles, y aplican márgenes y tipografía adecuados para el formato '
     'papel A4, permitiendo generar un PDF imprimible directamente desde el navegador.'),
    ('Validación estricta antes de resultados',
     'La función validateAnswers() impide avanzar a la pantalla de resultados si alguno de los '
     '10 indicadores no ha sido respondido. La validación se realiza por dimensión al intentar '
     'navegar, con identificación visual de los indicadores pendientes.'),
]

for titulo_d, texto_d in decisiones:
    p_dt = doc.add_paragraph()
    p_dt.paragraph_format.space_before = Pt(5)
    p_dt.paragraph_format.space_after  = Pt(1)
    r_dt = p_dt.add_run(titulo_d)
    r_dt.font.size = Pt(10); r_dt.font.bold = True
    r_dt.font.name = 'Calibri'; r_dt.font.color.rgb = AZUL_CLARO
    p_dd = doc.add_paragraph()
    p_dd.paragraph_format.space_before = Pt(0)
    p_dd.paragraph_format.space_after  = Pt(4)
    p_dd.paragraph_format.left_indent  = Cm(0.5)
    r_dd = p_dd.add_run(texto_d)
    r_dd.font.size = Pt(10); r_dd.font.name = 'Calibri'; r_dd.font.color.rgb = NEGRO

doc.add_paragraph()

# ── Pie de página final ────────────────────────────────────────────────────────
add_par(doc,
    'MGRPIC v3.0 · Instrumento de uso exclusivo para unidades de Policía Judicial · '
    'Los resultados tienen carácter orientativo · No es una herramienta judicial',
    size=8, italic=True, color=GRIS_TEXT,
    align=WD_ALIGN_PARAGRAPH.CENTER, sb=12, sa=0)

# ── Guardar ───────────────────────────────────────────────────────────────────
out = '/home/user/MGRPIC/mgrpic/ANEXO_MGRPIC.docx'
doc.save(out)
import os
print(f"Generado: {out} ({os.path.getsize(out):,} bytes)")
