export interface ParsedOutput {
  part1: string
  part2: string
  part3: string
}

export function parseOutput(raw: string): ParsedOutput {
  const p1Start = raw.indexOf('---PART1---')

  const part1 = p1Start !== -1 ? raw.slice(p1Start + 11).trim() : raw.trim()
  const part2 = ''
  const part3 = ''

  return { part1, part2, part3 }
}

export function parseSingleLetter(raw: string): string {
  const p1Start = raw.indexOf('---PART1---')
  if (p1Start !== -1) {
    return raw.slice(p1Start + 11).trim()
  }
  return raw.trim()
}

// Parses [STAT]...[/STAT] blocks out of business case text
export interface StatBlock {
  headline: string
  body: string
  source: string
}

export function parseStats(text: string): { stats: StatBlock[]; prose: string } {
  const stats: StatBlock[] = []
  const statRegex = /\[STAT\]([\s\S]*?)\[\/STAT\]/g
  let match

  while ((match = statRegex.exec(text)) !== null) {
    const inner = match[1]
    const headline = inner.match(/Headline:\s*(.+)/)?.[1]?.trim() ?? ''
    const body = inner.match(/Body:\s*([\s\S]+?)(?=Source:|$)/)?.[1]?.trim() ?? ''
    const source = inner.match(/Source:\s*(.+)/)?.[1]?.trim() ?? ''
    stats.push({ headline, body, source })
  }

  const prose = text.replace(statRegex, '').trim()
  return { stats, prose }
}

// Parses a markdown table from the tech map section
// Supports both 3-column (legacy) and 4-column (new) tables
export interface TableRow {
  system: string
  relationship: string
  meaning: string
  impact?: string
}

export function parseTechTable(text: string): { rows: TableRow[]; before: string; after: string } {
  const lines = text.split('\n')
  const rows: TableRow[] = []
  let tableStart = -1
  let tableEnd = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|') && tableStart === -1) {
      tableStart = i
    }
    if (tableStart !== -1 && !lines[i].trim().startsWith('|') && i > tableStart + 1) {
      tableEnd = i
      break
    }
  }
  if (tableStart !== -1 && tableEnd === -1) tableEnd = lines.length

  // Keep rows that start with | but are not separator rows (|---|---|---|)
  const tableLines = lines.slice(tableStart, tableEnd).filter(
    (l) => l.trim().startsWith('|') && !/^\s*\|[\s\-\|:]+\|\s*$/.test(l)
  )

  // tableLines[0] is the header row — skip it and process data rows
  tableLines.slice(1).forEach((line) => {
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean)
    if (cols.length >= 3) {
      rows.push({
        system: cols[0],
        relationship: cols[1],
        meaning: cols[2],
        impact: cols[3] ?? undefined,
      })
    }
  })

  const before = lines.slice(0, tableStart).join('\n').trim()
  const after = lines.slice(tableEnd).join('\n').trim()

  return { rows, before, after }
}
