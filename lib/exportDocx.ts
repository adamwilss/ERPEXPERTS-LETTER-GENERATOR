import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

export async function exportToDocx(letter: string, companyName: string) {
  const paragraphs = letter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '333333',
          },
          paragraph: {
            spacing: { after: 200, line: 276 },
          },
        },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({ text: 'ERP EXPERTS', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            text: 'NetSuite Implementation & Aftercare · Manchester, UK · www.erpexperts.co.uk',
            style: 'Subtitle',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }),
          new Paragraph({ text: '' }),
          ...paragraphs.map((para) => new Paragraph({ text: para, spacing: { after: 200 } })),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk',
            style: 'Subtitle',
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_erp_letter.docx`)
}
