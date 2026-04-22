/**
 * Apollo search query variants — rotates strategy per request to avoid
 * returning the same result set every time.
 *
 * Each variant mutates the base Apollo body with a different angle.
 */

export const APOLLO_VARIANTS = 6

export function buildVariantBody(
  industry: string,
  variantIndex: number,
  baseBody: Record<string, unknown>
): { body: Record<string, unknown>; label: string } {
  // Normalise index
  const idx = ((variantIndex % APOLLO_VARIANTS) + APOLLO_VARIANTS) % APOLLO_VARIANTS

  const body = { ...baseBody }

  // Base industry terms
  const industryMap: Record<string, string[]> = {
    Manufacturing: ['manufacturing'],
    'Wholesale Distribution': ['wholesale', 'distribution'],
    Ecommerce: ['ecommerce', 'e-commerce', 'online retail'],
    'Field Services': ['field service', 'services'],
    Construction: ['construction', 'contractor'],
    'Specialty Retail': ['retail', 'specialty retail'],
    'Professional Services': ['professional services', 'consulting'],
    Technology: ['technology', 'software', 'saas'],
    Healthcare: ['healthcare', 'health care', 'medical'],
    'Food & Beverage': ['food', 'beverage', 'food and beverage'],
    Automotive: ['automotive', 'auto'],
    'Aerospace & Defence': ['aerospace', 'defense'],
  }
  const industryTerms = industryMap[industry.trim()] || [industry.trim().toLowerCase()]

  switch (idx) {
    case 0: {
      // A. Keyword-focused (original)
      body.q_organization_keyword_tags = industryTerms
      return { body, label: 'keyword-focused' }
    }
    case 1: {
      // B. Competitor-system focused
      const competitorTerms = [...industryTerms, 'shopify', 'xero', 'sage', 'quickbooks']
      body.q_organization_keyword_tags = competitorTerms
      return { body, label: 'competitor-system' }
    }
    case 2: {
      // C. Pain-signal focused
      const painTerms = [...industryTerms, 'multi-site', 'international', 'warehouse', '3pl', 'subscription']
      body.q_organization_keyword_tags = painTerms
      return { body, label: 'pain-signal' }
    }
    case 3: {
      // D. Growth-stage focused
      const growthTerms = [...industryTerms, 'scaling', 'expansion']
      body.q_organization_keyword_tags = growthTerms
      return { body, label: 'growth-stage' }
    }
    case 4: {
      // E. Role-focused — search for companies that have ERP-relevant decision makers
      body.q_organization_keyword_tags = industryTerms
      body.person_titles = ['Finance Director', 'COO', 'Operations Director', 'Managing Director']
      return { body, label: 'role-focused' }
    }
    case 5: {
      // F. Location-spray — override location with a specific UK region/city to diversify
      const locations = [
        'United Kingdom',
        'England',
        'London',
        'Manchester',
        'Birmingham',
        'United Kingdom',
        'Bristol',
        'Leeds',
      ]
      const loc = locations[Math.floor(Math.random() * locations.length)]
      body.organization_locations = [loc]
      body.q_organization_keyword_tags = industryTerms
      return { body, label: `location-spray (${loc})` }
    }
    default: {
      body.q_organization_keyword_tags = industryTerms
      return { body, label: 'default' }
    }
  }
}
