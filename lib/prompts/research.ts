// ── Research Synthesis ───────────────────────────────────────────────────────

export interface ResearchArgs {
  company: string
  url: string
  research: string
  netsuiteContext?: string
}

export function researchPrompt(args: ResearchArgs): string {
  const { company, url, research, netsuiteContext } = args

  return `--- RESEARCH RULES ---

Step 1: Research the prospect's website at ${url} and look for technology signals: job adverts mentioning specific systems, integrations listed on their site, partner logos, stack clues in their careers or about pages, any mention of Shopify, Xero, Sage, Salesforce or other platforms.

Before writing, identify:
- How many channels they sell through and what they are
- Whether they manufacture or hold stock themselves
- What AI tools they are likely already using or would logically use at their scale
- Any recent growth moves — new markets, new channels, new product lines
- Their likely or confirmed technology stack
- One specific and genuine observation about the company that shows you've actually looked at what they do
- One specific operational challenge that logically follows from that observation

NetSuite reference guide:
- Ecommerce: Shopify, Shopify Plus, WooCommerce, BigCommerce, Adobe Commerce
- Marketplaces: Amazon Seller Central, Amazon Vendor Central, eBay, Walmart
- Logistics: ShipStation, Amazon MCF
- POS: Shopify, Square, Oracle Simphony
- CRM: Salesforce, Outlook
- NetSuite replaces: Xero, Sage, QuickBooks, Microsoft Dynamics, any standalone accounting or ERP system
- NetSuite eliminates: Excel and spreadsheets used for reporting, inventory tracking, or financial consolidation. Manual data exports between systems. Disconnected tools with no single source of truth.

If you find a system not listed above, use your judgement on whether it would integrate with, be replaced by, or be eliminated by NetSuite.

Do not invent facts. Infer carefully from the evidence. When a fact is unknown, use restrained business inference rather than false certainty.

Acceptable inference: "Given the mix of ecommerce, trade supply, and international fulfilment, it is likely that stock, shipping status, and finance are being managed across separate systems."
Unacceptable fabrication: "You currently reconcile Shopify into Xero every Friday using spreadsheets."

--- CONSISTENCY CHECKS ---

Before producing any output, sense check the following:
1. Is the genuine observation in the cover letter supported by something in the technology map?
2. Does the pain hypothesis in the cover letter match the pain addressed in the business case?
3. Do the systems named in the technology map match any systems referenced in the cover letter or business case?
4. Is the tone consistent across all three pages — human, direct, peer to peer?
5. If any of these are inconsistent, resolve them before writing.

Step 4: Final consistency check
Before outputting anything, read all three pages together and confirm:
- The observation that opens the cover letter is reflected somewhere in the technology map
- The AI and single version of truth thread introduced in the business case is not contradicted anywhere
- The technology map only lists systems that are plausibly connected to what the cover letter and business case describe
- The prospect's name is spelled correctly and consistently throughout
- Ric Wilson is named consistently as the signatory on the cover letter
- Only output the final letter pack once all checks pass.

RESEARCH:
${research}
${netsuiteContext ? `\n${netsuiteContext}` : ''}`
}
