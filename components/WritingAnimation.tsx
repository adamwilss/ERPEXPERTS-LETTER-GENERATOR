'use client'

import { motion } from 'framer-motion'

interface WritingAnimationProps {
  text?: string
  className?: string
}

export function WritingAnimation({ text = 'Writing your letter...', className = '' }: WritingAnimationProps) {
  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      <div className="relative w-48 h-24">
        {/* Paper sheet */}
        <motion.div
          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Lines on paper */}
        <div className="absolute inset-3 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-px bg-gray-100 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: 1.2,
                delay: 0.3 + i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Pen/pencil */}
        <motion.div
          className="absolute"
          initial={{ x: 12, y: 20, rotate: -15 }}
          animate={{
            x: [12, 140, 12, 140, 12],
            y: [20, 20, 44, 44, 68],
            rotate: [-15, -5, -15, -5, -15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.2, 0.4, 0.6, 0.8],
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            {/* Pencil body */}
            <rect x="6" y="2" width="6" height="18" rx="1" fill="#f59e0b" />
            <rect x="6" y="2" width="3" height="18" rx="1" fill="#fbbf24" />
            {/* Ferrule */}
            <rect x="5" y="20" width="8" height="3" rx="0.5" fill="#9ca3af" />
            {/* Eraser */}
            <rect x="5.5" y="23" width="7" height="3" rx="1" fill="#f87171" />
            {/* Tip */}
            <polygon points="9,2 12,0 15,2" fill="#d1d5db" />
            <polygon points="10.5,2 12,0 13.5,2" fill="#374151" />
          </svg>
        </motion.div>

        {/* Ink dot trail */}
        <motion.div
          className="absolute w-1 h-1 rounded-full bg-gray-800"
          style={{ left: 14, top: 24 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
        />
      </div>

      <motion.p
        className="text-sm font-semibold text-gray-500 dark:text-[#555]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {text}
      </motion.p>
    </div>
  )
}

export function SignatureAnimation({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block ${className}`}>
      <svg width="120" height="40" viewBox="0 0 120 40" fill="none" className="overflow-visible">
        <motion.path
          d="M5 28 C5 28, 8 10, 15 10 C22 10, 20 25, 25 25 C30 25, 35 15, 40 20 C45 25, 48 28, 55 28 L115 28"
          stroke="#1f2937"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="118"
          cy="28"
          r="2"
          fill="#1f2937"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.2 }}
        />
      </svg>
    </div>
  )
}
