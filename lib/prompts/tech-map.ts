// ── Tech Map Builder ─────────────────────────────────────────────────────────

export interface TechMapArgs {
  company: string
  channels: string[]
  likelySystems: string[]
  notes?: string
}

export function techMapSystemPrompt(): string {
  return `--- TECHNOLOGY MAP STRUCTURE ---

The technology integration map must follow this structure:

1. TITLE: "[Company]: technology integration map"
2. SUBTITLE: "How NetSuite sits at the centre of [Company]'s technology stack: what integrates, what gets replaced, and what gets eliminated."

3. TABLE: A markdown table with FOUR columns:
| System | Relationship | What it means for [Company] | Real-world impact |

The Relationship column must use one of four values only: Integrate, Replace, Eliminate, or Native.

The "What it means" column: One to two sentences explaining what this relationship means in practical terms for this company specifically. Be concrete — name the actual data flow, process change, or capability gained.

The "Real-world impact" column: One sentence on the tangible outcome. Shorter month-end? Fewer spreadsheets? Live inventory across channels? Make it specific and credible.

Typical rows for an ecommerce or product business:
- Shopify -> Integrate -> "Orders and inventory sync automatically..." -> "..."
- Xero / Sage -> Replace -> "Finance moves into NetSuite..." -> "..."
- Excel / Spreadsheets -> Eliminate -> "Reporting moves out of offline files..." -> "..."

Generate 6-10 rows. The table must reflect what is actually known or credibly inferred about this company. Do not include systems with no basis in the research.

NEVER include a CTA block, phone number, email, or website. The footer handles all contact details.`
}

export function techMapUserPrompt(args: TechMapArgs): string {
  const { company, channels, likelySystems, notes } = args

  return `Write the tech map for:
Company: ${company}
Channels: ${channels.join(', ') || 'Unknown'}
Likely systems: ${likelySystems.join(', ') || 'Unknown'}

NetSuite reference:
- Integrates with: Shopify, Shopify Plus, WooCommerce, BigCommerce, Adobe Commerce, Amazon, eBay, Walmart, ShipStation, Amazon MCF, Salesforce, Outlook
- Replaces: Xero, Sage, QuickBooks, Microsoft Dynamics, any standalone accounting/ERP
- Eliminates: Excel/spreadsheets for reporting, inventory, or financial tasks. Manual data exports between systems.
- Native: Multi-currency, VAT, entity-level reporting, cross-border operations

Do this:
1. Markdown table with FOUR columns: System | Relationship | What it means for ${company} | Real-world impact
2. Relationship: Integrate, Replace, Eliminate, or Native only
3. 6-10 rows — only systems with basis in research
4. Include TITLE and SUBTITLE at the top
5. NO CTA. NO phone number. NO email. NO website. Footer handles contact details.
6. No em dashes. Short sentences. Specific.
${notes ? `\nNotes:\n${notes}` : ''}

Write the tech map now.`
}
