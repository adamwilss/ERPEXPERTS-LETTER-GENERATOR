import { parseTechTable } from '@/lib/parse'

const relationshipColour: Record<string, string> = {
  Integrate: 'bg-blue-50 text-blue-700',
  Replace:   'bg-amber-50 text-amber-700',
  Eliminate: 'bg-red-50 text-red-600',
  Native:    'bg-green-50 text-green-700',
}

export default function TechMap({ content }: { content: string }) {
  const { rows, before, after } = parseTechTable(content)

  // Extract title and subtitle from before text
  const lines = before.split('\n').filter(Boolean)
  const title = lines.find((l) => l.startsWith('TITLE:'))?.replace('TITLE:', '').trim() ?? ''
  const subtitle = lines.find((l) => l.startsWith('SUBTITLE:'))?.replace('SUBTITLE:', '').trim() ?? ''

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left font-semibold text-gray-700 py-3 pr-6 w-40">System</th>
                <th className="text-left font-semibold text-gray-700 py-3 pr-6 w-32">Relationship</th>
                <th className="text-left font-semibold text-gray-700 py-3">What it means</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 pr-6 font-medium text-gray-900 align-top">{row.system}</td>
                  <td className="py-3 pr-6 align-top">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${relationshipColour[row.relationship] ?? 'bg-gray-100 text-gray-600'}`}>
                      {row.relationship}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600 leading-relaxed align-top">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {after && (
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-600 whitespace-pre-line">
          {after}
        </div>
      )}
    </div>
  )
}
