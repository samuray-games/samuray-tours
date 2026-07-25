const OWNER_EMAIL = 'raykhalit@icloud.com';
const SOURCE_LABEL = 'Каталог SamuRay Tours';
const DEFAULT_NOTION_VERSION = '2026-03-11';
const ROUTES_DATA_SOURCE_FALLBACK = '3242a1d2-b113-46a3-abe5-942bed2a94d2';
const BOOKING_DATA_SOURCE_FALLBACK = '5224b52a-a119-4c48-be60-e258a0d1bcc7';
const ROUTE_CANONICALS_ = [
  { title: '3D Токио - Мэйдзи Дзингу, Харадзюку, Сибуя', aliases: ['3D Токио', '3d tokyo'] },
  { title: 'Асакуса: из Эдо в Токио', aliases: ['Асакуса', 'asakusa'] },
  { title: 'Цукидзи + Гиндза', aliases: ['Цукидзи + Гиндза', 'Цукидзи Гиндза', 'tsukiji', 'tsukiji ginza'] },
  { title: 'Акихабара + Амэёко', aliases: ['Акихабара + Амэёко', 'Акихабара Амэёко', 'akihabara', 'akiba'] },
  { title: 'Янака + Нэзу', aliases: ['Янака + Нэзу', 'Янака Нэзу', 'yanaka'] },
  { title: 'Архитектурный центр Токио', aliases: ['Архитектурный центр Токио', 'architecture'] },
  { title: 'Сады города', aliases: ['Сады города', 'gardens'] },
  { title: 'Депачика: гастрономический лабиринт', aliases: ['Депачика: гастрономический лабиринт', 'depachika'] },
  { title: 'Сакура / Момидзи', aliases: ['Сакура / Момидзи', 'season'] },
  { title: 'Синдзюку: неон и Голден Гай', aliases: ['Синдзюку: неон и Голден Гай', 'Синдзюку', 'shinjuku'] },
  { title: 'Классический Токио за день', aliases: ['Классический Токио за день', 'classic'] },
  { title: 'Современность & традиционность', aliases: ['Современность & традиционность', 'contrast'] },
  { title: 'Сады и храмы Токио', aliases: ['Сады и храмы Токио', 'temples'] },
  { title: 'Кулинарный Токио', aliases: ['Кулинарный Токио', 'culinary'] },
  { title: 'Ночной Токио', aliases: ['Ночной Токио', 'nightfull'] },
  { title: 'Токио Экспресс', aliases: ['Токио Экспресс', 'express'] },
  { title: 'Токио для семей с детьми', aliases: ['Токио для семей с детьми', 'family'] },
  { title: 'Классика + Императорские сады', aliases: ['Классика + Императорские сады', 'imperial'] },
  { title: 'Одайба и Токийский залив', aliases: ['Одайба и Токийский залив', 'odaiba'] },
];


function doGet() {
  return jsonResponse_({ ok: true, service: 'SamuRay Tours applications' });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const state = loadTransactionState_(payload) || {};
      if (state.complete && state.notion && state.calendar && state.email) {
        return jsonResponse_({ ok: true, duplicate: true, notion: state.notion, calendar: state.calendar, email: state.email });
      }

      if (!state.rawPayload) {
        state.rawPayload = snapshotPayload_(payload);
      }

      let notionResult = state.notion || null;
      let calendarResult = state.calendar || null;
      let emailResult = state.email || null;

      if (!notionResult) {
        notionResult = createNotionRecord_(payload);
        state.notion = notionResult;
        state.notionCreatedAt = new Date().toISOString();
        saveTransactionState_(payload, state);
      }

      if (!calendarResult) {
        try {
          calendarResult = createCalendarEvent_(payload, notionResult);
          state.calendar = calendarResult;
          state.calendarCreatedAt = new Date().toISOString();
          saveTransactionState_(payload, state);
        } catch (calendarErr) {
          state.calendarError = String(calendarErr && calendarErr.message ? calendarErr.message : calendarErr);
          saveTransactionState_(payload, state);
          try {
            emailResult = sendEmail_(payload, notionResult, null, state.calendarError);
            state.email = emailResult;
            state.emailSentAt = new Date().toISOString();
            saveTransactionState_(payload, state);
          } catch (emailErrAfterCalendarFailure) {
            state.emailError = String(emailErrAfterCalendarFailure && emailErrAfterCalendarFailure.message ? emailErrAfterCalendarFailure.message : emailErrAfterCalendarFailure);
            saveTransactionState_(payload, state);
          }
          return jsonResponse_({
            ok: true,
            partial: true,
            notion: notionResult,
            calendar: { ok: false, error: state.calendarError },
            email: emailResult ? emailResult : (state.email ? state.email : { ok: false, skipped: true }),
          });
        }
      }

      if (!emailResult) {
        try {
          emailResult = sendEmail_(payload, notionResult, calendarResult, null);
          state.email = emailResult;
          state.emailSentAt = new Date().toISOString();
          saveTransactionState_(payload, state);
        } catch (emailErr) {
          state.emailError = String(emailErr && emailErr.message ? emailErr.message : emailErr);
          saveTransactionState_(payload, state);
          return jsonResponse_({
            ok: true,
            partial: true,
            notion: notionResult,
            calendar: calendarResult,
            email: { ok: false, error: state.emailError },
          });
        }
      }

      state.complete = true;
      saveTransactionState_(payload, state);
      dedupeStore_(payload, state);

      return jsonResponse_({ ok: true, notion: notionResult, calendar: calendarResult, email: emailResult });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = String(e.postData.contents).trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON payload');
  }
}

function validatePayload_(p) {
  ['name', 'contactType', 'contact', 'date', 'tourTitle'].forEach(function (key) {
    if (!String(p[key] || '').trim()) throw new Error('Missing field: ' + key);
  });
}

function dedupeKey_(p) {
  return [
    String(p.tourTitle || '').trim().toLowerCase(),
    String(p.date || '').trim(),
    String(p.name || '').trim().toLowerCase(),
    String(p.contactType || '').trim().toLowerCase(),
    String(p.contact || '').trim().toLowerCase(),
    String(p.adults || '').trim(),
    String(p.children || '').trim(),
    String(p.childrenAges || '').trim(),
    String(p.hotel || '').trim().toLowerCase(),
  ].join('|');
}

function dedupeStore_(p, state) {
  CacheService.getScriptCache().put(dedupeKey_(p), String(Date.now()), 600);
  saveTransactionState_(p, state || { complete: true });
}

function dedupeCheck_(p) {
  return Boolean(CacheService.getScriptCache().get(dedupeKey_(p)));
}

function sendEmail_(p, notionResult, calendarResult, calendarError) {
  const adults = toInt_(p.adults);
  const children = toInt_(p.children);
  const guests = adults + children;
  const body = [
    'Новая заявка из каталога SamuRay Tours',
    '',
    'Тур: ' + safeText_(p.tourTitle),
    'Цена в каталоге: ' + safeText_(p.tourPrice || '-'),
    'Дата: ' + safeText_(p.date),
    'Альтернативная дата: ' + safeText_(p.altDate || '-'),
    'Гостей: ' + guests + ' (' + adults + ' взрослых, ' + children + ' детей)',
    'Возраст детей: ' + safeText_(p.childrenAges || '-'),
    'Отель / район: ' + safeText_(p.hotel || '-'),
    'Интересы: ' + safeText_((p.interests || []).join(', ') || '-'),
    'Пожелания: ' + safeText_(p.notes || '-'),
    '',
    'Клиент: ' + safeText_(p.name),
    'Связь: ' + safeText_(p.contactType),
    'Контакт: ' + safeText_(p.contact),
    'Источник: ' + SOURCE_LABEL,
    'CRM Notion: ' + safeText_(notionResult && notionResult.url ? notionResult.url : '-'),
    'Calendar: ' + safeText_(calendarResult && calendarResult.url ? calendarResult.url : '-'),
    'Calendar status: ' + safeText_(calendarResult && calendarResult.ok ? 'ok' : 'error'),
    'Calendar error: ' + safeText_(calendarError || (calendarResult && calendarResult.error ? calendarResult.error : '-')),
    'Страница каталога: ' + safeText_(p.pageUrl || '-'),
    'Отправлено: ' + safeText_(p.submittedAt || new Date().toISOString())
  ].join('\n');
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Новая заявка SamuRay Tours: ' + safeText_(p.tourTitle) + ' - ' + safeText_(p.date),
    body: body,
    name: 'SamuRay Tours'
  });
  return { ok: true, to: OWNER_EMAIL };
}

function createCalendarEvent_(p, notionResult) {
  const props = PropertiesService.getScriptProperties();
  const key = transactionKey_(p);
  const eventMarker = 'SamuRay Tours import key: ' + key;
  const calendar = CalendarApp.getDefaultCalendar();
  if (!calendar) throw new Error('Default calendar not available');
  const eventDate = parseDateOnly_(p.date);
  if (!eventDate) throw new Error('Invalid calendar date: ' + safeText_(p.date));

  const existing = findExistingCalendarEvent_(calendar, eventDate, eventMarker);
  if (existing) {
    return {
      ok: true,
      id: existing.id || null,
      url: existing.url || null,
      date: safeText_(p.date),
      title: 'Заявка',
      duplicate: true,
      eventMarker: eventMarker,
    };
  }

  const description = [
    'Тур: ' + safeText_(p.tourTitle),
    'Клиент: ' + safeText_(p.name),
    'Связь / контакт: ' + safeText_(p.contactType) + ' / ' + safeText_(p.contact),
    'Гостей: ' + (toInt_(p.adults) + toInt_(p.children)),
    'Основная дата: ' + safeText_(p.date),
    'Альтернативная дата: ' + safeText_(p.altDate || '-'),
    'Отель / район: ' + safeText_(p.hotel || '-'),
    'Интересы: ' + safeText_((p.interests || []).join(', ') || '-'),
    'Пожелания: ' + safeText_(p.notes || '-'),
    'Цена каталога: ' + safeText_(p.tourPrice || '-'),
    'CRM Notion URL: ' + safeText_(notionResult && notionResult.url ? notionResult.url : '-'),
    'Источник = ' + SOURCE_LABEL,
    eventMarker,
  ].join('\n');

  const event = calendar.createAllDayEvent('Заявка', eventDate, {
    description: description,
  });

  if (!event) throw new Error('Calendar event creation failed');
  const result = {
    ok: true,
    id: event.getId ? event.getId() : null,
    url: event.getHtmlLink ? event.getHtmlLink() : null,
    date: safeText_(p.date),
    title: 'Заявка',
    eventMarker: eventMarker,
  };
  props.setProperty(transactionKey_(p) + ':calendar', JSON.stringify(result));
  return result;
}

function createNotionRecord_(p) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  const bookingSourceId = props.getProperty('NOTION_BOOKINGS_DATA_SOURCE_ID') || BOOKING_DATA_SOURCE_FALLBACK;
  const routesSourceId = props.getProperty('NOTION_ROUTES_DATA_SOURCE_ID') || ROUTES_DATA_SOURCE_FALLBACK;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const bookingSchema = notionGetDataSourceSchema_(token, bookingSourceId);
  const routesSchema = notionGetDataSourceSchema_(token, routesSourceId);
  const bookingProperties = bookingSchema.properties || {};
  const bookingMap = buildPropertyMap_(bookingProperties);
  const routeMap = buildPropertyMap_(routesSchema.properties || {});
  const titleName = bookingMap.title || 'Бронирование';
  const pageProperties = {};

  pageProperties[titleName] = { title: [{ text: { content: safeText_(p.name) + ' - ' + safeText_(p.tourTitle) } }] };
  setIf_(pageProperties, bookingMap['Дата действия'], dateProp_(p.date));
  setIf_(pageProperties, bookingMap['Дата бронирования'], dateProp_(new Date().toISOString().slice(0, 10)));
  setIf_(pageProperties, bookingMap['Гостей'], numberProp_(toInt_(p.adults) + toInt_(p.children)));
  setIf_(pageProperties, bookingMap['Место встречи / отель'], richTextProp_(safeText_(p.hotel || '')));
  setIf_(pageProperties, bookingMap['Особые запросы'], richTextProp_(buildNotes_(p)));
  setIf_(pageProperties, bookingMap['Источник'], selectProp_('Прямой'));
  setIf_(pageProperties, bookingMap['Канал импорта'], selectProp_('Другое'));
  setIf_(pageProperties, bookingMap['Платформа / номер'], richTextProp_(SOURCE_LABEL));
  setIf_(pageProperties, bookingMap['Имя клиента'], richTextProp_(safeText_(p.name)));
  setIf_(pageProperties, bookingMap['Контакт'], richTextProp_(safeText_(p.contactType) + ': ' + safeText_(p.contact)));
  setIf_(pageProperties, bookingMap['Тур'], richTextProp_(safeText_(p.tourTitle)));
  setIf_(pageProperties, bookingMap['Дата заявки'], dateProp_(new Date().toISOString().slice(0, 10)));
  setIf_(pageProperties, bookingMap['Интересы'], richTextProp_((p.interests || []).join(', ')));

  // Make website leads immediately visible in the normal operational CRM views.
  setSchemaField_(pageProperties, bookingProperties, 'Статус', 'Ожидает оплаты');
  setSchemaField_(pageProperties, bookingProperties, 'Оплата', 'Не согласована');
  setSchemaField_(pageProperties, bookingProperties, 'Импорт требует внимания', true);
  setSchemaField_(pageProperties, bookingProperties, 'Импорт проверен', false);
  setSchemaField_(pageProperties, bookingProperties, 'Следующее действие', 'Связаться с клиентом по заявке из каталога');
  setSchemaField_(pageProperties, bookingProperties, 'Групп', 1);

  const relationCandidates = ['Маршрут', 'Маршруты', 'Экскурсия', 'Экскурсии'];
  const relationName = pickRelationName_(bookingProperties, relationCandidates);
  const routePage = relationName && isRelationProperty_(bookingProperties, relationName) && routeMap.title
    ? findRoutePage_(token, routesSourceId, routeMap.title, p.tourTitle)
    : null;
  if (routePage && routePage.id) {
    pageProperties[relationName] = { relation: [{ id: routePage.id }] };
  }

  const payload = {
    parent: { data_source_id: bookingSourceId },
    properties: pageProperties,
  };

  const response = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
    method: 'post',
    contentType: 'application/json',
    headers: notionHeaders_(token),
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const txt = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Notion error ' + code + ': ' + txt);
  const obj = JSON.parse(txt);
  return {
    ok: true,
    id: obj.id || null,
    url: obj.url || null,
    matchedRouteId: routePage && routePage.id ? routePage.id : null,
    relationMatched: Boolean(routePage && routePage.matched),
    relationAmbiguous: Boolean(routePage && routePage.ambiguous),
    matchedRouteTitle: routePage && routePage.title ? routePage.title : null,
  };
}

function findRoutePage_(token, routesSourceId, titlePropertyName, tourTitle) {
  const resolved = resolveCanonicalRouteTitle_(tourTitle);
  if (!resolved) return null;

  const exactMatches = notionQueryDataSource_(token, routesSourceId, {
    page_size: 25,
    filter: {
      property: titlePropertyName,
      title: { equals: resolved.title }
    }
  });
  if (exactMatches.length === 1) {
    return { id: exactMatches[0].id, title: exactMatches[0].title, matched: true, ambiguous: false };
  }
  if (exactMatches.length > 1) {
    return { id: null, title: null, matched: false, ambiguous: true };
  }

  return resolveRouteByExactTitle_(token, routesSourceId, titlePropertyName, resolved.title);
}

function resolveCanonicalRouteTitle_(tourTitle) {
  const queryTitle = safeText_(tourTitle);
  if (!queryTitle) return null;
  const normalizedQuery = normalizeRouteText_(queryTitle);
  if (!normalizedQuery) return null;

  for (var i = 0; i < ROUTE_CANONICALS_.length; i++) {
    var canonical = ROUTE_CANONICALS_[i];
    if (!canonical || !canonical.title) continue;
    if (normalizeRouteText_(canonical.title) === normalizedQuery) return { title: canonical.title };
    for (var j = 0; j < (canonical.aliases || []).length; j++) {
      if (normalizeRouteText_(canonical.aliases[j]) === normalizedQuery) return { title: canonical.title };
    }
  }
  return null;
}

function resolveRouteByExactTitle_(token, routesSourceId, titlePropertyName, canonicalTitle) {
  const exactMatches = notionQueryDataSource_(token, routesSourceId, {
    page_size: 25,
    filter: {
      property: titlePropertyName,
      title: { equals: canonicalTitle }
    }
  });
  if (exactMatches.length === 1) {
    return { id: exactMatches[0].id, title: exactMatches[0].title, matched: true, ambiguous: false };
  }
  if (exactMatches.length > 1) {
    return { id: null, title: null, matched: false, ambiguous: true };
  }
  return null;
}

function notionQueryDataSource_(token, dataSourceId, body) {
  const response = UrlFetchApp.fetch('https://api.notion.com/v1/data_sources/' + encodeURIComponent(String(dataSourceId).replace(/^collection:\/\//, '')) + '/query', {
    method: 'post',
    contentType: 'application/json',
    headers: notionHeaders_(token),
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) return [];
  const obj = JSON.parse(response.getContentText() || '{}');
  return extractNotionQueryResults_(obj);
}

function notionQueryAllDataSourcePages_(token, dataSourceId) {
  var results = [];
  var cursor = null;
  var hasMore = true;
  while (hasMore) {
    var body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    var response = UrlFetchApp.fetch('https://api.notion.com/v1/data_sources/' + encodeURIComponent(String(dataSourceId).replace(/^collection:\/\//, '')) + '/query', {
      method: 'post',
      contentType: 'application/json',
      headers: notionHeaders_(token),
      payload: JSON.stringify(body),
      muteHttpExceptions: true,
    });
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) break;
    var obj = JSON.parse(response.getContentText() || '{}');
    var pageResults = extractNotionQueryResults_(obj);
    for (var i = 0; i < pageResults.length; i++) results.push(pageResults[i]);
    hasMore = Boolean(obj.has_more);
    cursor = obj.next_cursor || null;
    if (!hasMore || !cursor) break;
  }
  return results;
}

function extractNotionQueryResults_(obj) {
  var out = [];
  var results = obj && obj.results ? obj.results : [];
  for (var i = 0; i < results.length; i++) {
    var page = results[i] || {};
    out.push({ id: page.id || null, title: extractNotionTitle_(page.properties || {}) });
  }
  return out;
}

function extractNotionTitle_(properties) {
  var keys = Object.keys(properties || {});
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var schema = properties[name] || {};
    if (schema.type === 'title') {
      return extractPlainText_(schema.title || []);
    }
  }
  return '';
}

function extractPlainText_(segments) {
  var parts = [];
  for (var i = 0; i < (segments || []).length; i++) {
    var segment = segments[i] || {};
    if (segment.plain_text) {
      parts.push(String(segment.plain_text));
    } else if (segment.text && segment.text.content) {
      parts.push(String(segment.text.content));
    }
  }
  return parts.join('').trim();
}

function notionGetDataSourceSchema_(token, dataSourceId) {
  const response = UrlFetchApp.fetch('https://api.notion.com/v1/data_sources/' + encodeURIComponent(String(dataSourceId).replace(/^collection:\/\//, '')), {
    method: 'get',
    headers: notionHeaders_(token),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  const txt = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Notion schema error ' + code + ': ' + txt);
  return JSON.parse(txt);
}

function buildPropertyMap_(properties) {
  const map = { title: null };
  Object.keys(properties || {}).forEach(function (name) {
    const schema = properties[name] || {};
    if (schema.type === 'title' && !map.title) map.title = name;
    map[name] = name;
  });
  return map;
}

function isRelationProperty_(properties, name) {
  return Boolean(properties && properties[name] && properties[name].type === 'relation');
}

function pickRelationName_(properties, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    if (isRelationProperty_(properties, candidate)) return candidate;
  }
  return null;
}

function normalizeRouteText_(value) {
  return safeText_(value)
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^\s+|\s+$/g, '');
}

function setIf_(obj, key, value) {
  if (key && value) obj[key] = value;
}

function setSchemaField_(obj, properties, name, value) {
  const schema = properties && properties[name];
  if (!schema) return;

  if (schema.type === 'select') {
    obj[name] = selectProp_(value);
    return;
  }
  if (schema.type === 'status') {
    const v = safeText_(value);
    if (v) obj[name] = { status: { name: v } };
    return;
  }
  if (schema.type === 'checkbox') {
    obj[name] = { checkbox: Boolean(value) };
    return;
  }
  if (schema.type === 'rich_text') {
    const prop = richTextProp_(value);
    if (prop) obj[name] = prop;
    return;
  }
  if (schema.type === 'number') {
    const n = Number(value);
    if (Number.isFinite(n)) obj[name] = { number: n };
  }
}

function notionHeaders_(token) {
  return {
    Authorization: 'Bearer ' + token,
    'Notion-Version': DEFAULT_NOTION_VERSION,
  };
}

function dateProp_(date) {
  const value = safeText_(date);
  return value ? { date: { start: value } } : null;
}

function numberProp_(value) {
  return Number.isFinite(value) ? { number: value } : null;
}

function richTextProp_(text) {
  const value = safeText_(text);
  return value ? { rich_text: [{ text: { content: value.slice(0, 2000) } }] } : null;
}

function selectProp_(value) {
  const v = safeText_(value);
  return v ? { select: { name: v } } : null;
}

function buildNotes_(p) {
  const lines = [];
  if (p.notes) lines.push('Пожелания: ' + safeText_(p.notes));
  if ((p.interests || []).length) lines.push('Интересы: ' + (p.interests || []).join(', '));
  if (toInt_(p.children)) lines.push('Дети: ' + toInt_(p.children) + '; возраст: ' + safeText_(p.childrenAges || 'не указан'));
  if (p.altDate) lines.push('Альтернативная дата: ' + safeText_(p.altDate));
  lines.push('Контакт: ' + safeText_(p.contactType) + ' - ' + safeText_(p.contact));
  lines.push('Источник: ' + SOURCE_LABEL);
  return lines.join('\n');
}

function toInt_(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function safeText_(value) {
  return String(value == null ? '' : value).trim();
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function transactionKey_(p) {
  return 'samuray:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, dedupeKey_(p)));
}

function loadTransactionState_(p) {
  const raw = PropertiesService.getScriptProperties().getProperty(transactionKey_(p) + ':state');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function saveTransactionState_(p, state) {
  PropertiesService.getScriptProperties().setProperty(transactionKey_(p) + ':state', JSON.stringify(state || {}));
}

function snapshotPayload_(p) {
  return {
    tourTitle: safeText_(p.tourTitle),
    date: safeText_(p.date),
    altDate: safeText_(p.altDate || ''),
    adults: safeText_(p.adults || ''),
    children: safeText_(p.children || ''),
    childrenAges: safeText_(p.childrenAges || ''),
    hotel: safeText_(p.hotel || ''),
    interests: Array.isArray(p.interests) ? p.interests.slice() : [],
    notes: safeText_(p.notes || ''),
    name: safeText_(p.name),
    contactType: safeText_(p.contactType),
    contact: safeText_(p.contact),
    tourPrice: safeText_(p.tourPrice || ''),
    pageUrl: safeText_(p.pageUrl || ''),
    submittedAt: safeText_(p.submittedAt || ''),
  };
}

function parseDateOnly_(value) {
  const text = safeText_(value);
  if (!text) return null;
  const parts = text.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(year, month - 1, day);
}

function findExistingCalendarEvent_(calendar, eventDate, marker) {
  const events = calendar.getEventsForDay(eventDate);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const description = event && event.getDescription ? event.getDescription() : '';
    if (event && event.getTitle && event.getTitle() === 'Заявка' && String(description || '').indexOf(marker) !== -1) {
      return {
        id: event.getId ? event.getId() : null,
        url: event.getHtmlLink ? event.getHtmlLink() : null,
      };
    }
  }
  return null;
}
