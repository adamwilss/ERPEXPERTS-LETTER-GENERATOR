import type { StatBlock } from '@/lib/parse'

export default function CalloutStat({ stat }: { stat: StatBlock }) {
  return (
    <div className="my-8 flex gap-5 border-l-[3px] border-gray-800 pl-6">
      <div className="flex-1">
        <div className="text-[28px] font-bold text-gray-900 leading-none tracking-tight mb-2">
          {stat.headline}
        </div>
        <p className="text-[14px] text-gray-700 leading-relaxed font-sans">{stat.body}</p>
        {stat.source && (
          <p className="text-[11px] text-gray-400 mt-2 tracking-wide font-sans">Source: {stat.source}</p>
        )}
      </div>
    </div>
  )
}
