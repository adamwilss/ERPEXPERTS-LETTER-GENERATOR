/**
 * Per-industry NetSuite capability context.
 *
 * Injected into the generation prompt so the AI can make accurate, specific
 * references to NetSuite modules and capabilities — not generic ERP language.
 *
 * Each block covers:
 *  - The most relevant modules for this industry
 *  - What they specifically do in plain language
 *  - The structural pain points they address
 *  - Key capabilities to reference in pain-to-solution mapping
 *
 * Keep each block under ~400 words. Quality over volume.
 */

export interface IndustryContext {
  modules: string          // comma-separated module names
  capabilities: string     // plain English description of what NetSuite does for this industry
  painPoints: string       // structural pain points this industry typically faces
}

const CONTEXTS: Record<string, IndustryContext> = {
  manufacturing: {
    modules: 'Advanced Manufacturing, Advanced Inventory, Supply & Demand Planning, Procurement, WMS',
    capabilities: `
NetSuite Advanced Manufacturing links the shop floor to finance in one system. Work orders are built from bills of materials with routing steps attached — so actual labour, machine time, and material consumption are captured against the job as work progresses, not reconstructed from memory at month end. WIP is visible in real time. Finished goods update inventory the moment a work order is completed.

Supply & Demand Planning calculates what needs to be purchased and when, based on open sales orders, production schedules, and current stock levels — eliminating the spreadsheet-driven purchasing cycle where a planner exports from one system and re-enters into another.

Advanced Inventory gives precise control over lot numbers, serial numbers, expiry dates, and bin locations. A product business that holds raw materials, WIP, and finished goods across multiple storage locations gets one accurate view rather than a count performed manually at period end.

The Procurement module raises purchase orders directly from planned demand, routes them through approval workflows, and three-way matches receipts and invoices automatically — removing the manual invoice processing cycle that typically sits between a finance team and a supplier ledger.`,
    painPoints: `
Typical structural pain in manufacturing: job costs are not visible until a work order closes and someone manually assembles the data; purchasing is reactive rather than demand-driven because there is no live link between sales orders and the buying function; inventory accuracy degrades between stock-takes because goods received, consumed in production, and shipped are tracked in separate places; and the month-end close requires reconciliation between a manufacturing system, a stock system, and an accounting system that were never designed to talk to each other.`,
  },

  'wholesale distribution': {
    modules: 'Advanced Inventory, Order Management, Supply & Demand Planning, Procurement, Advanced Financials',
    capabilities: `
NetSuite Order Management handles the full order-to-cash cycle in one place — customer orders, picking, packing, shipping confirmation, and invoice generation are part of the same record. There is no re-keying between an order system, a warehouse, and a finance system. Customer-specific pricing, discounts, and payment terms are embedded in the customer record and applied automatically.

Advanced Inventory gives real-time stock visibility across every warehouse, 3PL, and transfer location. Demand-driven replenishment calculates reorder quantities and timing based on sales velocity and supplier lead times — replacing the manual export-and-review cycle most distributors run to keep stock aligned with demand.

Supply & Demand Planning sits above inventory, linking purchasing decisions to forecast demand and open commitments. A distributor with seasonal demand patterns or long supplier lead times gets a planned purchase schedule rather than a reactive one.

The Connector module provides pre-built integrations with major ecommerce platforms and EDI trading partners — so orders arriving from Shopify, Amazon, or a retail EDI feed land in the same order management system as trade account orders, with no manual import step.`,
    painPoints: `
Typical structural pain in wholesale distribution: stock accuracy deteriorates between locations because goods received, picked, and transferred are tracked in different systems; margin visibility is retrospective because the cost of goods is only confirmed when purchase invoices are matched manually; large order volumes from trade accounts and ecommerce channels require separate processing flows that converge in a finance system at month end; and demand planning relies on spreadsheet exports that are already out of date by the time a buyer acts on them.`,
  },

  ecommerce: {
    modules: 'SuiteCommerce, Order Management, Advanced Inventory, CRM, Financial Management',
    capabilities: `
NetSuite has a native, certified connector to Shopify. When an order is placed on Shopify, it lands in NetSuite in real time — inventory is immediately decremented, the order enters the fulfilment workflow, and the accounting entry posts without manual intervention. There is no end-of-day batch sync and no reconciliation spreadsheet.

SuiteCommerce extends this to B2B — giving trade customers a self-service account portal where they can see their order history, reorder from previous orders, view live stock availability, and download invoices, without those interactions generating any manual work inside the business.

The CRM module gives a unified customer record that covers both ecommerce and trade account history. A business with direct-to-consumer and wholesale channels sees one complete view of each customer: lifetime value, open orders, payment status, and contact history in one place.

Financial Management replaces the accounting system (Xero, Sage, QuickBooks). Rather than exporting from a commerce platform and importing into an accounting tool, the financial record is live — revenue is recognised as orders are fulfilled, not when someone runs a reconciliation.`,
    painPoints: `
Typical structural pain for ecommerce businesses: inventory oversells because the stock figure in the commerce platform is only as current as the last sync with the warehouse or accounting system; finance requires a manual reconciliation step to align what was sold with what was shipped and what was invoiced; a business with both direct and trade channels runs two separate order flows that converge only at month end; and customer data is fragmented across the commerce platform, an email tool, and a separate accounting system with no unified view.`,
  },

  retail: {
    modules: 'Advanced Inventory, Order Management, SuiteCommerce, CRM, Financial Management',
    capabilities: `
NetSuite gives a single stock figure that covers every location — retail units, warehouse, ecommerce channel, and any third-party fulfilment. A customer purchasing online from a product that is physically in a store generates the same inventory movement as a walk-in sale. Stock accuracy is real time, not batch-updated.

Order Management handles omnichannel fulfilment — ship from store, click and collect, warehouse dispatch — within one system, with no manual handoff between a commerce platform, a store system, and a warehouse tool. Returns from any channel update inventory and trigger the right financial entries automatically.

Customer records are unified across every channel. Purchase history, loyalty status, and account balance are visible whether a customer calls, visits a store, or logs in online. Marketing segmentation and communications can be driven from the same data without exporting to a separate CRM.

Financial Management consolidates multi-location trading in one ledger. A business with several retail units no longer needs to consolidate location P&Ls manually at month end — each location's trading flows into a single consolidated view in real time.`,
    painPoints: `
Typical structural pain in specialty retail: stock figures diverge between locations and the online channel because movements are tracked in different systems and reconciled periodically rather than in real time; a business with both bricks-and-mortar and online sales runs two separate back-office processes that require manual consolidation; and monthly financial reporting across multiple locations depends on exporting and assembling data from several sources, making the close slow and the result retrospective.`,
  },

  'field services': {
    modules: 'SuiteProjects, CRM, Procurement, Financial Management, Advanced Financials',
    capabilities: `
NetSuite SuiteProjects tracks costs at job level from the moment a project is created. Purchase orders raised for a job are assigned to that job record — so committed costs are visible immediately, not when the supplier invoice arrives. Labour time is entered against the job. By the time a job closes, the margin calculation is a live figure, not a retrospective assembly.

The Procurement module links purchasing directly to project or job records. An engineer or site manager raises a purchase request in the field; it routes through an approval workflow and becomes a purchase order with a job code attached. There is no disconnected purchasing process that bypasses job cost tracking.

CRM manages the full customer lifecycle from quote through delivery. A service business that quotes, wins, delivers, and invoices jobs has a single record of each engagement — sales pipeline, active projects, and billing history in one place without data being re-entered between systems.

Service contract management handles recurring maintenance and support agreements — scheduled visits, entitlements, and invoicing are managed automatically rather than manually tracked in a separate system or spreadsheet.`,
    painPoints: `
Typical structural pain in field services: job profitability is only known retrospectively because costs are assembled after the fact from timesheets, purchase invoices, and subcontractor bills rather than tracked live against the job; purchasing for jobs bypasses any formal process and arrives as an invoice that then has to be matched to a job code manually; engineer scheduling and job management sit in a tool that does not connect to finance, so the operations team and the finance team are working from different pictures of the same job; and cash flow is hard to forecast because committed costs and uninvoiced work are not visible in the accounting system.`,
  },

  construction: {
    modules: 'SuiteProjects, Advanced Financials, Procurement, Financial Management, Advanced Inventory',
    capabilities: `
NetSuite SuiteProjects tracks project budgets, committed costs, and actual spend in one place. A construction business with multiple live projects has one dashboard showing budget vs actual across every job — with purchase orders and subcontractor commitments included in the committed figure before the invoice arrives.

Progress billing is handled natively — the system generates invoices based on project milestones or percentage completion, and the billing history against a project is always current without a manual calculation step.

Procurement manages subcontractor purchase orders, materials orders, and plant hire within the same system. Three-way matching (PO, delivery receipt, invoice) eliminates manual invoice checking and gives finance an audit trail for every cost on every job.

Multi-entity consolidation handles group structures where different projects or regions are separate legal entities. A construction group with multiple operating companies gets a consolidated group view without a manual inter-company reconciliation process at month end.`,
    painPoints: `
Typical structural pain in construction: committed costs are invisible until a supplier invoice arrives, making project margin forecasting unreliable; progress billing is calculated manually from project records held outside the finance system; purchasing for site is often undocumented until an invoice lands, making it impossible to reconcile against a project budget in real time; and a business with multiple projects, entities, or regions close the month by assembling data from several sources, making the consolidated view slow and the margin picture retrospective.`,
  },

  'professional services': {
    modules: 'SuiteProjects, CRM, SuiteBilling, Financial Management, Advanced Financials',
    capabilities: `
NetSuite SuiteProjects tracks time, expenses, and costs against every engagement. A professional services business sees live utilisation, billable hours, and project margin for every client and every consultant — without a separate timesheet system that needs to be reconciled with the finance system at month end.

SuiteBilling handles milestone billing, time-and-materials billing, and retainer arrangements within the same system. Billing instructions are attached to the project record, so the invoicing step is driven by what was agreed and delivered — not by a manual review of a timesheet export.

Revenue recognition is automated to IFRS 15 / ASC 606 standards. A business with fixed-price engagements, multi-element contracts, or phased delivery no longer has a manual revenue deferral and release process managed in a spreadsheet alongside the accounting system.

CRM covers the full client lifecycle from pipeline through delivery. Sales opportunities, proposals, won work, active projects, and client invoicing history are all in one record — without CRM data and project data sitting in disconnected systems that require manual bridging.`,
    painPoints: `
Typical structural pain in professional services: utilisation reporting requires pulling timesheet data into a spreadsheet because the timesheet system does not connect to the finance system; revenue recognition is performed manually using a deferral schedule maintained outside the accounting system; billing requires someone to reconcile what was agreed in the contract against what was delivered in the project system before generating an invoice; and client profitability reporting is assembled at month end rather than visible in real time during delivery.`,
  },

  technology: {
    modules: 'SuiteBilling, Revenue Management, CRM, CPQ, Financial Management, Advanced Financials',
    capabilities: `
NetSuite Revenue Management automates recognition to IFRS 15 / ASC 606 standards. A SaaS or software business with multi-element contracts — a licence fee, implementation, and annual support in a single deal — recognises revenue across each element according to the contract terms without a manual deferral schedule in a spreadsheet.

SuiteBilling manages recurring subscription billing automatically. Renewals, upgrades, downgrades, pro-rata adjustments, and churn are handled in the system rather than managed in a billing spreadsheet that feeds into a separate accounting system. ARR, MRR, and churn rate are reportable directly from the billing records.

CPQ (Configure, Price, Quote) manages complex product and pricing configurations at the point of sale. A technology business with configurable products, tiered pricing, or multi-year deal structures can generate accurate quotes without a manual pricing process that bypasses the finance system.

Multi-entity financial management consolidates reporting across multiple operating companies or geographies. A technology group with entities in multiple jurisdictions gets a consolidated P&L and balance sheet without a manual inter-company elimination process at period end.`,
    painPoints: `
Typical structural pain for technology businesses: revenue recognition requires a manual deferral schedule maintained outside the accounting system, creating a reconciliation step at every period end and an audit risk; subscription billing is managed in a tool that does not connect to the finance system, so revenue in the billing platform diverges from the accounting ledger until someone manually reconciles them; multi-year or multi-element contracts require manual allocation of contract value to performance obligations; and SaaS metrics (ARR, MRR, net revenue retention) are assembled from exports rather than drawn live from the system of record.`,
  },

  'food & beverage': {
    modules: 'Advanced Manufacturing, Advanced Inventory, Procurement, Supply & Demand Planning, Financial Management',
    capabilities: `
NetSuite Advanced Manufacturing handles batch production and recipe management natively. A food or beverage manufacturer defines recipes (bills of materials) with ingredient quantities, yield factors, and co-products. Work orders consume ingredients and produce finished goods with lot tracking — so every batch is traceable from raw material receipt through production to customer delivery.

Advanced Inventory manages lot numbers and expiry dates across every storage location. A business subject to food safety regulations has a complete traceability record for every ingredient and finished good, and can execute a targeted recall without a paper-based trace process.

Demand-driven replenishment calculates ingredient purchasing requirements from production schedules and current stock levels, taking account of supplier lead times and minimum order quantities. The result is a planned purchasing schedule driven by actual demand — not a reactive process triggered when a picker finds an empty bin.

Quality management integrates with production — inspection steps can be attached to work orders, quality holds can be applied to lots that fail inspection, and the quality record travels with the lot through the supply chain.`,
    painPoints: `
Typical structural pain in food and beverage manufacturing: lot traceability is maintained in a spreadsheet or paper system that sits outside the production and stock management tools, making a recall or audit response a manual data-gathering exercise; recipe management in production does not connect to the purchasing function, so ingredient procurement is reactive rather than planned from actual production schedules; and a business selling through multiple channels (foodservice, retail, direct) manages separate order flows that converge in a finance system at month end without a unified view of margin by channel or product.`,
  },
}

/** Default context for industries not in the map above */
const DEFAULT_CONTEXT: IndustryContext = {
  modules: 'Financial Management, Advanced Inventory, Order Management, CRM, SuiteProjects',
  capabilities: `
NetSuite replaces the disconnected combination of an accounting system, a stock or order management tool, and any spreadsheets used to bridge them. Finance, stock, purchasing, sales, and operational data share one record — so the information a finance team needs to close the month is already in the system rather than assembled manually from exports.

Order Management handles the full order-to-cash cycle without re-keying between systems. Advanced Inventory gives real-time stock visibility across every location. The CRM module tracks the full customer relationship from pipeline through to payment history in one place.

OneWorld handles multi-entity and multi-currency operations natively — a business with international trading or multiple legal entities gets group reporting without a manual inter-company consolidation process.

The Financial Management module replaces a standalone accounting system (Xero, Sage, QuickBooks) entirely. The result is a live ledger rather than a system that needs to be reconciled with operational data at period end.`,
  painPoints: `
The structural pain that triggers ERP adoption is almost always the same: a business that started with simple, separate tools for finance, operations, and stock has grown to a point where those tools no longer connect cleanly, and the gap between them is filled by manual work — spreadsheet reconciliations, re-keying between systems, or simply waiting until month end to know what the business has actually done. The complexity that was manageable at £2m is fragile at £10m and untenable at £20m.`,
}

/**
 * Returns the context block most relevant to the given industry string.
 * Falls back gracefully if the industry is not recognised.
 */
export function getIndustryContext(industry: string): IndustryContext {
  if (!industry) return DEFAULT_CONTEXT
  const key = industry.toLowerCase().trim()
  // Direct match
  if (CONTEXTS[key]) return CONTEXTS[key]
  // Partial match — e.g. "Food & Beverage" → "food & beverage"
  const match = Object.keys(CONTEXTS).find(k => key.includes(k) || k.includes(key))
  return match ? CONTEXTS[match] : DEFAULT_CONTEXT
}

/**
 * Tries to infer industry from company research text.
 * Used when no explicit industry is provided (e.g. manual form).
 */
export function inferIndustryFromResearch(research: string): string {
  const r = research.toLowerCase()
  if (/manufactur|factory|production|machining|fabricat/.test(r)) return 'manufacturing'
  if (/wholesale|distribut|warehouse|3pl|fulfilment|freight/.test(r)) return 'wholesale distribution'
  if (/shopify|woocommerce|ecommerce|e-commerce|online store|direct.to.consumer/.test(r)) return 'ecommerce'
  if (/retail|showroom|bricks.and.mortar|point of sale/.test(r)) return 'retail'
  if (/field service|maintenance|installation|engineer|callout|site visit/.test(r)) return 'field services'
  if (/construction|contractor|housebuilder|civil|build/.test(r)) return 'construction'
  if (/consultancy|consulting|professional services|agency|advisory/.test(r)) return 'professional services'
  if (/saas|software|subscription|recurring revenue|technology|cloud/.test(r)) return 'technology'
  if (/food|beverage|brewery|bakery|catering|restaurant|fmcg/.test(r)) return 'food & beverage'
  return ''
}

/**
 * Formats the context block as a prompt section.
 */
export function formatContextForPrompt(ctx: IndustryContext): string {
  return `NETSUITE CAPABILITIES RELEVANT TO THIS INDUSTRY:
Modules: ${ctx.modules}

What NetSuite does for businesses like this:
${ctx.capabilities.trim()}

Structural pain points this typically addresses:
${ctx.painPoints.trim()}`
}
