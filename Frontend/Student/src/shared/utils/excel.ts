/**
 * Tiện ích xử lý tệp Excel client-side (Kỹ thuật #20, #21)
 */
export function exportTableToCsv(
  headers: string[],
  rows: (string | number)[][],
  filename: string = 'export.csv',
): void {
  const content = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell).replace(/"/g, '""')
          return `"${str}"`
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
