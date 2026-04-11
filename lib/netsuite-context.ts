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
  caseStudy?: string       // relevant ERP Experts case study for this industry
  objections?: string      // common objections and rebuttals for this vertical
  competitorContext?: string // how to position against common competitors in this space
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
    caseStudy: `TOTALKARE (Manufacturing + Servicing) — UK manufacturer and distributor of heavy vehicle lifting equipment. Before: Separate systems for manufacturing BOMs, stock management, finance, and service contracts. No visibility of true product profitability. Service scheduling disconnected from parts inventory. After: Single platform from order through production to service contract. Real-time visibility of product and service margins. Service engineers see stock availability instantly.`,
    objections: `
Common objections from manufacturers:
- "Our production is too complex/unique" → NetSuite Advanced Manufacturing handles multi-level BOMs, routing, and work order nesting. Totalkare had complex manufacturing plus field service — now unified.
- "Shop floor workers won't use a system" → Mobile tablet access shows work orders, captures time, and updates inventory without shop floor PCs.
- "We've invested in our current MRP" → NetSuite integrates with existing shop floor systems while replacing the finance/stock fragmentation that causes the real pain.`,
    competitorContext: `
If prospect uses Sage/SAP Business One: Emphasise that these systems were designed for simple BOMs, not modern multi-stage production with real-time job costing. The "integration" to accounting is batch-based, not live.
If prospect uses spreadsheets for planning: This is the breaking point — at 50+ SKUs or 10+ jobs live, spreadsheet planning collapses. Emphasise Supply & Demand Planning with automatic MRP calculations.
If prospect is considering Dynamics Business Central: NetSuite's Advanced Manufacturing module has deeper WIP visibility and actual costing against routings. Dynamics requires add-ons for this functionality.`,
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
    caseStudy: `KYNETEC (Agricultural Data / Multi-Entity Distribution) — Agricultural data and analytics business with multi-country distribution operations. Before: Fragmented entity reporting across 5 countries, manual consolidation in Excel, different currencies and tax treatments causing reconciliation nightmares. Month-end took 15+ days. After: Group reporting automated, real-time consolidation, currency and tax handling native. Month-end close accelerated to under 5 days. Board reports generated instantly.`,
    objections: `
Common objections from distributors:
- "We have 3PLs handling fulfilment" → NetSuite integrates with major 3PLs via EDI/API. Stock at 3PL locations shows in the same inventory view as owned warehouses.
- "Our pricing is too complex" → Customer-specific pricing matrices, volume breaks, and contract pricing are native to NetSuite customer records — no workarounds needed.
- "We trade in multiple currencies" → Multi-currency with automatic revaluation and hedging is native — unlike add-on modules in entry-level accounting systems.`,
    competitorContext: `
If prospect uses Sage/Xero for accounting + separate WMS: The gap between the accounting system and warehouse system creates a daily reconciliation burden. Emphasise unified inventory and finance.
If prospect uses a standalone distribution ERP (e.g., Kerridge, Merlin): These systems often lack modern API connectivity for ecommerce and EDI. Emphasise NetSuite's pre-built connectors and SuiteCloud platform.
If prospect uses Excel for demand planning: This is a critical vulnerability — demand spikes, supply disruptions, and seasonality are impossible to model accurately in spreadsheets at volume.`,
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
    caseStudy: `CARALLON (Media Technology / Ecommerce + Project Hybrid) — London-based media technology with both product ecommerce and installation projects. Before: Project profitability hard to track across development and installation phases. Purchasing fragmented across project managers. No single view of committed costs vs budget. After: Project and product financials unified, purchasing centralised with approval workflows. Live project P&L visible to project managers. Budget vs actual reporting in real time.`,
    objections: `
Common objections from ecommerce businesses:
- "Shopify handles everything we need" → Shopify stops at the order. NetSuite handles inventory, fulfilment, accounting, and purchasing in one system. The reconciliation gap between Shopify and Xero/Sage is where the pain lives.
- "We're too small for an ERP" → At £2-5M revenue, the complexity of multi-channel + inventory + accounting fragmentation makes an ERP investment pay back in under 12 months through stock accuracy and reduced reconciliation labour.
- "We'd lose our Shopify store data" → NetSuite's Shopify connector preserves order history, customer data, and product information — it enhances Shopify, not replaces it.`,
    competitorContext: `
If prospect uses Shopify + Xero/Sage + spreadsheets: This is the classic £5-20M ecommerce trap. The "best-of-breed" approach creates a daily reconciliation burden and inventory drift. Emphasise unified inventory and finance.
If prospect is considering Brightpearl or similar ecommerce ERP: These are closed systems with limited integration options. NetSuite's open platform connects to any future channel or tool.
If prospect uses A2X or similar reconciliation tools: These are band-aids. Every month they still need manual checking and correction. NetSuite eliminates the reconciliation step entirely.`,
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
    caseStudy: `CARALLON (Media Technology / Multi-Channel) — London-based media technology with retail showrooms, ecommerce, and installation services. Before: Inventory diverged between showroom point-of-sale, warehouse system, and online channel. Click-and-collect required manual checking and reservation. Returns had to be processed separately per channel. After: Unified inventory across all channels with real-time visibility. Ship-from-store enabled without manual workarounds. Customer service sees complete purchase history regardless of channel.`,
    objections: `
Common objections from retailers:
- "We need a retail-specific POS" → NetSuite SuiteCommerce InStore provides native POS with unified inventory. Or integrate your existing POS — the back office unification matters more than the till interface.
- "Our store staff aren't technical" → NetSuite's CRM and inventory visibility actually simplifies store operations — one system for stock checks, customer lookups, and order management instead of switching between tools.
- "We trade internationally" → Multi-currency, multi-tax, and multi-entity consolidation is native — essential for retailers expanding across borders.`,
    competitorContext: `
If prospect uses Lightspeed/Vend/Retail POS + Xero: The retail-specific POS is good for tills, but the back office fragmentation causes the real pain. Emphasise unified inventory and finance with real-time stock visibility.
If prospect uses Magento + separate ERP: Magento requires heavy integration investment for omnichannel. NetSuite's SuiteCommerce provides native omnichannel without middleware.
If prospect is considering Shopify POS: Shopify POS is fine for small retailers, but lacks the financial depth, multi-entity capability, and inventory sophistication for £5M+ operations with multiple locations.`,
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
    caseStudy: `ECO2SOLAR (Renewable Energy / Field Operations) — UK renewable energy installer with multi-site project management. Before: Job costing and purchasing tracked across spreadsheets and disconnected tools. Field teams and finance rarely saw the same data. Month-end required manual assembly of job costs from multiple sources. After: Live job margin visibility from day one, purchasing integrated with field schedules, field and finance aligned in one record. Month-end close reduced from 10 days to 4.`,
    objections: `
Common objections from field service companies:
- "Our engineers won't use a system in the field" → Mobile access with offline capability. Time entry, job updates, and parts requests from any device. Eliminates the daily spreadsheet chase.
- "We use a job scheduling tool that works fine" → Scheduling is separate from job costing. The pain is knowing job profitability before the invoice is sent. NetSuite links scheduling to live cost capture.
- "Projects vary too much for a system" → NetSuite handles variable job structures — different work order types, BOMs for standard jobs, time & materials for custom work. Flexibility with structure.`,
    competitorContext: `
If prospect uses ServiceMax/FieldPulse + Xero/Sage: The field service tool handles scheduling but the finance gap remains. Emphasise live job costing and committed cost visibility.
If prospect uses simPRO/WorkflowMax: These tools have job costing but lack sophisticated procurement, multi-entity, and advanced financial management. At £10M+ revenue, the gaps become painful.
If prospect is considering Dynamics/Acumatica: These have field service modules but often require significant customisation for true job-level cost visibility. NetSuite's project costing is native and proven.`,
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
    caseStudy: `ECO2SOLAR (Construction + Field Service Hybrid) — Renewable energy installer handling multi-site construction projects. Before: Project costs tracked in spreadsheets separate from accounting. Site purchasing invisible until invoices arrived. Budget overruns discovered too late to act. After: Live project dashboards showing committed vs actual costs. Purchase orders raised from the system with project codes attached. Month-end close reduced from 10 days to 4 with real-time margin visibility.`,
    objections: `
Common objections from construction companies:
- "Construction is different from other industries" → NetSuite handles retention, CIS, progress billing, and multi-stage projects natively. Construction-specific without being constrained.
- "Our sites don't have internet" → Mobile offline capability. Updates sync when connection returns. Field teams capture time, receipts, and job notes without connectivity.
- "We have QS software that handles costing" → Quantity surveying tools calculate what SHOULD cost. NetSuite tracks what ACTUALLY costs with live commitment visibility. The gap between the two is where margin disappears.`,
    competitorContext: `
If prospect uses Sage Construction/Masterpiece: These are legacy systems with poor integration to modern tools. Emphasise NetSuite's cloud-native platform, real-time visibility, and modern API connectivity.
If prospect uses spreadsheets for project costing: This is the breaking point — at £5M+ project volume, spreadsheet tracking collapses. Emphasise live committed cost visibility and automated progress billing.
If prospect is considering Dynamics/Acumatica for construction: These require heavy customisation for construction-specific features. NetSuite's Advanced Financials and SuiteProjects handle construction requirements natively.`,
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
    caseStudy: `CARALLON (Professional Services + Product) — Media technology company with both project-based installation services and product sales. Before: Project profitability hard to track across development and installation phases. Utilisation data in separate system from finance. Billing required manual reconciliation of timesheets to contracts. After: Live project P&L visible to project managers. Time entry flows directly to billing. Resource utilisation and project margins in real time. Revenue recognition automated for fixed-price and T&M engagements.`,
    objections: `
Common objections from professional services firms:
- "We bill by time and our system works" → Time-based billing isn't the pain — the pain is knowing project profitability BEFORE the invoice is sent, and having client history unified across sales and delivery.
- "We're consultants, not accountants" → Exactly — you shouldn't be maintaining revenue recognition schedules in spreadsheets. NetSuite automates IFRS 15 compliance so you focus on delivery.
- "Our team won't log time" → Mobile apps with one-touch timers. Integrated with calendar tools. Easier than the current spreadsheet chase at month end.`,
    competitorContext: `
If prospect uses PSA tools (Kimble, FinancialForce) + Xero/Sage: The PSA handles time but the finance gap remains. Emphasise unified project costing, automated revenue recognition, and real-time margin visibility.
If prospect uses Sage for accounting + Excel for deferred revenue: This is a compliance risk and manual burden. Emphasise automated IFRS 15/ASC 606 revenue recognition.
If prospect is considering Dynamics PSA: Requires significant customisation for complex billing scenarios. NetSuite's SuiteBilling handles milestone, T&M, and retainer billing natively.`,
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
    caseStudy: `KYNETEC (SaaS / Agricultural Data) — Agricultural data and analytics business with subscription revenue model. Before: Manual revenue recognition across 5 entities. Subscription billing managed in separate tool from finance. SaaS metrics calculated from exports. After: Automated IFRS 15 revenue recognition. Subscription billing integrated with finance. ARR, MRR, and churn metrics real-time. Multi-entity consolidation automated with currency handling native.`,
    objections: `
Common objections from technology companies:
- "We have a billing platform that handles subscriptions" → Stripe/Chargify handle payment collection, not revenue recognition. The deferral schedule is still manual in your accounting system. NetSuite automates both billing AND recognition.
- "We're a SaaS business, not an ERP business" → SaaS businesses benefit most from automated revenue recognition and SaaS metric reporting. You didn't get into SaaS to maintain deferral schedules in spreadsheets.
- "Our contracts are complex" → ASC 606/IFRS 15 complexity is exactly why you need automated revenue management. Multi-element allocation, variable consideration, and performance obligations are handled natively.`,
    competitorContext: `
If prospect uses Stripe + Xero/Sage + spreadsheets: Stripe handles payments but not revenue recognition. The manual deferral schedule is a growing compliance risk. Emphasise automated IFRS 15/ASC 606 compliance.
If prospect uses SaaS-specific tools like SaaSOptics/Maxio: These tools have revenue recognition but lack the full ERP capabilities (procurement, project costing, inventory if applicable). NetSuite is the complete platform.
If prospect is considering Intacct/Dynamics: These have subscription billing modules but often require add-ons for complex revenue recognition scenarios. NetSuite's Revenue Management is native and proven for SaaS.`,
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
    caseStudy: `FOOD & BEVERAGE CLIENT (Batch Manufacturing + Traceability) — UK food manufacturer with batch production and multi-channel distribution. Before: Lot traceability in spreadsheets separate from production system. Recipe yields calculated manually. Recalls required days of data gathering. After: Complete lot traceability from ingredient to customer. F1/F2 recall reports generated instantly. Recipe yields tracked automatically. Demand-driven purchasing based on production schedules.`,
    objections: `
Common objections from food & beverage manufacturers:
- "We need specialist food manufacturing software" → NetSuite Advanced Manufacturing handles batch production, recipe management, and yield tracking natively. Integration with specialist traceability tools via API if needed.
- "BRC/SALSA audits require paper records" → Digital records exceed paper audit requirements. Lot traceability reports generated instantly. Inspection records attached to batches. Full audit trail.
- "Our recipes are trade secrets" → Role-based access controls protect recipe data. Production staff see what they need; formulae protected at ingredient level if required.`,
    competitorContext: `
If prospect uses specialist food ERP (e.g., SI Food, Just Food): These systems handle traceability but often lack sophisticated financial management, multi-entity, and advanced analytics. Emphasise NetSuite's unified platform with best-practice financials.
If prospect uses Sage + Excel for traceability: This is a compliance risk and recall liability. Emphasise automated lot traceability and instant recall capability.
If prospect is considering SAP Business One: Similar functionality but heavier implementation and higher ongoing cost. NetSuite's cloud-native platform is faster to deploy and easier to maintain.`,
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
  caseStudy: `ERP EXPERTS CLIENT PORTFOLIO — 350+ projects across manufacturing, distribution, ecommerce, field services, and professional services. Typical before: Disconnected systems requiring manual reconciliation, spreadsheet bridges, and delayed month-end close. Typical after: Unified platform with live visibility, automated workflows, and accelerated close cycles. Average month-end close reduction: 50-70%.`,
  objections: `
Common objections:
- "We're not big enough for an ERP" → At £5-10M revenue, the manual work of disconnected systems often costs more than an ERP investment. NetSuite scales from £2M to £500M+.
- "Our industry is too unique" → NetSuite's platform is industry-agnostic with deep vertical capabilities via modules. 350+ projects across 15+ verticals.
- "Implementation is risky" → ERP Experts' track record: zero abandoned implementations in 21 years. Fixed-price delivery with senior-led teams.`,
  competitorContext: `
If prospect uses Xero/Sage + multiple add-ons: The "best-of-breed" approach creates integration gaps and manual reconciliation. NetSuite replaces the patchwork with one unified platform.
If prospect is considering Dynamics Business Central: NetSuite is cloud-native with no on-premise infrastructure. Faster implementation, easier maintenance, better mobile experience.
If prospect is considering SAP Business One: NetSuite has better multi-entity, multi-currency, and international capabilities. Lower TCO and faster time-to-value.`,
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
  let formatted = `NETSUITE CAPABILITIES RELEVANT TO THIS INDUSTRY:
Modules: ${ctx.modules}

What NetSuite does for businesses like this:
${ctx.capabilities.trim()}

Structural pain points this typically addresses:
${ctx.painPoints.trim()}`

  if (ctx.caseStudy) {
    formatted += `

RELEVANT CASE STUDY:
${ctx.caseStudy.trim()}`
  }

  if (ctx.objections) {
    formatted += `

COMMON OBJECTIONS AND REBUTTALS:
${ctx.objections.trim()}`
  }

  if (ctx.competitorContext) {
    formatted += `

COMPETITOR POSITIONING GUIDANCE:
${ctx.competitorContext.trim()}`
  }

  return formatted
}
