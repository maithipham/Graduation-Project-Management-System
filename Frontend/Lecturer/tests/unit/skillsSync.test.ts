/// <reference types="node" />
// Test này đọc file trên đĩa nên cần kiểu của Node (tsconfig của app chỉ khai báo kiểu cho trình duyệt)
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { diffSkillDirs } from '../../scripts/skills-diff.mjs'

const root = process.cwd()
const source = join(root, '.agents', 'skills')
const target = join(root, '.claude', 'skills')

describe('Skill cho AI agent', () => {
  it('bản của Claude (.claude/skills) giống bản gốc (.agents/skills) — lệch thì chạy npm run sync-skills', () => {
    expect(diffSkillDirs(source, target)).toEqual([])
  })

  it('mỗi skill có SKILL.md với name trùng tên thư mục và có description', () => {
    const skills = readdirSync(source, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    expect(skills.length).toBeGreaterThan(0)

    for (const skill of skills) {
      const content = readFileSync(join(source, skill.name, 'SKILL.md'), 'utf8').replaceAll('\r\n', '\n')
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
      expect(frontmatter, skill.name).toMatch(new RegExp(`^name: ${skill.name}$`, 'm'))
      expect(frontmatter, skill.name).toMatch(/^description: .{20,}/m)
    }
  })
})
