function handleContentVisitGetGuarded_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const eventId = String(params.eventId || '').trim();
  if (!eventId) return handleContentVisitGet_(e);

  const cache = CacheService.getScriptCache();
  const key = 'content-visit-request:' + eventId;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (cache.get(key)) {
      return contentVisitJson_({ ok: true, duplicate: true, eventId: eventId });
    }
    cache.put(key, 'processing', 21600);
  } finally {
    lock.releaseLock();
  }

  try {
    const result = recordContentVisit_(params);
    if (!result || result.ok !== true) cache.remove(key);
    return contentVisitJson_(result);
  } catch (err) {
    cache.remove(key);
    return contentVisitJson_({
      ok: false,
      eventId: eventId,
      error: String(err && err.message ? err.message : err),
    });
  }
}
