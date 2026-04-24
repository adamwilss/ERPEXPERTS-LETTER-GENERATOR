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
})

interface Props {
  letter: string
}

export const LetterPdfDocument = ({ letter }: Props) => {
  const letterParagraphs = letter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

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
      <Page size="A4" style={styles.page}>
        <Header />
        {letterParagraphs.map((para, i) => (
          <Text key={i} style={styles.paragraph}>{para}</Text>
        ))}
        <Footer />
      </Page>
    </Document>
  )
}
