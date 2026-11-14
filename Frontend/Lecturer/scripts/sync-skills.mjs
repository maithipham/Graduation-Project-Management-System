// Đồng bộ skill cho AI agent:
//   bản gốc  .agents/skills/  (Antigravity đọc — chỉ sửa ở đây)
//   bản sao  .claude/skills/  (Claude Code đọc — do script này sinh ra, không sửa tay)
//
// Dùng:  npm run sync-skills            → copy bản gốc sang bản sao
//        node scripts/sync-skills.mjs --check → chỉ kiểm tra, lệch thì báo lỗi (exit 1)
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { diffSkillDirs } from './skills-diff.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, '.agents', 'skills')
const target = join(root, '.claude', 'skills')

if (!existsSync(source)) {
  console.error(`Không tìm thấy thư mục skill gốc: ${source}`)
  process.exit(1)
}

if (process.argv.includes('--check')) {
  const problems = diffSkillDirs(source, target)
  if (problems.length > 0) {
    console.error('Skill của Claude (.claude/skills) đang lệch bản gốc (.agents/skills):')
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('Chạy: npm run sync-skills')
    process.exit(1)
  }
  console.log('Skill đã đồng bộ.')
} else {
  rmSync(target, { recursive: true, force: true })
  cpSync(source, target, { recursive: true })
  console.log('Đã đồng bộ .agents/skills → .claude/skills')
}
