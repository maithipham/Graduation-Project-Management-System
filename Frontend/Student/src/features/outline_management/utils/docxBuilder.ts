import type {
  DocxBlock,
  OutlineEditorData,
  SignSideBlock,
  StudentOutlineMeta,
} from '../types/outline.types'
import { OUTLINE_SECTIONS } from '../services/outline.service'

const TEXT_WIDTH = 9071 // dxa (A4 - lề trái 1701 - lề phải 1134)

const encodeUtf8 = (s: string): Uint8Array => new TextEncoder().encode(s)

function stripXmlControlChars(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    if (
      (code >= 0x00 && code <= 0x08) ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f)
    ) {
      continue
    }
    out += text[i]
  }
  return out
}

function escapeXml(value: string | null | undefined): string {
  return stripXmlControlChars(String(value ?? ''))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface RunOptions {
  bold?: boolean
  italic?: boolean
  size?: number
  jc?: string
}

interface ParaOptions {
  before?: number
  after?: number
  indent?: number
  jc?: string
}

function xmlRun(text: string, opts: RunOptions = {}): string {
  let rpr = ''
  if (opts.bold) rpr += '<w:b/>'
  if (opts.italic) rpr += '<w:i/>'
  if (opts.size) rpr += `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`
  return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
}

function xmlPara(runs: string, opts: ParaOptions = {}): string {
  const spacing = `<w:spacing w:before="${opts.before ?? 0}" w:after="${opts.after == null ? 120 : opts.after}" w:line="312" w:lineRule="auto"/>`
  const ind = opts.indent ? `<w:ind w:firstLine="${opts.indent}"/>` : ''
  const jc = opts.jc ? `<w:jc w:val="${opts.jc}"/>` : ''
  return `<w:p><w:pPr>${spacing}${ind}${jc}</w:pPr>${runs}</w:p>`
}

function splitLines(text: string | null | undefined): string[] {
  const arr = String(text ?? '').split(/\r?\n/)
  return arr.length ? arr : ['']
}

const BORDER = (name: string) =>
  `<w:${name} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`

const TBL_BORDERS =
  '<w:tblBorders>' +
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(BORDER).join('') +
  '</w:tblBorders>'

const NO_BORDERS =
  '<w:tblBorders>' +
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map((n) => `<w:${n} w:val="nil"/>`)
    .join('') +
  '</w:tblBorders>'

function xmlCell(width: number, content: string, shade?: string): string {
  const shd = shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ''
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shd}</w:tcPr>${content}</w:tc>`
}

function xmlCellParas(text: string, opts: RunOptions = {}): string {
  return splitLines(text)
    .map((ln) => xmlPara(xmlRun(ln, opts), { after: 40, jc: opts.jc }))
    .join('')
}

function xmlTable(block: Extract<DocxBlock, { t: 'table' }>): string {
  const cols = block.head.length || (block.rows[0]?.length ?? 1)
  const rawWidths =
    block.widths.length === cols ? block.widths.slice() : Array<number>(cols).fill(1)
  const sum = rawWidths.reduce((acc, cur) => acc + cur, 0)
  const widths = rawWidths.map((w) => Math.floor((w / sum) * TEXT_WIDTH))

  const grid =
    '<w:tblGrid>' + widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('') + '</w:tblGrid>'
  let xml = `<w:tbl><w:tblPr><w:tblW w:w="${TEXT_WIDTH}" w:type="dxa"/>${TBL_BORDERS}<w:tblLayout w:type="fixed"/></w:tblPr>${grid}`

  if (block.head.length > 0) {
    xml +=
      '<w:tr>' +
      block.head
        .map((h, i) =>
          xmlCell(widths[i], xmlCellParas(h, { bold: true, jc: 'center' }), 'E7E6E6'),
        )
        .join('') +
      '</w:tr>'
  }

  block.rows.forEach((row) => {
    xml +=
      '<w:tr>' +
      widths.map((w, i) => xmlCell(w, xmlCellParas(row[i] ?? ''))).join('') +
      '</w:tr>'
  })

  xml += '</w:tbl>'
  return xml + xmlPara('', { after: 120 })
}

function xmlSign(block: Extract<DocxBlock, { t: 'sign' }>): string {
  const half = Math.floor(TEXT_WIDTH / 2)
  const renderSide = (side?: SignSideBlock) => {
    if (!side) return xmlPara('')
    return (
      (side.date ? xmlPara(xmlRun(side.date, { italic: true }), { jc: 'center', after: 40 }) : '') +
      xmlPara(xmlRun(side.title || '', { bold: true }), { jc: 'center', after: 40 }) +
      (side.hint
        ? xmlPara(xmlRun(side.hint, { italic: true, size: 22 }), { jc: 'center', after: 600 })
        : '') +
      (side.name ? xmlPara(xmlRun(side.name, { bold: true }), { jc: 'center', after: 0 }) : '')
    )
  }

  return (
    `<w:tbl><w:tblPr><w:tblW w:w="${TEXT_WIDTH}" w:type="dxa"/>${NO_BORDERS}<w:tblLayout w:type="fixed"/></w:tblPr>` +
    `<w:tblGrid><w:gridCol w:w="${half}"/><w:gridCol w:w="${TEXT_WIDTH - half}"/></w:tblGrid>` +
    `<w:tr>${xmlCell(half, renderSide(block.left))}${xmlCell(TEXT_WIDTH - half, renderSide(block.right))}</w:tr></w:tbl>` +
    xmlPara('', { after: 0 })
  )
}

function blockToXml(block: DocxBlock): string {
  switch (block.t) {
    case 'headerTable':
      // Tên trường, tên khoa, rồi tiêu đề văn bản — căn giữa như phần đầu mẫu đề cương
      return (
        xmlPara(xmlRun(block.university, { bold: true }), { jc: 'center', after: 20 }) +
        xmlPara(xmlRun(block.faculty, { bold: true }), { jc: 'center', after: 120 }) +
        xmlPara(xmlRun(block.title, { bold: true, size: 32 }), { jc: 'center', after: 120 })
      )
    case 'center':
      return splitLines(block.text)
        .map((ln) =>
          xmlPara(xmlRun(ln, { bold: block.bold, italic: block.italic, size: block.size }), {
            jc: 'center',
            after: block.after == null ? 60 : block.after,
          }),
        )
        .join('')
    case 'h':
      return xmlPara(xmlRun(block.text, { bold: true }), { before: 160, after: 80 })
    case 'p':
      return splitLines(block.text)
        .map((ln) =>
          xmlPara(xmlRun(ln), { indent: block.indent === false ? 0 : 567, jc: 'both' }),
        )
        .join('')
    case 'kv':
      return xmlPara(xmlRun(`${block.label}: `, { bold: true }) + xmlRun(block.value), {
        after: 80,
      })
    case 'table':
      return xmlTable(block)
    case 'sign':
      return xmlSign(block)
    case 'blank':
      return xmlPara('', { after: 120 })
  }
}

function buildDocumentXml(blocks: DocxBlock[]): string {
  const body = blocks.map(blockToXml).join('')
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    body +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>' +
    '</w:body></w:document>'
  )
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
  '</Types>'

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>'

const DOC_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>'

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults><w:rPrDefault><w:rPr>' +
  '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>' +
  '<w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN" w:eastAsia="en-US" w:bidi="ar-SA"/>' +
  '</w:rPr></w:rPrDefault></w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  '</w:styles>'

let crcTableCache: Uint32Array | null = null

function crc32(buf: Uint8Array): number {
  if (!crcTableCache) {
    crcTableCache = new Uint32Array(256)
    for (let n = 0; n < 256; n += 1) {
      let c = n
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      crcTableCache[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    crc = crcTableCache[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 26
  const DOS_TIME = 0
  const chunks: Uint8Array[] = []
  const central: { name: Uint8Array; crc: number; size: number; localOffset: number }[] = []
  let offset = 0

  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff]
  const u32 = (v: number) => [
    v & 0xff,
    (v >>> 8) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 24) & 0xff,
  ]
  const pushBytes = (arr: number[]) => {
    const u = Uint8Array.from(arr)
    chunks.push(u)
    offset += u.length
  }

  files.forEach((f) => {
    const name = encodeUtf8(f.name)
    const data = f.data
    const crc = crc32(data)
    const localOffset = offset

    pushBytes([
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(name.length),
      ...u16(0),
    ])
    chunks.push(name)
    offset += name.length
    chunks.push(data)
    offset += data.length

    central.push({ name, crc, size: data.length, localOffset })
  })

  const cdStart = offset
  central.forEach((c) => {
    pushBytes([
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(c.crc),
      ...u32(c.size),
      ...u32(c.size),
      ...u16(c.name.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(c.localOffset),
    ])
    chunks.push(c.name)
    offset += c.name.length
  })

  const cdSize = offset - cdStart
  pushBytes([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(central.length),
    ...u16(central.length),
    ...u32(cdSize),
    ...u32(cdStart),
    ...u16(0),
  ])

  const out = new Uint8Array(offset)
  let pos = 0
  chunks.forEach((c) => {
    out.set(c, pos)
    pos += c.length
  })
  return out
}

export function buildOutlineBlocks(
  data: OutlineEditorData,
  meta: StudentOutlineMeta,
): DocxBlock[] {
  const planRows = (data.plan || [])
    .filter((r) => r.task || r.time || r.result)
    .map((r, i) => [String(i + 1), r.task, r.time, r.result])

  const blocks: DocxBlock[] = [
    {
      t: 'center',
      text: 'TRƯỜNG ĐẠI HỌC THỦY LỢI\nKHOA CÔNG NGHỆ THÔNG TIN',
      bold: true,
      after: 20,
    },
    { t: 'center', text: `Bộ môn ${meta.department || ''}`, italic: true },
    { t: 'blank' },
    { t: 'center', text: 'ĐỀ CƯƠNG ĐỒ ÁN TỐT NGHIỆP', bold: true, size: 32, after: 120 },
    { t: 'blank' },
    { t: 'kv', label: 'Họ và tên sinh viên', value: meta.name || '' },
    { t: 'kv', label: 'Mã số sinh viên', value: meta.mssv || '' },
    { t: 'kv', label: 'Lớp', value: meta.className || '' },
    { t: 'kv', label: 'Giảng viên hướng dẫn', value: meta.mentor || '' },
    { t: 'kv', label: 'Tên đề tài (tiếng Việt)', value: data.topicVi || '' },
  ]

  if (data.topicEn) {
    blocks.push({ t: 'kv', label: 'Tên đề tài (tiếng Anh)', value: data.topicEn })
  }

  OUTLINE_SECTIONS.forEach((s) => {
    const val = (data[s.key] || '').trim()
    if (!val && !s.required) return
    blocks.push({ t: 'h', text: s.title })
    blocks.push({ t: 'p', text: val || '…', indent: s.key !== 'references' })
  })

  blocks.push({ t: 'h', text: '8. Kế hoạch thực hiện' })
  blocks.push({
    t: 'table',
    head: ['TT', 'Công việc', 'Thời gian', 'Kết quả'],
    widths: [1, 6, 2.5, 4],
    rows: planRows.length ? planRows : [['1', '', '', '']],
  })

  blocks.push({ t: 'blank' })
  blocks.push({
    t: 'sign',
    left: { title: 'GIẢNG VIÊN HƯỚNG DẪN', hint: '(Ký, ghi rõ họ tên)', name: '' },
    right: {
      date: 'Hà Nội, ngày ..... tháng ..... năm 20....',
      title: 'SINH VIÊN THỰC HIỆN',
      hint: '(Ký, ghi rõ họ tên)',
      name: meta.name || '',
    },
  })

  return blocks
}

export function downloadOutlineDocx(blocks: DocxBlock[], fileName: string): void {
  const bytes = zipStore([
    { name: '[Content_Types].xml', data: encodeUtf8(CONTENT_TYPES) },
    { name: '_rels/.rels', data: encodeUtf8(ROOT_RELS) },
    { name: 'word/document.xml', data: encodeUtf8(buildDocumentXml(blocks)) },
    { name: 'word/_rels/document.xml.rels', data: encodeUtf8(DOC_RELS) },
    { name: 'word/styles.xml', data: encodeUtf8(STYLES) },
  ])
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const blob = new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || 'De_cuong.docx'
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 500)
}
