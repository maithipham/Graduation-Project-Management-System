export interface ParsedAdvisorExcelRow {
  rowNumber: number
  teacherCode: string
  name: string
  academicTitle?: string
  email: string
  organization?: string
  department?: string
  quota: number | null
  maxStudents?: number | null
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function colIndexToLetter(idx: number): string {
  let letter = ''
  let temp = idx
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter
    temp = Math.floor(temp / 26) - 1
  }
  return letter
}

/**
 * Giải nén file Excel (.xlsx) thuần bằng Web APIs (DecompressionStream + DOMParser)
 * để đọc trực tiếp các dòng trong sheet đầu tiên mà không phụ thuộc thư viện ngoài.
 */
export async function parseAdvisorExcelFile(
  file: File | Blob,
): Promise<ParsedAdvisorExcelRow[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

    // 1. Tìm End of Central Directory Record (EOCD)
    let eocdOffset = -1
    for (let i = bytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) {
        eocdOffset = i
        break
      }
    }
    if (eocdOffset === -1) return []

    const cdCount = view.getUint16(eocdOffset + 10, true)
    const cdOffset = view.getUint32(eocdOffset + 16, true)

    // 2. Đọc danh mục tệp trong Central Directory
    const entries = new Map<
      string,
      { compression: number; compSize: number; localHeaderOffset: number }
    >()
    let ptr = cdOffset

    for (let i = 0; i < cdCount; i++) {
      if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) break
      const compression = view.getUint16(ptr + 10, true)
      const compSize = view.getUint32(ptr + 20, true)
      const nameLen = view.getUint16(ptr + 28, true)
      const extraLen = view.getUint16(ptr + 30, true)
      const commentLen = view.getUint16(ptr + 32, true)
      const localHeaderOffset = view.getUint32(ptr + 42, true)

      const nameBytes = bytes.subarray(ptr + 46, ptr + 46 + nameLen)
      const fileName = new TextDecoder().decode(nameBytes).replace(/\\/g, '/')
      entries.set(fileName.toLowerCase(), {
        compression,
        compSize,
        localHeaderOffset,
      })

      ptr += 46 + nameLen + extraLen + commentLen
    }

    // Hàm đọc nội dung text của 1 entry trong zip
    async function readZipText(fileNameTarget: string): Promise<string> {
      const entryKey = Array.from(entries.keys()).find((k) =>
        k.endsWith(fileNameTarget.toLowerCase()),
      )
      if (!entryKey) return ''
      const entry = entries.get(entryKey)
      if (!entry) return ''

      const lhPtr = entry.localHeaderOffset
      if (lhPtr + 30 > bytes.length || view.getUint32(lhPtr, true) !== 0x04034b50) return ''
      const lhNameLen = view.getUint16(lhPtr + 26, true)
      const lhExtraLen = view.getUint16(lhPtr + 28, true)
      const dataStart = lhPtr + 30 + lhNameLen + lhExtraLen
      if (dataStart + entry.compSize > bytes.length) return ''

      if (entry.compression === 0) {
        return new TextDecoder().decode(bytes.subarray(dataStart, dataStart + entry.compSize))
      }
      if (entry.compression === 8) {
        // Tạo slice buffer sạch (byteOffset = 0) để tương thích tuyệt đối với DecompressionStream
        const cleanChunk = new Uint8Array(bytes.buffer.slice(dataStart, dataStart + entry.compSize))
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw')
          const blob = new Blob([cleanChunk])
          const decompressedStream = blob.stream().pipeThrough(ds)
          const res = new Response(decompressedStream)
          return await res.text()
        }
      }
      return ''
    }

    // 3. Đọc Shared Strings
    const sstXml = await readZipText('sharedstrings.xml')
    const sharedStrings: string[] = []

    if (sstXml) {
      if (typeof DOMParser !== 'undefined') {
        try {
          const sstDoc = new DOMParser().parseFromString(sstXml, 'text/xml')
          const siNodes = sstDoc.getElementsByTagName('si')
          for (let i = 0; i < siNodes.length; i++) {
            sharedStrings.push(siNodes[i].textContent || '')
          }
        } catch {
          // Fallback to regex nếu DOMParser lỗi
        }
      }

      if (sharedStrings.length === 0) {
        const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi
        let match: RegExpExecArray | null
        while ((match = siRegex.exec(sstXml)) !== null) {
          const inner = match[1]
          const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/gi
          let tMatch: RegExpExecArray | null
          let str = ''
          while ((tMatch = tRegex.exec(inner)) !== null) {
            str += tMatch[1]
          }
          sharedStrings.push(decodeXmlEntities(str))
        }
      }
    }

    // 4. Đọc Sheet XML
    let sheetXml = await readZipText('sheet1.xml')
    if (!sheetXml) {
      const sheetKey = Array.from(entries.keys()).find(
        (k) => k.includes('worksheets') && k.endsWith('.xml'),
      )
      if (sheetKey) sheetXml = await readZipText(sheetKey)
    }
    if (!sheetXml) return []

    // 5. Trích xuất các dòng dữ liệu dạng bảng (mỗi dòng là Record<ColLetter, string>)
    const rawRowsMap = new Map<number, Record<string, string>>()

    if (typeof DOMParser !== 'undefined') {
      try {
        const sheetDoc = new DOMParser().parseFromString(sheetXml, 'text/xml')
        const rowNodes = sheetDoc.getElementsByTagName('row')

        for (let rIdx = 0; rIdx < rowNodes.length; rIdx++) {
          const rowNode = rowNodes[rIdx]
          const rAttr = rowNode.getAttribute('r')
          const rowNum = rAttr ? parseInt(rAttr, 10) : rIdx + 1

          const cellNodes = rowNode.getElementsByTagName('c')
          const cells: Record<string, string> = {}

          for (let cIdx = 0; cIdx < cellNodes.length; cIdx++) {
            const cell = cellNodes[cIdx]
            const cellRef = cell.getAttribute('r') || ''
            const colLetter = cellRef
              ? cellRef.replace(/[0-9]/g, '').toUpperCase()
              : colIndexToLetter(cIdx)
            const type = cell.getAttribute('t')

            let cellVal = ''
            if (type === 'inlineStr') {
              const isNode = cell.getElementsByTagName('is')[0]
              cellVal = isNode?.textContent || ''
            } else if (type === 's') {
              const vNode = cell.getElementsByTagName('v')[0]
              const sIndex = parseInt(vNode?.textContent || '', 10)
              cellVal =
                !isNaN(sIndex) && sharedStrings[sIndex] !== undefined
                  ? sharedStrings[sIndex]
                  : ''
            } else {
              const vNode = cell.getElementsByTagName('v')[0]
              cellVal = vNode?.textContent || ''
            }

            cells[colLetter] = decodeXmlEntities(cellVal.trim())
          }

          rawRowsMap.set(rowNum, cells)
        }
      } catch {
        // Fallback to regex nếu DOMParser lỗi
      }
    }

    // Fallback Regex nếu DOMParser không khả dụng
    if (rawRowsMap.size === 0) {
      const rowRegex = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/gi
      let rowMatch: RegExpExecArray | null

      while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
        const rowNum = parseInt(rowMatch[1], 10)
        const rowContent = rowMatch[2]
        const cells: Record<string, string> = {}

        const cellTagRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi
        let cMatch: RegExpExecArray | null

        while ((cMatch = cellTagRegex.exec(rowContent)) !== null) {
          const attrs = cMatch[1]
          const inner = cMatch[2]

          const rM = /r="([A-Z]+)\d+"/i.exec(attrs)
          const colLetter = rM ? rM[1].toUpperCase() : 'A'

          const tM = /t="([a-zA-Z]+)"/i.exec(attrs)
          const type = tM ? tM[1] : ''

          let cellVal = ''
          if (type === 's') {
            const vM = /<v>([\s\S]*?)<\/v>/i.exec(inner)
            if (vM) {
              const idx = parseInt(vM[1], 10)
              cellVal = sharedStrings[idx] ?? ''
            }
          } else if (type === 'inlineStr') {
            const isM = /<is>[\s\S]*?<t\b[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/i.exec(inner)
            if (isM) cellVal = isM[1]
          } else {
            const vM = /<v>([\s\S]*?)<\/v>/i.exec(inner)
            if (vM) cellVal = vM[1]
          }

          cells[colLetter] = decodeXmlEntities(cellVal.trim())
        }

        rawRowsMap.set(rowNum, cells)
      }
    }

    // 6. Nhận diện ánh xạ cột tự động từ dòng tiêu đề (Dòng 1)
    const headerCells = rawRowsMap.get(1) || {}
    let colTeacherCode = ''
    let colName = ''
    let colLastNamePrefix = ''
    let colFirstName = ''
    let colEmail = ''
    let colQuota = ''
    let colOrg = ''
    let colDept = ''

    for (const [col, val] of Object.entries(headerCells)) {
      const h = val.toLowerCase().trim()
      if (h.includes('mã') || h.includes('code') || h.includes('id')) {
        colTeacherCode = col
      } else if (h.includes('họ và tên') || h.includes('họ tên') || h.includes('giảng viên') || h.includes('tên gv')) {
        colName = col
      } else if (h.includes('họ và tên đệm') || h.includes('họ đệm') || h.includes('họ')) {
        colLastNamePrefix = col
      } else if (h === 'tên' || h.includes('tên')) {
        colFirstName = col
      } else if (h.includes('email') || h.includes('mail')) {
        colEmail = col
      } else if (h.includes('hạn mức') || h.includes('tối đa') || h.includes('số lượng sv') || h.includes('quota') || h.includes('max')) {
        colQuota = col
      } else if (h.includes('đơn vị') || h.includes('cơ quan') || h.includes('trường') || h.includes('nơi công tác')) {
        colOrg = col
      } else if (h.includes('bộ môn') || h.includes('ngành') || h.includes('khoa')) {
        colDept = col
      }
    }

    // Ánh xạ mặc định nếu tiêu đề không nhận diện được
    if (!colEmail) colEmail = 'D'
    if (!colName && !colLastNamePrefix) colName = 'C'
    if (!colTeacherCode) colTeacherCode = 'B'
    if (!colQuota) colQuota = 'E'

    // 7. Tạo danh sách các dòng dữ liệu GVHD
    const parsedRows: ParsedAdvisorExcelRow[] = []

    const sortedRowNums = Array.from(rawRowsMap.keys()).sort((a, b) => a - b)

    for (const rowNum of sortedRowNums) {
      if (rowNum <= 1) continue // Bỏ qua dòng tiêu đề

      const cells = rawRowsMap.get(rowNum) || {}

      let teacherCode = (colTeacherCode ? cells[colTeacherCode] : '') || ''
      let name = (colName ? cells[colName] : '') || ''
      if (!name && colLastNamePrefix && colFirstName) {
        name = `${cells[colLastNamePrefix] || ''} ${cells[colFirstName] || ''}`.trim()
      }
      let email = (colEmail ? cells[colEmail] : '') || ''
      let rawQuota = (colQuota ? cells[colQuota] : '') || ''
      let organization = (colOrg ? cells[colOrg] : '') || ''
      let department = (colDept ? cells[colDept] : '') || ''

      // Quét thông minh qua tất cả các ô trong dòng để bổ sung nếu thiếu
      const cellValues = Object.values(cells)
      if (!email || !email.includes('@')) {
        const foundEmail = cellValues.find((v) => /\S+@\S+\.\S+/.test(v))
        if (foundEmail) email = foundEmail
      }

      // Nhận diện mã GV nếu chưa có (mẫu GV..., CB... hoặc chuỗi mã)
      if (!teacherCode) {
        const foundCode = cellValues.find((v) => /^(GV|CB)\d+/i.test(v))
        if (foundCode) teacherCode = foundCode
      }

      // Nhận diện hạn mức số lượng SV
      let quota: number | null = null
      const parsedQ = parseInt(rawQuota, 10)
      if (!isNaN(parsedQ) && parsedQ > 0) {
        quota = parsedQ
      } else {
        const foundNum = cellValues.find((v) => /^\d{1,2}$/.test(v) && parseInt(v, 10) > 0 && parseInt(v, 10) <= 50)
        if (foundNum) quota = parseInt(foundNum, 10)
      }

      // Tách học vị / học hàm nếu có trong họ tên (VD: "PGS.TS. Trần Quốc Bảo")
      let title = ''
      const titleMatch = name.match(/^(PGS\.TS\.|GS\.TS\.|TS\.|ThS\.|CN\.|KS\.)\s*/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
        name = name.replace(titleMatch[0], '').trim()
      }

      // Suy đoán đơn vị nếu chưa có
      if (!organization && email) {
        organization = email.toLowerCase().endsWith('@tlu.edu.vn')
          ? 'Trong trường - ĐH Thủy Lợi'
          : 'Ngoài trường'
      }

      if (email || name || teacherCode) {
        parsedRows.push({
          rowNumber: rowNum,
          teacherCode,
          name,
          academicTitle: title,
          email,
          organization,
          department,
          quota,
          maxStudents: quota,
        })
      }
    }

    return parsedRows
  } catch (err) {
    console.warn('Lỗi phân tích file Excel tại client:', err)
    return []
  }
}
