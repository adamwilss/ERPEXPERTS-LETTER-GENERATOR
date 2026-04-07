import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { parseStats, parseTechTable } from './parse'

export async function exportToDocx(coverLetter: string, businessCase: string, techMap: string, companyName: string) {
  const sections = []

  // 1. Cover Letter Section
  const letterLines = coverLetter.split('\n')
  const subjectLine = letterLines.find((l) => l.startsWith('SUBJECT:'))?.replace('SUBJECT:', '').trim()
  const letterBody = letterLines.filter((l) => !l.startsWith('SUBJECT:') && l.trim() !== '')

  sections.push({
    children: [
      new Paragraph({ text: 'ERP EXPERTS', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({
        text: 'NetSuite Implementation & Aftercare · Manchester, UK · www.erpexperts.co.uk',
        style: 'Subtitle',
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: new Date().toLocaleDateString('en-GB') }),
      new Paragraph({ text: '' }),
      ...(subjectLine ? [new Paragraph({ children: [new TextRun({ text: `Re: ${subjectLine.replace(/^Re:\s*/i, '')}`, bold: true })] }), new Paragraph({ text: '' })] : []),
      ...letterBody.map((line) => new Paragraph({ text: line, spacing: { after: 200 } })),
      new Paragraph({ text: '' }),
      new Paragraph({ text: 'ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk', style: 'Subtitle' }),
    ],
  })

  // 2. Business Case Section
  const bcLines = businessCase.split('\n')
  const bcTitle = bcLines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim()
  const bcSubtitle = bcLines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim()
  
  const bcBodyStart = bcLines.findIndex((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:') && l.trim() !== '')
  const bcBodyText = bcLines.slice(Math.max(bcBodyStart, 0)).join('\n')
  
  const { stats, prose } = parseStats(bcBodyText)
  
  // Mixed prose and stats
  const bcChildren = []
  if (bcTitle) bcChildren.push(new Paragraph({ text: bcTitle, heading: HeadingLevel.HEADING_2, pageBreakBefore: true }))
  if (bcSubtitle) bcChildren.push(new Paragraph({ text: bcSubtitle, style: 'Subtitle', spacing: { after: 400 } }))
  
  const parts = bcBodyText.split(/(\[STAT\][\s\S]*?\[\/STAT\])/g)
  parts.forEach((part) => {
    if (part.startsWith('[STAT]')) {
      const headline = part.match(/Headline:\s*(.+)/)?.[1]?.trim() ?? ''
      const body = part.match(/Body:\s*([\s\S]+?)(?=Source:|$)/)?.[1]?.trim() ?? ''
      const source = part.match(/Source:\s*(.+)/)?.[1]?.trim() ?? ''
      
      bcChildren.push(new Paragraph({
        children: [
          new TextRun({ text: headline + '\n', bold: true, size: 32 }),
          new TextRun({ text: body + '\n', size: 24 }),
          new TextRun({ text: source, size: 20, italics: true, color: '666666' }),
        ],
        spacing: { before: 200, after: 200 },
        shading: { fill: 'F3F4F6' },
      }))
    } else {
      const trimmed = part.trim()
      if (trimmed) {
        trimmed.split('\n').forEach(line => {
          if (line.trim()) {
             bcChildren.push(new Paragraph({ text: line.trim(), spacing: { after: 200 } }))
          }
        })
      }
    }
  })

  bcChildren.push(new Paragraph({ text: '' }), new Paragraph({ text: 'ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk', style: 'Subtitle' }))
  sections.push({ children: bcChildren })

  // 3. Tech Map Section
  const { rows, before, after } = parseTechTable(techMap)
  const mapLines = before.split('\n').filter(Boolean)
  const mapTitle = mapLines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() ?? ''
  const mapSubtitle = mapLines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim() ?? ''

  const mapChildren = []
  if (mapTitle) mapChildren.push(new Paragraph({ text: mapTitle, heading: HeadingLevel.HEADING_2, pageBreakBefore: true }))
  if (mapSubtitle) mapChildren.push(new Paragraph({ text: mapSubtitle, style: 'Subtitle', spacing: { after: 400 } }))

  if (rows.length > 0) {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'System', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Relationship', bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'What it means', bold: true })] })] }),
          ],
        }),
        ...rows.map(row => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: row.system })] }),
              new TableCell({ children: [new Paragraph({ text: row.relationship })] }),
              new TableCell({ children: [new Paragraph({ text: row.meaning })] }),
            ],
          })
        ))
      ],
    })
    mapChildren.push(table)
  }

  if (after) {
    mapChildren.push(new Paragraph({ text: '' }))
    after.split('\n').forEach(line => {
      if (line.trim()) {
        mapChildren.push(new Paragraph({ text: line.trim(), spacing: { after: 200 } }))
      }
    })
  }
  
  mapChildren.push(new Paragraph({ text: '' }), new Paragraph({ text: 'ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk', style: 'Subtitle' }))
  sections.push({ children: mapChildren })

  // Construct Document
  const doc = new Document({
    sections,
  })

  // Export
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_erp_letter_pack.docx`)
}
