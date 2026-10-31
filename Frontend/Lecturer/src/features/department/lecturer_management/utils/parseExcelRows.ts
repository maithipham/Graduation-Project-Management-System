export interface ParsedAdvisorExcelRow {
  rowNumber: number
  teacherCode: string
  name: string
  email: string
  quota: number | null
}

/**
 * Giải nén file Excel (.xlsx) thuần bằng Web APIs (DecompressionStream)
 * để đọc trực tiếp các dòng trong sheet đầu tiên mà không cần thêm thư viện ngoài.
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
      if (view.getUint32(ptr, true) !== 0x02014b50) break
      const compression = view.getUint16(ptr + 10, true)
      const compSize = view.getUint32(ptr + 20, true)
      const nameLen = view.getUint16(ptr + 28, true)
      const extraLen = view.getUint16(ptr + 30, true)
      const commentLen = view.getUint16(ptr + 32, true)
      const localHeaderOffset = view.getUint32(ptr + 42, true)

      const nameBytes = bytes.subarray(ptr + 46, ptr + 46 + nameLen)
      const fileName = new TextDecoder().decode(nameBytes)
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
      if (view.getUint32(lhPtr, true) !== 0x04034b50) return ''
      const lhNameLen = view.getUint16(lhPtr + 26, true)
      const lhExtraLen = view.getUint16(lhPtr + 28, true)
      const dataStart = lhPtr + 30 + lhNameLen + lhExtraLen
      const compressed = bytes.subarray(dataStart, dataStart + entry.compSize)

      if (entry.compression === 0) {
        return new TextDecoder().decode(compressed)
      }
      if (entry.compression === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        writer.write(compressed)
        writer.close()
        const res = new Response(ds.readable)
        return await res.text()
      }
      return ''
    }

    // 3. Đọc Shared Strings
    const sstXml = await readZipText('sharedstrings.xml')
    const sharedStrings: string[] = []
    if (sstXml) {
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
        sharedStrings.push(str)
      }
    }

    // 4. Đọc Sheet1
    let sheetXml = await readZipText('sheet1.xml')
    if (!sheetXml) {
      // Thử tìm bất kỳ file sheet nào
      const sheetKey = Array.from(entries.keys()).find(
        (k) => k.includes('worksheets') && k.endsWith('.xml'),
      )
      if (sheetKey) sheetXml = await readZipText(sheetKey)
    }
    if (!sheetXml) return []

    // 5. Trích xuất các dòng dữ liệu
    const parsedRows: ParsedAdvisorExcelRow[] = []
    const rowRegex = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/gi
    let rowMatch: RegExpExecArray | null

    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
      const rowNumber = parseInt(rowMatch[1], 10)
      if (rowNumber <= 1) continue // Bỏ qua dòng tiêu đề

      const rowContent = rowMatch[2]
      const cellRegex =
        /<c\b[^>]*\br="([A-Z]+)\d+"(?:[^>]*\bt="([a-z]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?(?:<is><t>([\s\S]*?)<\/t><\/is>)?<\/c>/gi
      let cellMatch: RegExpExecArray | null
      const cells: Record<string, string> = {}

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const col = cellMatch[1]
        const type = cellMatch[2]
        const rawVal = cellMatch[3] ?? cellMatch[4] ?? ''
        let val = rawVal
        if (type === 's') {
          const idx = parseInt(rawVal, 10)
          val = sharedStrings[idx] ?? ''
        }
        cells[col] = val.trim()
      }

      // Theo quy chuẩn 5 cột: A: STT, B: Mã GV, C: Họ tên, D: Email, E: Hạn mức
      const teacherCode = cells['B'] || ''
      const name = cells['C'] || ''
      const email = cells['D'] || ''
      const rawQuota = cells['E'] || ''
      const quotaNum = parseInt(rawQuota, 10)
      const quota = !isNaN(quotaNum) && quotaNum > 0 ? quotaNum : null

      if (email || name || teacherCode) {
        parsedRows.push({
          rowNumber,
          teacherCode,
          name,
          email,
          quota,
        })
      }
    }

    return parsedRows
  } catch (err) {
    console.warn('Lỗi phân tích file Excel tại client:', err)
    return []
  }
}

