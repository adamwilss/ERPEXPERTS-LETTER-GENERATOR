'use client'

import { motion } from 'framer-motion'

interface WritingAnimationProps {
  text?: string
  className?: string
}

export function WritingAnimation({ text = 'Writing your letter...', className = '' }: WritingAnimationProps) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="relative w-20 h-36">
        {/* Dust / particles rising from the tip */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 rounded-full"
            style={{
              width: 2 + i * 0.5,
              height: 2 + i * 0.5,
              bottom: 0,
              marginLeft: -1 - i * 0.25,
              background: i % 2 === 0 ? '#9ca3af' : '#d1d5db',
            }}
            animate={{
              y: [0, -8 - i * 4, -16 - i * 6],
              x: [(i - 2) * 2, (i - 2) * 3, (i - 1) * 4],
              opacity: [0, 0.5, 0],
              scale: [0.5, 1, 0.3],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.18,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Faint scribble arc under the tip */}
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-6 overflow-visible"
          viewBox="0 0 64 24"
          fill="none"
        >
          <motion.path
            d="M 4 20 Q 16 8, 32 18 T 60 14"
            stroke="#d1d5db"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.4, 0.4, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>

        {/* Vertical pencil — tip is the pivot */}
        <motion.div
          className="absolute bottom-0 left-1/2"
          style={{
            width: 20,
            height: 88,
            marginLeft: -10,
            transformOrigin: '10px 88px',
          }}
          animate={{
            rotate: [-14, 10, -18, 22, -10, 16, -20, 12, -14],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Pencil shadow */}
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/10 dark:bg-black/30 rounded-full blur-sm"
            animate={{ opacity: [0.3, 0.5, 0.3], scaleX: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <svg width="20" height="88" viewBox="0 0 20 88" fill="none" className="drop-shadow-sm">
            {/* Eraser top */}
            <rect x="4" y="0" width="12" height="12" rx="4" fill="url(#eraserGradV)" />
            <rect x="4" y="1" width="12" height="2" rx="1" fill="rgba(255,255,255,0.2)" />

            {/* Ferrule */}
            <rect x="3" y="12" width="14" height="8" rx="2" fill="url(#metalGradV)" />
            <rect x="3" y="13" width="14" height="1" fill="rgba(255,255,255,0.3)" />

            {/* Body */}
            <rect x="5" y="20" width="10" height="56" rx="1" fill="url(#pencilGradV)" />
            <rect x="5" y="20" width="5" height="56" rx="1" fill="url(#pencilHighlightV)" />

            {/* Wood cone */}
            <polygon points="5,76 15,76 10,84" fill="#d4a574" />
            {/* Lead tip */}
            <polygon points="8,82 12,82 10,88" fill="#1f2937" />
            {/* Tip highlight */}
            <polygon points="9.5,84.5 10.5,84.5 10,86" fill="rgba(255,255,255,0.4)" />

            <defs>
              <linearGradient id="pencilGradV" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="pencilHighlightV" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="metalGradV" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="50%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#9ca3af" />
              </linearGradient>
              <linearGradient id="eraserGradV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
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
