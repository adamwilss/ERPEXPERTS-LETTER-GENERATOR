'use client'

import { motion } from 'framer-motion'

interface WritingAnimationProps {
  text?: string
  className?: string
}

export function WritingAnimation({ text = 'Writing your letter...', className = '' }: WritingAnimationProps) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="relative w-52 h-28">
        {/* Paper shadow */}
        <motion.div
          className="absolute -bottom-1 left-1 right-1 h-4 bg-black/[0.04] dark:bg-black/[0.15] rounded-full blur-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Paper sheet */}
        <motion.div
          className="absolute inset-0 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-100 dark:border-[#222]"
          initial={{ opacity: 0, y: 8, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Paper subtle inner glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white via-transparent to-gray-50/50 dark:from-[#1a1a1a] dark:to-[#111]/50" />
        </motion.div>

        {/* Lines on paper with staggered draw */}
        <div className="absolute inset-4 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-px rounded-full"
              style={{
                background: i === 3
                  ? 'linear-gradient(90deg, #e5e7eb 60%, transparent)'
                  : '#e5e7eb',
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: i === 3 ? '70%' : '100%', opacity: 1 }}
              transition={{
                duration: 1,
                delay: 0.4 + i * 0.25,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Writing hand / pencil */}
        <motion.div
          className="absolute"
          initial={{ x: 14, y: 22 }}
          animate={{
            x: [14, 150, 14, 150, 14, 120, 14],
            y: [22, 22, 42, 42, 62, 82, 102],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.15, 0.28, 0.42, 0.55, 0.7, 0.85],
          }}
        >
          {/* Pencil body with 3D depth */}
          <div className="relative">
            {/* Pencil shadow */}
            <motion.div
              className="absolute top-1 left-1 w-5 h-16 bg-black/10 dark:bg-black/30 rounded-sm blur-sm"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <svg width="32" height="36" viewBox="0 0 32 36" fill="none" className="drop-shadow-sm">
              {/* Main body - amber gradient */}
              <rect x="8" y="4" width="7" height="20" rx="1.5" fill="url(#pencilGrad)" />
              <rect x="8" y="4" width="3.5" height="20" rx="1.5" fill="url(#pencilHighlight)" />

              {/* Ferrule - metallic */}
              <rect x="7" y="24" width="9" height="4" rx="1" fill="url(#metalGrad)" />
              <rect x="7" y="25" width="9" height="0.5" fill="rgba(255,255,255,0.3)" />

              {/* Eraser */}
              <rect x="7.5" y="28" width="8" height="5" rx="1.5" fill="url(#eraserGrad)" />
              <rect x="7.5" y="28.5" width="8" height="1" rx="0.5" fill="rgba(255,255,255,0.2)" />

              {/* Pencil tip - wood */}
              <polygon points="11.5,4 15,0 18.5,4" fill="#d4a574" />
              <polygon points="13,4 15,1.5 17,4" fill="#1f2937" />

              {/* Tip highlight */}
              <polygon points="15,1.5 15.5,2.5 14.5,2.5" fill="rgba(255,255,255,0.4)" />

              <defs>
                <linearGradient id="pencilGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="pencilHighlight" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="50%" stopColor="#d1d5db" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
                <linearGradient id="eraserGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="100%" stopColor="#f87171" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </motion.div>

        {/* Ink trail dots following the pencil */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-gray-800 dark:bg-gray-300"
              style={{
                left: `${18 + i * 22}%`,
                top: `${26 + (i % 2) * 18}%`,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 2,
                delay: 0.8 + i * 0.35,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Sparkle effects near pencil tip */}
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/60"
          style={{ left: '28%', top: '18%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute w-1 h-1 rounded-full bg-amber-400/50"
          style={{ left: '65%', top: '35%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
        />
        <motion.div
          className="absolute w-1 h-1 rounded-full bg-blue-400/50"
          style={{ left: '32%', top: '55%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1.8 }}
        />
      </div>

      {/* Text with typing cursor */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span className="text-sm font-semibold text-gray-500 dark:text-[#555]">
          {text}
        </span>
        <motion.span
          className="inline-block w-0.5 h-4 bg-emerald-400 rounded-full"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </motion.div>
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
