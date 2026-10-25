function createTtlCache({ ttlMs = 5 * 60 * 1000, maxEntries = 128 } = {}) {
  const entries = new Map()
  const pending = new Map()

  return async function getOrLoad(key, loader) {
    const cacheKey = String(key)
    const now = Date.now()
    const cached = entries.get(cacheKey)

    if (cached && cached.expiresAt > now) {
      // Refresh insertion order so the size bound behaves like a small LRU.
      entries.delete(cacheKey)
      entries.set(cacheKey, cached)
      return cached.value
    }

    if (cached) entries.delete(cacheKey)
    if (pending.has(cacheKey)) return pending.get(cacheKey)

    const request = Promise.resolve()
      .then(loader)
      .then((value) => {
        entries.set(cacheKey, { value, expiresAt: Date.now() + ttlMs })
        while (entries.size > maxEntries) {
          entries.delete(entries.keys().next().value)
        }
        return value
      })
      .finally(() => pending.delete(cacheKey))

    pending.set(cacheKey, request)
    return request
  }
}

module.exports = createTtlCache
