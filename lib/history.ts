import {
  loadHistoryFromDB,
  savePackToDB,
  updatePackStatusInDB,
  deletePackFromDB,
  updateOutcomeInDB,
  initializeSequenceInDB,
  loadSequencesForPack,
  updateSequenceStatusInDB,
  updateSequenceContentInDB,
  type SavedPack as DBSavedPack,
  type PackStatus as DBPackStatus,
  type OutcomeData as DBOutcomeData,
  type SequenceStatus as DBSequenceStatus,
  type SequenceStage as DBSequenceStage,
} from './db/history-db';

// Re-export types for compatibility
export type PackStatus = DBPackStatus;
export type SequenceStage = DBSequenceStage;
export type SequenceStatus = DBSequenceStatus;
export type OutcomeData = DBOutcomeData;

// Extended SavedPack with client-side fields
export interface SavedPack extends DBSavedPack {
  // No additional fields currently, but extensible
}

// LocalStorage key (now used as cache only)
const KEY = 'erp_letter_history';
const MAX = 100;

// Track if Postgres is available
let postgresAvailable = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 30000; // 30 seconds

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Initialize Postgres connection check
async function checkPostgres(): Promise<boolean> {
  try {
    const res = await fetch('/api/history', { method: 'GET' });
    postgresAvailable = res.ok;
    return postgresAvailable;
  } catch {
    postgresAvailable = false;
    return false;
  }
}

// Load from localStorage (cache)
function loadFromCache(): SavedPack[] {
  if (!isBrowser) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

// Save to localStorage (cache)
function saveToCache(packs: SavedPack[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(packs.slice(0, MAX)));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
}

// Load history - tries Postgres first, falls back to cache
export async function loadHistory(): Promise<SavedPack[]> {
  // First check cache for immediate response
  const cache = loadFromCache();

  // Try to sync from Postgres
  try {
    const postgresPacks = await loadHistoryFromDB();
    if (postgresPacks.length > 0) {
      // Update cache with Postgres data
      saveToCache(postgresPacks);
      postgresAvailable = true;
      lastSyncTime = Date.now();
      return postgresPacks;
    }
  } catch (error) {
    console.warn('Postgres load failed, using cache:', error);
    postgresAvailable = false;
  }

  return cache;
}

// Sync function - background sync from Postgres to cache
export async function syncFromPostgres(): Promise<void> {
  if (Date.now() - lastSyncTime < SYNC_INTERVAL) return;

  try {
    const packs = await loadHistoryFromDB();
    saveToCache(packs);
    postgresAvailable = true;
    lastSyncTime = Date.now();
  } catch (error) {
    console.warn('Sync failed:', error);
    postgresAvailable = false;
  }
}

// Save pack - write-through to Postgres + cache
export async function savePack(
  pack: Omit<SavedPack, 'id' | 'date'>
): Promise<SavedPack> {
  // Always save to Postgres first
  let saved: SavedPack;
  try {
    saved = await savePackToDB(pack);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres save failed, using cache only:', error);
    postgresAvailable = false;
    // Fallback: create local-only pack
    saved = {
      ...pack,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
    };
  }

  // Update cache
  const cache = loadFromCache();
  const today = new Date().toDateString();
  const filtered = cache.filter(
    (h) => !(h.company === saved.company && h.recipientName === saved.recipientName && new Date(h.date).toDateString() === today)
  );
  const updated = [saved, ...filtered].slice(0, MAX);
  saveToCache(updated);

  return saved;
}

// Update pack status - Postgres + cache
export async function updatePackStatus(
  id: string,
  status: PackStatus | undefined
): Promise<void> {
  // Update Postgres
  try {
    await updatePackStatusInDB(id, status);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres update failed:', error);
    postgresAvailable = false;
  }

  // Update cache
  const cache = loadFromCache();
  const updated = cache.map((h) => (h.id === id ? { ...h, status } : h));
  saveToCache(updated);
}

// Delete pack - Postgres + cache
export async function deletePack(id: string): Promise<void> {
  // Delete from Postgres
  try {
    await deletePackFromDB(id);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres delete failed:', error);
    postgresAvailable = false;
  }

  // Delete from cache
  const cache = loadFromCache();
  const updated = cache.filter((h) => h.id !== id);
  saveToCache(updated);
}

// Clear all history
export async function clearHistory(): Promise<void> {
  // Clear Postgres
  try {
    const { clearAllHistoryFromDB } = await import('./db/history-db');
    await clearAllHistoryFromDB();
  } catch (error) {
    console.warn('Postgres clear failed:', error);
  }

  // Clear cache
  if (isBrowser) {
    localStorage.removeItem(KEY);
  }
}

// Initialize sequence
export async function initializeSequence(packId: string): Promise<void> {
  try {
    await initializeSequenceInDB(packId);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres sequence init failed:', error);
    postgresAvailable = false;
  }

  // Update cache
  const cache = loadFromCache();
  const updated = cache.map((h) =>
    h.id === packId
      ? {
          ...h,
          sequenceStatus: {
            initial: 'pending' as const,
            followup1: 'locked' as const,
            followup2: 'locked' as const,
            breakup: 'locked' as const,
          },
          sequenceContent: {},
        }
      : h
  );
  saveToCache(updated);
}

// Update sequence status
export async function updateSequenceStatus(
  packId: string,
  stage: keyof SequenceStatus,
  status: SequenceStage | 'locked'
): Promise<void> {
  try {
    await updateSequenceStatusInDB(packId, stage, status);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres sequence update failed:', error);
    postgresAvailable = false;
  }

  // Update cache
  const cache = loadFromCache();
  const updated = cache.map((h) =>
    h.id === packId
      ? {
          ...h,
          sequenceStatus: {
            ...(h.sequenceStatus ?? {
              initial: 'pending',
              followup1: 'locked',
              followup2: 'locked',
              breakup: 'locked',
            }),
            [stage]: status,
          },
        }
      : h
  );
  saveToCache(updated);
}

// Update sequence content
export async function updateSequenceContent(
  packId: string,
  stage: keyof SequenceStatus,
  content: string
): Promise<void> {
  try {
    await updateSequenceContentInDB(packId, stage, content);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres sequence content update failed:', error);
    postgresAvailable = false;
  }

  // Update cache
  const cache = loadFromCache();
  const updated = cache.map((h) =>
    h.id === packId
      ? {
          ...h,
          sequenceContent: { ...(h.sequenceContent ?? {}), [stage]: content },
          sequenceStatus: {
            ...(h.sequenceStatus ?? {
              initial: 'pending',
              followup1: 'locked',
              followup2: 'locked',
              breakup: 'locked',
            }),
            [stage]: 'ready',
          },
        }
      : h
  );
  saveToCache(updated);
}

// Unlock next stage
export async function unlockNextStage(
  packId: string,
  currentStage: keyof SequenceStatus
): Promise<void> {
  const stageOrder: (keyof SequenceStatus)[] = ['initial', 'followup1', 'followup2', 'breakup'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const nextStage = stageOrder[currentIndex + 1];

  if (!nextStage) return;

  await updateSequenceStatus(packId, nextStage, 'pending');
}

// Update outcome
export async function updatePackOutcome(
  packId: string,
  outcome: Partial<OutcomeData>
): Promise<void> {
  try {
    await updateOutcomeInDB(packId, outcome);
    postgresAvailable = true;
  } catch (error) {
    console.warn('Postgres outcome update failed:', error);
    postgresAvailable = false;
  }

  // Update cache
  const cache = loadFromCache();
  const updated = cache.map((h) =>
    h.id === packId ? { ...h, outcomes: { ...(h.outcomes ?? {}), ...outcome } } : h
  );
  saveToCache(updated);
}

// Mark as sent
export async function markAsSent(packId: string): Promise<void> {
  const now = new Date().toISOString();
  await updatePackStatus(packId, 'sent');
  await updatePackOutcome(packId, { sentDate: now });
}

// Record response
export async function recordResponse(
  packId: string,
  type: 'positive' | 'neutral' | 'negative',
  meetingBooked?: boolean,
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  await updatePackOutcome(packId, {
    responseDate: now,
    responseType: type,
    meetingBooked,
    notes,
  });

  if (type === 'positive') {
    await updatePackStatus(packId, meetingBooked ? 'meeting' : 'responded');
  } else if (type === 'negative') {
    await updatePackStatus(packId, 'not_interested');
  } else {
    await updatePackStatus(packId, 'responded');
  }
}

// Legacy synchronous functions (for backward compatibility)
// These will be deprecated - use async versions instead
export function loadHistorySync(): SavedPack[] {
  return loadFromCache();
}

export function savePackSync(pack: Omit<SavedPack, 'id' | 'date'>): SavedPack {
  const saved: SavedPack = {
    ...pack,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  const cache = loadFromCache();
  const today = new Date().toDateString();
  const filtered = cache.filter(
    (h) => !(h.company === saved.company && h.recipientName === saved.recipientName && new Date(h.date).toDateString() === today)
  );
  const updated = [saved, ...filtered].slice(0, MAX);
  saveToCache(updated);

  // Async save to Postgres (fire and forget)
  savePackToDB(pack).catch((err) => console.warn('Background Postgres save failed:', err));

  return saved;
}
