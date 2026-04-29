import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

export async function exportToDocx(letter: string, businessCase?: string, techMap?: string, companyName?: string) {
  const name = (companyName || 'Company').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  function splitIntoParagraphs(text: string): Paragraph[] {
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((para) => new Paragraph({ text: para, spacing: { after: 200 } }))
  }

  const children: any[] = [
    new Paragraph({ text: 'ERP EXPERTS', heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: 'NetSuite Implementation & Aftercare · Manchester, UK · www.erpexperts.co.uk',
      style: 'Subtitle',
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: dateStr }),
    new Paragraph({ text: '' }),
    ...splitIntoParagraphs(letter),
  ]

  if (businessCase) {
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({ text: '—— Business Case ——', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: '' }),
      ...splitIntoParagraphs(businessCase)
    )
  }

  if (techMap) {
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({ text: '—— Technology Integration Map ——', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ text: '' }),
      ...splitIntoParagraphs(techMap)
    )
  }

  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      text: 'ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk',
      style: 'Subtitle',
    })
  )

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '333333' },
          paragraph: { spacing: { after: 200, line: 276 } },
        },
      },
    },
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${name}_erp_letter_pack.docx`)
}
