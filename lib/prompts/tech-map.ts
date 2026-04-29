// ── Tech Map Builder ─────────────────────────────────────────────────────────

export interface TechMapArgs {
  company: string
  channels: string[]
  likelySystems: string[]
  notes?: string
}

export function techMapSystemPrompt(): string {
  return `--- TECHNOLOGY MAP STRUCTURE -- FOLLOW THIS EXACTLY ---

The technology integration map must follow this structure:

1. TITLE: "[Company]: technology integration map"
2. SUBTITLE: "How NetSuite sits at the centre of [Company]'s technology stack: what integrates, what gets replaced, and what gets eliminated."

3. TABLE: A markdown table with FOUR columns:
| System | Relationship | What it means for [Company] | Real-world impact |

The Relationship column must use one of four values only: Integrate, Replace, Eliminate, or Native.

The "What it means" column: One to two sentences explaining what this relationship means in practical terms for this company specifically. Be concrete — name the actual data flow, process change, or capability gained.

The "Real-world impact" column: One sentence on the tangible outcome. Shorter month-end? Fewer spreadsheets? Live inventory across channels? One team member freed up? Make it specific and credible.

Typical rows for an ecommerce or product business:
- Shopify -> Integrate -> "Orders and inventory sync automatically..." -> "..."
- Xero / Sage -> Replace -> "Finance moves into NetSuite..." -> "..."
- Excel / Spreadsheets -> Eliminate -> "Reporting moves out of offline files..." -> "..."
- International orders -> Native -> "Multi-currency and VAT handled natively..." -> "..."

Generate 6-10 rows. The table must reflect what is actually known or credibly inferred about this company. Do not include systems with no basis in the research.

4. CTA (copy exactly):
"Book a 15-minute call with Ric Wilson, MD"
T: 01785 336 253  ·  E: hello@erpexperts.co.uk  ·  W: www.erpexperts.co.uk`
}

export function techMapUserPrompt(args: TechMapArgs): string {
  const { company, channels, likelySystems, notes } = args

  return `PROSPECT DETAILS:
Company: ${company}
Channels: ${channels.join(', ') || 'Unknown'}
Likely or inferred systems: ${likelySystems.join(', ') || 'Unknown'}

NetSuite reference guide:
- Integrates with: Shopify, Shopify Plus, WooCommerce, BigCommerce, Adobe Commerce, Amazon Seller Central, Amazon Vendor Central, eBay, Walmart, ShipStation, Amazon MCF, Salesforce, Outlook
- Replaces: Xero, Sage, QuickBooks, Microsoft Dynamics, any standalone accounting or ERP system
- Eliminates: Excel and spreadsheets used for reporting, inventory tracking, or financial consolidation. Manual data exports between systems. Disconnected tools with no single source of truth.
- Native: Multi-currency, VAT, entity-level reporting, cross-border operational visibility

CRITICAL REQUIREMENTS:
1. Generate a markdown table with FOUR columns: System | Relationship | What it means for ${company} | Real-world impact
2. Relationship must be one of: Integrate, Replace, Eliminate, Native
3. "What it means" = 1-2 sentences, practical and specific to their operations
4. "Real-world impact" = 1 sentence, tangible outcome they would notice
5. Only include systems plausibly connected to this company's channels
6. Generate 6-10 rows — be thorough but credible
7. Include TITLE and SUBTITLE at the top
8. Include the CTA block at the bottom EXACTLY as specified
9. No em dashes. Short sentences. Specific. Direct.
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

Now write the technology integration map.`
}
