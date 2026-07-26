const ROUTE_SEARCH_PRIORITY_EXACT_ = 1000;
const ROUTE_SEARCH_PRIORITY_PREFIX_ = 600;
const ROUTE_SEARCH_PRIORITY_TOKEN_ = 300;
const ROUTE_SEARCH_PRIORITY_ALIAS_ = 150;

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

  const pages = notionQueryAllDataSourcePages_(token, routesSourceId);
  const candidates = buildRouteSearchTerms_(resolved.title, tourTitle);
  const scored = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] || {};
    const score = scoreRoutePage_(page.title, candidates);
    if (score > 0) {
      scored.push({ id: page.id || null, title: page.title || null, score: score });
    }
  }
  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { id: null, title: null, matched: false, ambiguous: true };
  }
  return { id: scored[0].id, title: scored[0].title, matched: true, ambiguous: false };
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

function normalizeRouteText_(value) {
  return safeText_(value)
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/\+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildRouteSearchTerms_(canonicalTitle, tourTitle) {
  const terms = [];
  const pushUnique = function (value) {
    const normalized = normalizeRouteText_(value);
    if (!normalized) return;
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].normalized === normalized) return;
    }
    terms.push({ raw: value, normalized: normalized, tokens: tokenizeRouteText_(value) });
  };

  pushUnique(canonicalTitle);
  pushUnique(tourTitle);

  for (var i = 0; i < ROUTE_CANONICALS_.length; i++) {
    var canonical = ROUTE_CANONICALS_[i];
    if (!canonical || !canonical.title) continue;
    if (normalizeRouteText_(canonical.title) === normalizeRouteText_(canonicalTitle)) {
      pushUnique(canonical.title);
      for (var j = 0; j < (canonical.aliases || []).length; j++) pushUnique(canonical.aliases[j]);
      break;
    }
  }

  return terms;
}

function tokenizeRouteText_(value) {
  const normalized = normalizeRouteText_(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(function (token) { return token; });
}

function scoreRoutePage_(pageTitle, candidates) {
  const normalizedPage = normalizeRouteText_(pageTitle);
  if (!normalizedPage) return 0;
  const pageTokens = tokenizeRouteText_(pageTitle);
  let best = 0;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate || !candidate.normalized) continue;
    if (normalizedPage === candidate.normalized) {
      best = Math.max(best, ROUTE_SEARCH_PRIORITY_EXACT_);
      continue;
    }
    if (normalizedPage.indexOf(candidate.normalized) === 0 || candidate.normalized.indexOf(normalizedPage) === 0) {
      best = Math.max(best, ROUTE_SEARCH_PRIORITY_PREFIX_ + candidate.normalized.length);
      continue;
    }
    const candidateTokens = candidate.tokens || [];
    if (candidateTokens.length && candidateTokens.every(function (token) { return pageTokens.indexOf(token) !== -1; })) {
      best = Math.max(best, ROUTE_SEARCH_PRIORITY_TOKEN_ + candidateTokens.length);
      continue;
    }
    if (normalizedPage.indexOf(candidate.normalized.replace(/ /g, '')) !== -1) {
      best = Math.max(best, ROUTE_SEARCH_PRIORITY_ALIAS_ + candidate.normalized.length);
    }
  }
  return best;
}

function calendarUrlFromResult_(calendarResult) {
  if (!calendarResult) return '';
  return safeText_(calendarResult.url || calendarResult.eventUrl || calendarResult.link || '');
}

function buildCalendarEventUrl_(calendar, event) {
  try {
    if (event && event.getHtmlLink) {
      const html = event.getHtmlLink();
      if (html) return String(html);
    }
  } catch (err) {
    // Fall through to the stable constructed URL.
  }

  const eventId = event && event.getId ? String(event.getId()) : '';
  const calendarId = calendar && calendar.getId ? String(calendar.getId()) : '';
  if (!eventId || !calendarId) return '';
  const eid = Utilities.base64EncodeWebSafe(eventId + ' ' + calendarId).replace(/=+$/, '');
  return 'https://calendar.google.com/calendar/event?eid=' + eid;
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
      eventId: existing.id || null,
      url: existing.url || null,
      eventUrl: existing.url || null,
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
  const eventUrl = buildCalendarEventUrl_(calendar, event);
  const result = {
    ok: true,
    id: event.getId ? event.getId() : null,
    eventId: event.getId ? event.getId() : null,
    url: eventUrl || null,
    eventUrl: eventUrl || null,
    date: safeText_(p.date),
    title: 'Заявка',
    eventMarker: eventMarker,
  };
  props.setProperty(transactionKey_(p) + ':calendar', JSON.stringify(result));
  return result;
}

function sendEmail_(p, notionResult, calendarResult, calendarError) {
  const adults = toInt_(p.adults);
  const children = toInt_(p.children);
  const guests = adults + children;
  const calendarLink = calendarUrlFromResult_(calendarResult);
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
    'Calendar: ' + safeText_(calendarLink || '-'),
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

function routeRelationRegressionCheck_(token, routesSourceId, titlePropertyName) {
  return {
    tsukiji: findRoutePage_(token, routesSourceId, titlePropertyName, 'Цукидзи + Гиндза'),
    tokyoExpress: findRoutePage_(token, routesSourceId, titlePropertyName, 'Токио Экспресс'),
  };
}
