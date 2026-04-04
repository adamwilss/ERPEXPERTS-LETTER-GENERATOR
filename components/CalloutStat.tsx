import type { StatBlock } from '@/lib/parse'

export default function CalloutStat({ stat }: { stat: StatBlock }) {
  return (
    <div className="border-l-4 border-gray-900 bg-gray-50 pl-5 pr-4 py-4 my-6 rounded-r-lg">
      <div className="text-2xl font-bold text-gray-900 mb-1">{stat.headline}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{stat.body}</p>
      {stat.source && (
        <p className="text-xs text-gray-400 mt-2">Source: {stat.source}</p>
      )}
    </div>
  )
}
