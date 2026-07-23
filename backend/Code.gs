const OWNER_EMAIL = 'raykhalit@icloud.com';
const SOURCE_LABEL = 'Каталог SamuRay Tours';
const DEFAULT_NOTION_VERSION = '2026-03-11';
const ROUTES_DATA_SOURCE_FALLBACK = '3242a1d2-b113-46a3-abe5-942bed2a94d2';
const BOOKING_DATA_SOURCE_FALLBACK = '5224b52a-a119-4c48-be60-e258a0d1bcc7';

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
      const duplicate = dedupeCheck_(payload);
      if (duplicate) {
        return jsonResponse_({ ok: true, duplicate: true });
      }

      const emailResult = sendEmail_(payload);
      const notionResult = createNotionRecord_(payload);
      dedupeStore_(payload);
      return jsonResponse_({ ok: true, email: emailResult, notion: notionResult });
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

function dedupeStore_(p) {
  CacheService.getScriptCache().put(dedupeKey_(p), String(Date.now()), 600);
}

function dedupeCheck_(p) {
  return Boolean(CacheService.getScriptCache().get(dedupeKey_(p)));
}

function sendEmail_(p) {
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
    'Страница: ' + safeText_(p.pageUrl || '-'),
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

function createNotionRecord_(p) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  const bookingSourceId = props.getProperty('NOTION_DATABASE_ID') || BOOKING_DATA_SOURCE_FALLBACK;
  const routesSourceId = props.getProperty('NOTION_ROUTES_DATA_SOURCE_ID') || ROUTES_DATA_SOURCE_FALLBACK;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const bookingSchema = notionGetDataSourceSchema_(token, bookingSourceId);
  const routesSchema = notionGetDataSourceSchema_(token, routesSourceId);
  const propertyMap = buildPropertyMap_(bookingSchema.properties || {});
  const routePropertyMap = buildPropertyMap_(routesSchema.properties || {});
  const titleName = propertyMap.title || 'Бронирование';
  const pageProperties = {};

  pageProperties[titleName] = { title: [{ text: { content: safeText_(p.name) + ' - ' + safeText_(p.tourTitle) } }] };
  setIf_(pageProperties, propertyMap['Дата действия'], dateProp_(p.date));
  setIf_(pageProperties, propertyMap['Дата бронирования'], dateProp_(new Date().toISOString().slice(0, 10)));
  setIf_(pageProperties, propertyMap['Гостей'], numberProp_(toInt_(p.adults) + toInt_(p.children)));
  setIf_(pageProperties, propertyMap['Место встречи / отель'], richTextProp_(safeText_(p.hotel || '')));
  setIf_(pageProperties, propertyMap['Особые запросы'], richTextProp_(buildNotes_(p)));
  setIf_(pageProperties, propertyMap['Источник'], selectProp_('Каталог'));
  setIf_(pageProperties, propertyMap['Канал импорта'], selectProp_('Каталог'));
  setIf_(pageProperties, propertyMap['Платформа / номер'], richTextProp_(SOURCE_LABEL));
  setIf_(pageProperties, propertyMap['Имя клиента'], richTextProp_(safeText_(p.name)));
  setIf_(pageProperties, propertyMap['Контакт'], richTextProp_(safeText_(p.contactType) + ': ' + safeText_(p.contact)));
  setIf_(pageProperties, propertyMap['Тур'], richTextProp_(safeText_(p.tourTitle)));
  setIf_(pageProperties, propertyMap['Дата заявки'], dateProp_(new Date().toISOString().slice(0, 10)));
  setIf_(pageProperties, propertyMap['Интересы'], richTextProp_((p.interests || []).join(', ')));

  const relationName = pickName_(propertyMap, ['Маршрут', 'Маршруты', 'Экскурсия', 'Экскурсии', 'Бронирование']);
  if (relationName && routePropertyMap.title) {
    const routePageId = findRoutePageId_(token, routesSourceId, routePropertyMap.title, p.tourTitle);
    if (routePageId) {
      pageProperties[relationName] = { relation: [{ id: routePageId }] };
    }
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
  return { ok: true, id: obj.id || null, url: obj.url || null, relationMatched: Boolean(pageProperties[relationName]) };
}

function findRoutePageId_(token, routesSourceId, titlePropertyName, tourTitle) {
  const body = {
    page_size: 25,
    filter: {
      property: titlePropertyName,
      title: { equals: safeText_(tourTitle) }
    }
  };
  const response = UrlFetchApp.fetch('https://api.notion.com/v1/data_sources/' + encodeURIComponent(String(routesSourceId).replace(/^collection:\/\//, '')) + '/query', {
    method: 'post',
    contentType: 'application/json',
    headers: notionHeaders_(token),
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) return null;
  const obj = JSON.parse(response.getContentText() || '{}');
  const first = (obj.results || [])[0];
  return first ? first.id : null;
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

function pickName_(map, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    if (map[candidates[i]]) return map[candidates[i]];
  }
  return null;
}

function setIf_(obj, key, value) {
  if (key && value) obj[key] = value;
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
