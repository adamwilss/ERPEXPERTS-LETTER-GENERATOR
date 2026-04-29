import React from 'react'
import { Document, Page, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  image: {
    width: '100%',
    objectFit: 'contain',
  },
})

interface Props {
  images: string[]
}

export const ScreenshotPdfDocument = ({ images }: Props) => (
  <Document>
    {images.map((src, i) => (
      <Page key={i} size="A4" style={styles.page}>
        <Image src={src} style={styles.image} />
      </Page>
    ))}
  </Document>
)
