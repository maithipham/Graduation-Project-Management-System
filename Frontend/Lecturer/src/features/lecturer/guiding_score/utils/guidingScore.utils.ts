export function formatScoreVi(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'Chưa chấm'
  const str = Number(score).toFixed(1).replace('.', ',')
  return `${str} / 10`
}

