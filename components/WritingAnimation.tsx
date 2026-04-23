'use client'

import { motion } from 'framer-motion'

interface WritingAnimationProps {
  text?: string
  className?: string
}

export function WritingAnimation({ text = 'Writing your letter...', className = '' }: WritingAnimationProps) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      <div className="relative w-72 h-20">
        {/* Scribble line — a jagged back-and-forth path */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox="0 0 288 80"
          fill="none"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M 10 40 Q 25 20, 40 45 T 70 30 T 100 50 T 130 25 T 160 55 T 190 20 T 220 50 T 250 30 T 278 40"
            stroke="url(#scribbleGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.45, 0.45, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.45, 0.65, 1],
            }}
          />
          {/* Second offset scribble for depth */}
          <motion.path
            d="M 15 48 Q 35 28, 55 52 T 90 38 T 125 58 T 155 32 T 185 55 T 215 28 T 245 52 T 270 38"
            stroke="url(#scribbleGrad2)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.25, 0.25, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
              times: [0, 0.45, 0.65, 1],
            }}
          />
          <defs>
            <linearGradient id="scribbleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#6b7280" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="scribbleGrad2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d1d5db" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#9ca3af" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d1d5db" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ink splatter dots along the scribble path */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"
            style={{
              left: `${8 + i * 11}%`,
              top: `${42 + Math.sin(i * 2.3) * 18}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2.5,
              delay: 0.4 + i * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Horizontal pencil — squiggly swinging motion */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ width: 52, height: 20, transformOrigin: '46px 10px' }}
          animate={{
            x: [4, 80, 140, 60, 170, 90, 20, 100, 4],
            y: [0, -8, 5, -6, 8, -4, 6, -7, 0],
            rotate: [-8, 12, -10, 14, -7, 11, -9, 13, -8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Pencil shadow */}
          <motion.div
            className="absolute top-3 left-2 w-10 h-2 bg-black/10 dark:bg-black/30 rounded-sm blur-sm"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <svg width="52" height="20" viewBox="0 0 52 20" fill="none" className="drop-shadow-sm overflow-visible">
            {/* Eraser */}
            <rect x="0" y="5" width="8" height="10" rx="3" fill="url(#eraserGrad)" />
            <rect x="0" y="6" width="8" height="2" rx="1" fill="rgba(255,255,255,0.2)" />

            {/* Ferrule */}
            <rect x="8" y="4" width="6" height="12" rx="1" fill="url(#metalGrad)" />
            <rect x="8" y="5" width="6" height="0.5" fill="rgba(255,255,255,0.3)" />

            {/* Body */}
            <rect x="14" y="6" width="24" height="8" rx="2" fill="url(#pencilGrad)" />
            <rect x="14" y="6" width="12" height="8" rx="2" fill="url(#pencilHighlight)" />

            {/* Wood tip */}
            <polygon points="38,6 38,14 46,10" fill="#d4a574" />
            {/* Lead tip */}
            <polygon points="42,8 42,12 46,10" fill="#1f2937" />
            {/* Tip highlight */}
            <polygon points="44,9 44,11 46,10" fill="rgba(255,255,255,0.4)" />

            <defs>
              <linearGradient id="pencilGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="pencilHighlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
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
        </motion.div>

        {/* Sparkles bursting from the pencil tip */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-emerald-400/70"
          style={{ left: '52%', top: '35%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: [0, 8], y: [0, -4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.2, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-amber-400/60"
          style={{ left: '58%', top: '55%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: [0, 6], y: [0, 5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute w-1 h-1 rounded-full bg-blue-400/60"
          style={{ left: '62%', top: '30%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, 10], y: [0, -6] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 1.0, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/50"
          style={{ left: '48%', top: '60%' }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], x: [0, -5], y: [0, 4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 1.4, ease: 'easeOut' }}
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
