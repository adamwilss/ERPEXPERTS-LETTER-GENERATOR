import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
  },
  date: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    marginTop: 10,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 10,
  },
  salutation: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 12,
  },
  signoff: {
    marginTop: 20,
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.6,
  },
  signatureLine: {
    width: 120,
    borderBottom: '1pt solid #9CA3AF',
    marginTop: 8,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #F3F4F6',
    paddingTop: 10,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: '0.5pt solid #F3F4F6',
  },
  tableCellSystem: {
    width: '25%',
    fontSize: 9,
    color: '#111827',
    fontWeight: 'bold',
  },
  tableCellRel: {
    width: '20%',
    fontSize: 9,
    color: '#4B5563',
  },
  tableCellMeaning: {
    width: '55%',
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.4,
  },
  ctaBlock: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: '1pt solid #E5E7EB',
    fontSize: 9,
    color: '#4B5563',
  },
})

interface Props {
  letter: string
  businessCase?: string
  techMap?: string
  companyName?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toParagraphs(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim())
  const out: string[] = []
  let current = ''
  for (const line of lines) {
    if (line === '') {
      if (current.trim()) {
        out.push(current.trim())
        current = ''
      }
    } else {
      current += (current ? ' ' : '') + line
    }
  }
  if (current.trim()) out.push(current.trim())
  return out
}

function extractTitle(lines: string[]): { title: string; subtitle: string; bodyLines: string[] } {
  let title = ''
  let subtitle = ''
  const bodyLines: string[] = []
  for (const line of lines) {
    if (!title && line.toLowerCase().startsWith('title:')) {
      title = line.replace(/^title:\s*/i, '')
    } else if (!subtitle && line.toLowerCase().startsWith('subtitle:')) {
      subtitle = line.replace(/^subtitle:\s*/i, '')
    } else if (
      line &&
      !/^#+\s/.test(line) &&
      !/^\[stat\]/i.test(line) &&
      !/^\[\/stat\]/i.test(line)
    ) {
      bodyLines.push(line)
    }
  }
  return { title, subtitle, bodyLines }
}

function parseTableRows(text: string): { system: string; relationship: string; meaning: string }[] {
  const rows: { system: string; relationship: string; meaning: string }[] = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      const cols = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c && !/^[-\s|:]+$/.test(c))
      if (cols.length >= 3) {
        const [system, relationship, meaning] = cols
        if (system.toLowerCase() !== 'system') {
          rows.push({ system, relationship, meaning })
        }
      }
    }
  }
  return rows
}

function findCtaAfterTable(text: string): string {
  const lines = text.split('\n')
  let lastTableLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|')) lastTableLine = i
  }
  if (lastTableLine >= 0 && lastTableLine < lines.length - 1) {
    return lines.slice(lastTableLine + 1).join('\n').trim()
  }
  return ''
}

function findSalutation(lines: string[]): { salutation: string | null; bodyStart: number; signoffStart: number } {
  const salutationIdx = lines.findIndex((l) => /^dear\s/i.test(l))
  const signoffIdx = lines.findIndex((l) =>
    /^yours sincerely|^kind regards|^best regards|^yours,|^best,/i.test(l)
  )
  return {
    salutation: salutationIdx >= 0 ? lines[salutationIdx] : null,
    bodyStart: salutationIdx >= 0 ? salutationIdx + 1 : 0,
    signoffStart: signoffIdx >= 0 ? signoffIdx : -1,
  }
}

// ── Document ─────────────────────────────────────────────────────────────────

export const LetterPdfDocument = ({ letter, businessCase, techMap }: Props) => {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Page 1: Cover Letter ────────────────────────────────────────────────
  const letterLines = letter.split('\n').map((l) => l.trim())
  const { salutation, bodyStart, signoffStart } = findSalutation(letterLines)
  const bodyEnd = signoffStart >= 0 ? signoffStart : letterLines.length
  const bodyParagraphs = toParagraphs(letterLines.slice(bodyStart, bodyEnd).join('\n'))
  const signoffLines = signoffStart >= 0 ? letterLines.slice(signoffStart) : []

  // ── Page 2: Business Case ───────────────────────────────────────────────
  const bcLines = (businessCase || '').split('\n')
  const { title: bcTitle, subtitle: bcSubtitle, bodyLines: bcBodyLines } = extractTitle(bcLines)
  const bcParagraphs = toParagraphs(bcBodyLines.join('\n'))

  // ── Page 3: Tech Map ────────────────────────────────────────────────────
  const tmLines = (techMap || '').split('\n')
  let tmTitle = 'Technology Integration Map'
  let tmSubtitle = ''
  for (const line of tmLines) {
    if (line.toLowerCase().startsWith('title:')) tmTitle = line.replace(/^title:\s*/i, '')
    if (line.toLowerCase().startsWith('subtitle:')) tmSubtitle = line.replace(/^subtitle:\s*/i, '')
  }
  const tableRows = parseTableRows(techMap || '')
  const ctaText = findCtaAfterTable(techMap || '')

  return (
    <Document>
      {/* ── Page 1: Cover Letter ─────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.title}>ERP EXPERTS</Text>
            <Text style={styles.subtitle}>NetSuite Implementation &amp; Aftercare · Manchester, UK · www.erpexperts.co.uk</Text>
          </View>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {salutation && <Text style={styles.salutation}>{salutation}</Text>}

        {bodyParagraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>{para}</Text>
        ))}

        {signoffLines.length > 0 && (
          <View style={styles.signoff}>
            {signoffLines.map((line, i) => {
              if (/^[_\s]+$/.test(line)) {
                return <View key={i} style={styles.signatureLine} />
              }
              return <Text key={i}>{line}</Text>
            })}
          </View>
        )}

        <Text style={styles.footer} fixed>
          ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
        </Text>
      </Page>

      {/* ── Page 2: Business Case ────────────────────────────────────── */}
      {businessCase && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header} fixed>
            <View>
              <Text style={styles.title}>ERP EXPERTS</Text>
              <Text style={styles.subtitle}>NetSuite Implementation &amp; Aftercare · Manchester, UK · www.erpexperts.co.uk</Text>
            </View>
            <Text style={styles.date}>{dateStr}</Text>
          </View>

          <Text style={styles.sectionTitle}>{bcTitle || 'Business Case'}</Text>
          {bcSubtitle && <Text style={styles.sectionSubtitle}>{bcSubtitle}</Text>}

          {bcParagraphs.map((para, i) => (
            <Text key={i} style={styles.paragraph}>{para}</Text>
          ))}

          <Text style={styles.footer} fixed>
            ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
          </Text>
        </Page>
      )}

      {/* ── Page 3: Tech Map ─────────────────────────────────────────── */}
      {techMap && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header} fixed>
            <View>
              <Text style={styles.title}>ERP EXPERTS</Text>
              <Text style={styles.subtitle}>NetSuite Implementation &amp; Aftercare · Manchester, UK · www.erpexperts.co.uk</Text>
            </View>
            <Text style={styles.date}>{dateStr}</Text>
          </View>

          <Text style={styles.sectionTitle}>{tmTitle}</Text>
          {tmSubtitle && <Text style={styles.sectionSubtitle}>{tmSubtitle}</Text>}

          <View style={{ marginTop: 10 }}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellSystem}>System</Text>
              <Text style={styles.tableCellRel}>Status</Text>
              <Text style={styles.tableCellMeaning}>What it means</Text>
            </View>
            {tableRows.map((row, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCellSystem}>{row.system}</Text>
                <Text style={styles.tableCellRel}>{row.relationship}</Text>
                <Text style={styles.tableCellMeaning}>{row.meaning}</Text>
              </View>
            ))}
          </View>

          {ctaText && (
            <View style={styles.ctaBlock}>
              <Text>{ctaText}</Text>
            </View>
          )}

          <Text style={styles.footer} fixed>
            ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
          </Text>
        </Page>
      )}
    </Document>
  )
}
