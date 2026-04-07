import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { parseStats, parseTechTable } from '@/lib/parse'

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
  headerLeft: {},
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
  subject: {
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 10,
  },
  paragraph: {
    marginBottom: 12,
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
  
  // Business case styles
  bcTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  bcSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  statBlock: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
    marginTop: 5,
  },
  statHeadline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  statBody: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 5,
  },
  statSource: {
    fontSize: 8,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Tech map table styles
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E5E7EB',
    paddingVertical: 8,
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#374151',
  },
  colSystem: { width: '30%', paddingRight: 10 },
  colRelationship: { width: '20%', paddingRight: 10 },
  colMeaning: { width: '50%' },
})

interface Props {
  coverLetter: string
  businessCase: string
  techMap: string
}

export const LetterPdfDocument = ({ coverLetter, businessCase, techMap }: Props) => {
  // 1. Parse Cover Letter
  const letterLines = coverLetter.split('\n')
  const subjectLine = letterLines.find((l) => l.startsWith('SUBJECT:'))?.replace('SUBJECT:', '').trim()
  const letterBodyRaw = letterLines.filter((l) => !l.startsWith('SUBJECT:')).join('\n')
  // Group into paragraphs by splitting on blank lines
  const letterParagraphs = letterBodyRaw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  // 2. Parse Business Case
  const bcLines = businessCase.split('\n')
  const bcTitle = bcLines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim()
  const bcSubtitle = bcLines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim()
  const bcBodyStart = bcLines.findIndex((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:') && l.trim() !== '')
  const bcBodyText = bcLines
    .slice(Math.max(bcBodyStart, 0))
    .filter((l) => !l.startsWith('TITLE:') && !l.startsWith('SUBTITLE:'))
    .join('\n')
  const bcParts = bcBodyText.split(/(\[STAT\][\s\S]*?\[\/STAT\])/g)

  // 3. Parse Tech Map
  const { rows, before, after } = parseTechTable(techMap)
  const mapLines = before.split('\n').filter(Boolean)
  const mapTitle = mapLines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim()
  const mapSubtitle = mapLines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim()

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>ERP EXPERTS</Text>
        <Text style={styles.subtitle}>NetSuite Implementation & Aftercare · Manchester, UK · www.erpexperts.co.uk</Text>
      </View>
      <Text style={styles.date}>{dateStr}</Text>
    </View>
  )

  const Footer = () => (
    <Text style={styles.footer} fixed>
      ERP Experts Ltd · Manchester, UK · www.erpexperts.co.uk
    </Text>
  )

  return (
    <Document>
      {/* Cover Letter Page */}
      <Page size="A4" style={styles.page}>
        <Header />
        {subjectLine && <Text style={styles.subject}>Re: {subjectLine.replace(/^Re:\s*/i, '')}</Text>}
        {letterParagraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>{para}</Text>
        ))}
        <Footer />
      </Page>

      {/* Business Case Page */}
      <Page size="A4" style={styles.page}>
        <Header />
        {bcTitle && <Text style={styles.bcTitle}>{bcTitle}</Text>}
        {bcSubtitle && <Text style={styles.bcSubtitle}>{bcSubtitle}</Text>}
        
        {bcParts.map((part, i) => {
          if (part.startsWith('[STAT]')) {
            const headline = part.match(/Headline:\s*(.+)/)?.[1]?.trim() ?? ''
            const body = part.match(/Body:\s*([\s\S]+?)(?=Source:|$)/)?.[1]?.trim() ?? ''
            const source = part.match(/Source:\s*(.+)/)?.[1]?.trim() ?? ''
            return (
              <View key={`stat-${i}`} style={styles.statBlock} wrap={false}>
                <Text style={styles.statHeadline}>{headline}</Text>
                <Text style={styles.statBody}>{body}</Text>
                <Text style={styles.statSource}>{source}</Text>
              </View>
            )
          }
          const trimmed = part.trim()
          if (!trimmed) return null
          // Group by double newlines into paragraphs
          return trimmed.split(/\n{2,}/).filter(Boolean).map((para, pi) => (
            <Text key={`p-${i}-${pi}`} style={styles.paragraph}>{para.trim()}</Text>
          ))
        })}
        <Footer />
      </Page>

      {/* Tech Map Page */}
      <Page size="A4" style={styles.page}>
        <Header />
        {mapTitle && <Text style={styles.bcTitle}>{mapTitle}</Text>}
        {mapSubtitle && <Text style={styles.bcSubtitle}>{mapSubtitle}</Text>}
        
        {rows.length > 0 && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.colSystem}>System</Text>
              <Text style={styles.colRelationship}>Relationship</Text>
              <Text style={styles.colMeaning}>What it means</Text>
            </View>
            {rows.map((row, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={styles.colSystem}>{row.system}</Text>
                <Text style={styles.colRelationship}>{row.relationship}</Text>
                <Text style={styles.colMeaning}>{row.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        {after && after.split('\n').map((line, i) => {
          if (!line.trim()) return null
          return <Text key={i} style={styles.paragraph}>{line.trim()}</Text>
        })}
        
        <Footer />
      </Page>
    </Document>
  )
}
