'use client'

import type { StatBlock } from '@/lib/parse'
import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

function AnimatedCounter({ text }: { text: string }) {
  // Try to find a number in the headline and animate it
  const match = text.match(/([\d,]+(?:\.\d+)?)(%| days| weeks| hours| minutes|x|×|X)?/)
  if (!match) {
    return <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{text}</span>
  }

  const [prefix, suffix] = text.split(match[0])
  const rawNum = parseFloat(match[1].replace(/,/g, ''))
  const unit = match[2] ?? ''

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 40, damping: 15 })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      const isFloat = match[1].includes('.')
      const formatted = isFloat ? v.toFixed(1) : Math.round(v).toLocaleString()
      setDisplay(formatted + unit)
    })
    motionValue.set(rawNum)
    return unsubscribe
  }, [rawNum, unit, motionValue, springValue, match])

  return (
    <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

export default function CalloutStat({ stat }: { stat: StatBlock }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="my-8 flex gap-5 border-l-[3px] border-gray-800 pl-6"
    >
      <div className="flex-1">
        <AnimatedCounter text={stat.headline} />
        <p className="text-[14px] text-gray-700 leading-relaxed font-sans mt-2">{stat.body}</p>
        {stat.source && (
          <p className="text-[11px] text-gray-400 mt-2 tracking-wide font-sans">Source: {stat.source}</p>
        )}
      </div>
    </motion.div>
  )
}
