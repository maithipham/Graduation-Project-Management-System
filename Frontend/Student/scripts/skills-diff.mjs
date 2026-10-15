import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

function listFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
    .sort()
}

// Bỏ qua khác biệt xuống dòng CRLF/LF (Git trên Windows tự đổi khi checkout)
function readNormalized(file) {
  return readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
}

/**
 * So sánh 2 thư mục skill. Trả về danh sách khác biệt (rỗng = giống nhau).
 * @param {string} source thư mục gốc (.agents/skills)
 * @param {string} target thư mục bản sao (.claude/skills)
 * @returns {string[]}
 */
export function diffSkillDirs(source, target) {
  const sourceFiles = listFiles(source)
  const targetFiles = new Set(listFiles(target))
  const problems = []

  for (const file of sourceFiles) {
    if (!targetFiles.has(file)) problems.push(`thiếu ${file}`)
    else if (readNormalized(join(source, file)) !== readNormalized(join(target, file)))
      problems.push(`khác nội dung ${file}`)
    targetFiles.delete(file)
  }
  for (const file of targetFiles) problems.push(`thừa ${file} (không có trong bản gốc)`)

  return problems
}
