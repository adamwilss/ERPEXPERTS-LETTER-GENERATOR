'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Check,
  X,
  Calendar,
  Bell,
  AlertCircle,
  ChevronRight,
  Mail,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
import {
  loadReminders,
  updateReminderStatus,
  snoozeReminder,
  deleteReminder,
  getPendingReminders,
  getOverdueReminders,
  type Reminder,
} from '@/lib/reminders'

// ── Components ─────────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  onUpdate,
}: {
  reminder: Reminder
  onUpdate: () => void
}) {
  const isOverdue = new Date(reminder.dueDate) < new Date() && reminder.status === 'pending'
  const daysUntil = Math.ceil(
    (new Date(reminder.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleComplete = () => {
    updateReminderStatus(reminder.id, 'completed')
    onUpdate()
  }

  const handleDismiss = () => {
    updateReminderStatus(reminder.id, 'dismissed')
    onUpdate()
  }

  const handleSnooze = () => {
    snoozeReminder(reminder.id, 3)
    onUpdate()
  }

  const handleDelete = () => {
    deleteReminder(reminder.id)
    onUpdate()
  }

  const typeLabels: Record<Reminder['type'], string> = {
    followup1: 'First Follow-up',
    followup2: 'Second Follow-up',
    breakup: 'Final Email',
    custom: 'Custom Reminder',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-white dark:bg-[#111] border rounded-xl p-4 shadow-sm dark:shadow-none ${
        isOverdue
          ? 'border-red-200 dark:border-red-500/30'
          : 'border-gray-200 dark:border-[#1e1e1e]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isOverdue
              ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              : reminder.status === 'snoozed'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
              : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          }`}
        >
          {isOverdue ? (
            <AlertCircle className="w-4 h-4" />
          ) : reminder.status === 'snoozed' ? (
            <Clock className="w-4 h-4" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {reminder.company}
            </h3>
            {isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded">
                Overdue
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-[#555] mt-0.5">
            {typeLabels[reminder.type]} · {reminder.recipientName}
          </p>

          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span
              className={`text-xs ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-500 dark:text-[#555]'
              }`}
            >
              {isOverdue
                ? `${Math.abs(daysUntil)} day${
                    Math.abs(daysUntil) !== 1 ? 's' : ''
                  } overdue`
                : daysUntil === 0
                ? 'Due today'
                : daysUntil === 1
                ? 'Tomorrow'
                : `In ${daysUntil} days`}
            </span>
          </div>

          {reminder.suggestedAction && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded">
              💡 {reminder.suggestedAction}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isOverdue && reminder.status !== 'snoozed' && (
            <button
              onClick={handleSnooze}
              className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Snooze 3 days"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleComplete}
            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Mark complete"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('all')

  useEffect(() => {
    setReminders(loadReminders())
  }, [])

  const refresh = () => setReminders(loadReminders())

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'overdue')
      return r.status === 'pending' && new Date(r.dueDate) < new Date()
    return r.status === 'pending' || r.status === 'snoozed'
  })

  const pendingCount = reminders.filter(
    (r) => r.status === 'pending' || r.status === 'snoozed'
  ).length
  const overdueCount = getOverdueReminders().length

  return (
    <main className="min-h-[calc(100vh-52px)]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight">
              Follow-up Reminders
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#555] mt-1">
              Never lose track of your outreach opportunities
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {pendingCount}
              </div>
              <div className="text-xs text-gray-500">pending</div>
            </div>
            {overdueCount > 0 && (
              <div className="text-right">
                <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {overdueCount}
                </div>
                <div className="text-xs text-red-500">overdue</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'overdue'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 dark:bg-[#333] rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
              {f === 'overdue' && overdueCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full text-[10px]">
                  {overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reminders List */}
        {filteredReminders.length === 0 ? (
          <div className="text-center py-24 text-gray-300 dark:text-[#333]">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              {filter === 'overdue'
                ? 'No overdue reminders. Great job!'
                : 'No reminders yet. When you send letters, follow-up reminders will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onUpdate={refresh}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-[11px] text-gray-300 dark:text-[#333] border-t border-gray-200 dark:border-[#1e1e1e]">
        ERP Experts Ltd · Internal Outreach Generation Portal
      </footer>
    </main>
  )
}
