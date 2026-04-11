'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Send,
  MessageCircle,
  Users,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { loadHistory, type SavedPack, type PackStatus } from '@/lib/history'
import { loadTemplates } from '@/lib/templates'

// ── Types ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: typeof TrendingUp
  color: string
}

// ── Components ─────────────────────────────────────────────────────────────────

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change && change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-5 shadow-sm dark:shadow-none"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-[#555] mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isPositive ? (
                <><ArrowUpRight className="w-3 h-3" /> +</>
              ) : (
                <><ArrowDownRight className="w-3 h-3" /></>
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  )
}

function SimpleBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3"
        >
          <div className="w-24 text-xs text-gray-500 dark:text-[#555] truncate">{item.label}</div>
          <div className="flex-1 h-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`h-full rounded-full ${color}`}
            />
          </div>
          <div className="w-8 text-xs text-gray-700 dark:text-gray-300 text-right">{item.value}</div>
        </motion.div>
      ))}
    </div>
  )
}

function FunnelChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className="space-y-1">
      {data.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative"
        >
          <div
            className={`${item.color} rounded-lg p-3 flex items-center justify-between`}
            style={{ width: `${Math.max((item.value / max) * 100, 30)}%` }}
          >
            <span className="text-xs font-medium text-white">{item.label}</span>
            <span className="text-xs text-white/80">{item.value}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [packs, setPacks] = useState<SavedPack[]>([])
  const [period, setPeriod] = useState<7 | 30 | 90>(30)

  useEffect(() => {
    setPacks(loadHistory())
  }, [])

  const analytics = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period)

    const recentPacks = packs.filter((p) => new Date(p.date) >= cutoff)

    // Status breakdown
    const byStatus = recentPacks.reduce(
      (acc, p) => {
        const status = p.status ?? 'unsent'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<PackStatus | 'unsent', number>
    )

    // By industry
    const byIndustry = recentPacks
      .filter((p) => p.outcomes?.responseType)
      .reduce(
        (acc, p) => {
          const industry = p.industry || 'Unknown'
          if (!acc[industry]) acc[industry] = { total: 0, positive: 0 }
          acc[industry].total++
          if (p.outcomes?.responseType === 'positive') acc[industry].positive++
          return acc
        },
        {} as Record<string, { total: number; positive: number }>
      )

    // Response rate calculation
    const totalSent = (byStatus.sent || 0) + (byStatus.responded || 0) + (byStatus.meeting || 0)
    const totalResponses = (byStatus.responded || 0) + (byStatus.meeting || 0) * 2 // Weight meetings higher
    const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0

    // Template performance
    const templates = loadTemplates()
    const topTemplate = templates.sort((a, b) => {
      const aRate = (a.responseCount || 0) / Math.max(a.usageCount, 1)
      const bRate = (b.responseCount || 0) / Math.max(b.usageCount, 1)
      return bRate - aRate
    })[0]

    // Activity by week
    const byWeek = recentPacks.reduce(
      (acc, p) => {
        const week = new Date(p.date).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
        })
        acc[week] = (acc[week] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: recentPacks.length,
      sent: totalSent,
      responseRate,
      meetings: byStatus.meeting || 0,
      byStatus,
      byIndustry,
      topTemplate,
      byWeek,
      avgErpScore: recentPacks.length > 0
        ? recentPacks.reduce((sum, p) => sum + (p.erpScore || 0), 0) / recentPacks.length
        : 0,
    }
  }, [packs, period])

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#555] mt-1">
              Track your outreach performance and conversion metrics
            </p>
          </div>

          <div className="flex gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === d
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>
        </div>

        {packs.length === 0 ? (
          <div className="text-center py-24 text-gray-300 dark:text-[#333]">
            <p className="text-sm">No data yet. Generate some letters to see analytics.</p>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <MetricCard
                title="Total Generated"
                value={analytics.total}
                icon={Send}
                color="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
              />
              <MetricCard
                title="Sent"
                value={analytics.sent}
                icon={Target}
                color="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              />
              <MetricCard
                title="Response Rate"
                value={`${analytics.responseRate.toFixed(1)}%`}
                icon={MessageCircle}
                color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              />
              <MetricCard
                title="Meetings Booked"
                value={analytics.meetings}
                icon={Users}
                color="bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-6 shadow-sm dark:shadow-none"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-6">
                  Conversion Funnel
                </h3>
                <FunnelChart
                  data={[
                    {
                      label: 'Generated',
                      value: analytics.total,
                      color: 'bg-gray-500',
                    },
                    {
                      label: 'Sent',
                      value: analytics.sent,
                      color: 'bg-blue-500',
                    },
                    {
                      label: 'Responded',
                      value: (analytics.byStatus.responded || 0) + (analytics.byStatus.meeting || 0),
                      color: 'bg-amber-500',
                    },
                    {
                      label: 'Meetings',
                      value: analytics.meetings,
                      color: 'bg-emerald-500',
                    },
                  ]}
                />
              </motion.div>

              {/* Performance by Industry */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-6 shadow-sm dark:shadow-none"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-6">
                  Response Rate by Industry
                </h3>
                {Object.keys(analytics.byIndustry).length > 0 ? (
                  <SimpleBarChart
                    data={Object.entries(analytics.byIndustry).map(([industry, data]) => ({
                      label: industry.slice(0, 12),
                      value: Math.round((data.positive / data.total) * 100),
                    }))}
                    color="bg-emerald-500"
                  />
                ) : (
                  <p className="text-sm text-gray-400">No response data yet.</p>
                )}
              </motion.div>

              {/* Activity Over Time */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-6 shadow-sm dark:shadow-none col-span-2"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-6">
                  Activity Over Time
                </h3>
                <div className="flex items-end gap-2 h-32"
                >
                  {Object.entries(analytics.byWeek).map(([week, count], i) => (
                    <motion.div
                      key={week}
                      initial={{ height: 0 }}
                      animate={{ height: `${(count / Math.max(...Object.values(analytics.byWeek))) * 100}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-t transition-colors relative group"
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {count}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400"
                >
                  {Object.keys(analytics.byWeek).map((week) => (
                    <span key={week} className="flex-1 text-center">{week}</span>
                  ))}
                </div>
              </motion.div>

              {/* Template Performance */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1e1e1e] rounded-xl p-6 shadow-sm dark:shadow-none col-span-2"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Top Performing Template
                </h3>
                {analytics.topTemplate ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{analytics.topTemplate.name}</p>
                      <p className="text-xs text-gray-500">{analytics.topTemplate.industry}</p>
                    </div>
                    <div className="text-right"
                    >
                      <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        {Math.round(
                          ((analytics.topTemplate.responseCount || 0) /
                            Math.max(analytics.topTemplate.usageCount, 1)) *
                            100
                        )}
                        %
                      </p>
                      <p className="text-xs text-gray-400"
                      >
                        {analytics.topTemplate.usageCount} uses
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No templates saved yet.</p>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-gray-300 dark:text-[#333] border-t border-gray-200 dark:border-[#1e1e1e]">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
