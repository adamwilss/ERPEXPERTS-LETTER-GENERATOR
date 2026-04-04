export async function fetchResearch(url: string, company: string): Promise<string> {
  const parts: string[] = []

  // Primary: Jina Reader — converts any URL to clean markdown, no API key needed
  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetch(jinaUrl, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'markdown' },
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.length > 100) {
        parts.push(`=== Website content (${url}) ===\n${text.slice(0, 9000)}`)
      }
    }
  } catch {
    // Jina failed — continue to Tavily
  }

  // Supplement: Tavily web search
  const tavilyKey = process.env.TAVILY_API_KEY
  if (tavilyKey) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${company} company what they sell business model ERP systems`,
          search_depth: 'basic',
          max_results: 5,
          include_answer: false,
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ title: string; content: string; url: string }> }
        const snippets = data.results
          ?.map((r) => `${r.title}\n${r.content}`)
          .join('\n\n')
        if (snippets) {
          parts.push(`=== Web search results for "${company}" ===\n${snippets.slice(0, 4000)}`)
        }
      }
    } catch {
      // Tavily failed — not critical
    }
  }

  if (parts.length === 0) {
    return `No web content could be retrieved for ${company} (${url}). Use business inference based on the company name, URL structure, and any domain knowledge. Do not invent facts — infer carefully.`
  }

  return parts.join('\n\n')
}
