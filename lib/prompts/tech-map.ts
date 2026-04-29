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

3. TABLE: A markdown table with these columns:
| System | Relationship | What it means for [Company] |

The Relationship column must use one of four values only: Integrate, Replace, Eliminate, or Native.
Each row must name a specific system (real or strongly inferred), assign the correct relationship, and write one to two sentences explaining what that means in practical terms for this company specifically.

Typical rows for an ecommerce or product business:
- Shopify -> Integrate
- Xero / Sage -> Replace
- Excel / Spreadsheets -> Eliminate
- ShipStation / 3PL -> Integrate
- Warehouse / physical locations -> Integrate
- International orders -> Native

The table must reflect what is actually known or credibly inferred about this company, not a generic template. Do not include systems that have no basis in the research.

4. CTA: Close with the same call to action:
"Book a 15-minute call with Ric Wilson"
T: 01785 336 253 · E: ric@erpexperts.co.uk · W: www.erpexperts.co.uk`
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
1. Generate a markdown table with columns: System | Relationship | What it means for ${company}
2. Relationship must be one of: Integrate, Replace, Eliminate, Native
3. Only include systems that are plausibly connected to this company's channels and operations
4. Each row must have a specific, practical explanation for THIS company
5. Include TITLE and SUBTITLE at the top
6. Include the CTA block at the bottom
7. No em dashes. Short sentences. Specific. Direct.
${notes ? `\nAdditional notes from the user:\n${notes}` : ''}

Now write the technology integration map.`
}
