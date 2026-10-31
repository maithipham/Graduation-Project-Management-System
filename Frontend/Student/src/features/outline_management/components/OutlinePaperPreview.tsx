import React, { Fragment } from 'react'
import type { OutlineEditorData, StudentOutlineMeta } from '../types/outline.types'
import { buildOutlineBlocks } from '../utils/docxBuilder'

interface OutlinePaperPreviewProps {
  data: OutlineEditorData
  meta: StudentOutlineMeta
}

function renderMultiline(text: string): React.ReactNode {
  const parts = String(text || '').split(/\r?\n/)
  return parts.map((line, idx) => (
    <Fragment key={idx}>
      {idx > 0 && <br />}
      {line}
    </Fragment>
  ))
}

export const OutlinePaperPreview: React.FC<OutlinePaperPreviewProps> = ({ data, meta }) => {
  const blocks = buildOutlineBlocks(data, meta)

  return (
    <div
      className="mx-auto bg-white shadow-md border border-slate-200"
      style={{
        maxWidth: '794px',
        minHeight: '600px',
        padding: '44px 52px',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '15px',
        lineHeight: 1.5,
        color: '#111',
      }}
    >
      {blocks.map((b, idx) => {
        switch (b.t) {
          case 'center':
            return (
              <p
                key={idx}
                style={{
                  textAlign: 'center',
                  margin: '0 0 4px',
                  fontWeight: b.bold ? 'bold' : undefined,
                  fontStyle: b.italic ? 'italic' : undefined,
                  fontSize: b.size ? `${b.size / 2 + 1}px` : undefined,
                }}
              >
                {renderMultiline(b.text)}
              </p>
            )
          case 'h':
            return (
              <p key={idx} style={{ fontWeight: 'bold', margin: '14px 0 4px' }}>
                {b.text}
              </p>
            )
          case 'p':
            return (
              <p
                key={idx}
                style={{
                  margin: '0 0 4px',
                  textAlign: 'justify',
                  textIndent: b.indent === false ? undefined : '1.1cm',
                }}
              >
                {renderMultiline(b.text)}
              </p>
            )
          case 'kv':
            return (
              <p key={idx} style={{ margin: '0 0 4px' }}>
                <b>{b.label}:</b> {b.value || '…'}
              </p>
            )
          case 'table': {
            const totalW = b.widths.reduce((acc, w) => acc + w, 0)
            return (
              <table
                key={idx}
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  margin: '6px 0',
                }}
              >
                <thead>
                  <tr>
                    {b.head.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          border: '1px solid #111',
                          padding: '5px 6px',
                          background: '#e7e6e6',
                          fontWeight: 'bold',
                          width: `${(b.widths[i] / totalW) * 100}%`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, rIdx) => (
                    <tr key={rIdx}>
                      {r.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            border: '1px solid #111',
                            padding: '5px 6px',
                            verticalAlign: 'top',
                          }}
                        >
                          {renderMultiline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
          case 'sign':
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginTop: '10px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {b.left.date && (
                    <>
                      <i>{b.left.date}</i>
                      <br />
                    </>
                  )}
                  <b>{b.left.title}</b>
                  <br />
                  {b.left.hint && <i style={{ fontSize: '12px' }}>{b.left.hint}</i>}
                  <div style={{ height: '56px' }} />
                  <b>{b.left.name}</b>
                </div>
                <div style={{ textAlign: 'center' }}>
                  {b.right.date && (
                    <>
                      <i>{b.right.date}</i>
                      <br />
                    </>
                  )}
                  <b>{b.right.title}</b>
                  <br />
                  {b.right.hint && <i style={{ fontSize: '12px' }}>{b.right.hint}</i>}
                  <div style={{ height: '56px' }} />
                  <b>{b.right.name}</b>
                </div>
              </div>
            )
          case 'blank':
            return <div key={idx} style={{ height: '8px' }} />
        }
      })}
    </div>
  )
}

