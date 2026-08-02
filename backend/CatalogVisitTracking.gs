function handleCatalogVisitGetGuarded_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const eventId = String(params.eventId || '').trim();
  if (!eventId) {
    return contentVisitJson_({ ok: false, error: 'Catalog visit requires eventId' });
  }

  const cache = CacheService.getScriptCache();
  const key = 'catalog-visit-request:' + eventId;
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
    const result = recordCatalogVisit_(params);
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

function recordCatalogVisit_(params) {
  const eventId = contentVisitText_(params && params.eventId);
  if (!eventId) throw new Error('Catalog visit requires eventId');

  const channel = normalizeContentVisitChannel_(params && params.channel);
  const channelLabel = contentVisitChannelLabel_(channel);
  const testEvent = contentVisitBoolean_(params && params.testEvent);
  const tour = contentVisitText_(params && params.tour).slice(0, 200);
  const tourTitle =
    contentVisitText_(params && params.tourTitle).slice(0, 2000) ||
    contentVisitTourTitle_(tour);
  const pageUrl = contentVisitSafeUrl_(params && params.pageUrl);
  const catalogUrl = contentVisitSafeUrl_(params && params.catalogUrl);
  const publicationUrl = contentVisitSafeUrl_(params && params.publicationUrl);
  const device = normalizeContentVisitDevice_(params && params.device);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const date = Utilities.formatDate(nowDate, CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd');
  const metricTitle = buildCatalogVisitMetricTitle_(tour, channelLabel, date);

  if (!pageUrl) throw new Error('Catalog visit requires pageUrl');

  const token = contentVisitScriptProperty_('NOTION_TOKEN');
  const metricsSourceId = contentVisitScriptProperty_('NOTION_METRICS_DATA_SOURCE_ID') || CONTENT_VISIT_METRICS_SOURCE_FALLBACK_;
  const eventsSourceId = contentVisitScriptProperty_('NOTION_CLICK_EVENTS_DATA_SOURCE_ID') || CONTENT_VISIT_EVENTS_SOURCE_FALLBACK_;
  const routesSourceId = contentVisitScriptProperty_('NOTION_ROUTES_DATA_SOURCE_ID') || CONTENT_VISIT_ROUTES_SOURCE_FALLBACK_;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let metricPage = null;
    let total = 0;
    let deviceTotal = 0;
    const routePage = resolveCatalogVisitRoutePage_(token, routesSourceId, tour, tourTitle);

    if (!testEvent) {
      const aggregateResult = upsertContentVisitMetric_({
        token: token,
        metricsSourceId: metricsSourceId,
        metricTitle: metricTitle,
        channelLabel: channelLabel,
        postId: null,
        tour: tour,
        tourTitle: tourTitle,
        pageUrl: catalogUrl || pageUrl,
        publicationUrl: publicationUrl,
        device: device,
        deviceDescription: buildContentVisitDeviceDescription_(params, device),
        date: date,
        now: now,
        contentPage: null,
      });
      metricPage = aggregateResult.metricPage;
      total = aggregateResult.total;
      deviceTotal = aggregateResult.deviceTotal;
    }

    const eventProperties = buildContentVisitEventProperties_({
      params: params || {},
      eventId: eventId,
      postId: null,
      contentId: null,
      channelLabel: channelLabel,
      device: device,
      tour: tour,
      tourTitle: tourTitle,
      pageUrl: pageUrl,
      publicationUrl: publicationUrl,
      date: date,
      now: now,
      nowDate: nowDate,
      testEvent: testEvent,
      contentPage: null,
      routePage: routePage,
      metricPage: metricPage,
    });

    addCatalogVisitAttributionProperties_(eventProperties, params || {});
    const eventPage = createContentVisitEventPage_(token, eventsSourceId, eventProperties);

    return {
      ok: true,
      duplicate: false,
      eventType: 'catalog_visit',
      testEvent: testEvent,
      aggregateSkipped: testEvent,
      eventId: eventId,
      postId: null,
      contentId: null,
      channel: channel,
      device: device,
      tour: tour || null,
      tourTitle: tourTitle || null,
      total: testEvent ? null : total,
      deviceTotal: testEvent ? null : deviceTotal,
      metricTitle: metricTitle,
      metricPageId: metricPage && metricPage.id ? metricPage.id : null,
      metricUrl: metricPage && metricPage.url ? metricPage.url : null,
      eventLogged: Boolean(eventPage && eventPage.id),
      eventPageId: eventPage && eventPage.id ? eventPage.id : null,
      eventUrl: eventPage && eventPage.url ? eventPage.url : null,
      routePageId: routePage && routePage.id ? routePage.id : null,
      routeTitle: routePage && routePage.title ? routePage.title : null,
      routeMatchedBy: routePage && routePage.matchedBy ? routePage.matchedBy : null,
      routeError: routePage ? null : 'Catalog route not found for tour=' + tour,
    };
  } finally {
    lock.releaseLock();
  }
}

function resolveCatalogVisitRoutePage_(token, routesSourceId, tour, tourTitle) {
  const slug = contentVisitText_(tour);
  if (!slug) return null;

  const catalogUrl = 'https://samuray-games.github.io/samuray-tours/' + encodeURIComponent(slug);
  const byUrl = findRoutePageByCatalogUrl_(token, routesSourceId, catalogUrl);
  if (byUrl && byUrl.ambiguous) {
    throw new Error('Catalog route URL match is ambiguous for tour=' + slug);
  }
  if (byUrl && byUrl.id) return byUrl;

  const byTitle = findRoutePageByExactTitle_(token, routesSourceId, tourTitle);
  if (byTitle && byTitle.ambiguous) {
    throw new Error('Catalog route title match is ambiguous for tour=' + slug);
  }
  return byTitle && byTitle.id ? byTitle : null;
}

function findRoutePageByCatalogUrl_(token, routesSourceId, catalogUrl) {
  const result = contentVisitNotionQuery_(token, routesSourceId, {
    page_size: 2,
    filter: {
      property: 'Ссылка на каталог',
      url: { equals: catalogUrl },
    },
  });
  const pages = result.results || [];
  if (pages.length === 1) {
    return {
      id: pages[0].id,
      title: contentVisitRouteTitle_(pages[0]),
      matched: true,
      ambiguous: false,
      matchedBy: 'catalog_url',
    };
  }
  if (pages.length > 1) {
    return { id: null, title: null, matched: false, ambiguous: true, matchedBy: 'catalog_url' };
  }
  return null;
}

function findRoutePageByExactTitle_(token, routesSourceId, tourTitle) {
  const title = contentVisitText_(tourTitle);
  if (!title) return null;
  const result = contentVisitNotionQuery_(token, routesSourceId, {
    page_size: 2,
    filter: { property: 'Маршрут', title: { equals: title } },
  });
  const pages = result.results || [];
  if (pages.length === 1) {
    return { id: pages[0].id, title: contentVisitRouteTitle_(pages[0]), matched: true, ambiguous: false, matchedBy: 'title' };
  }
  if (pages.length > 1) {
    return { id: null, title: null, matched: false, ambiguous: true, matchedBy: 'title' };
  }
  return null;
}

function contentVisitRouteTitle_(page) {
  const properties = page && page.properties ? page.properties : {};
  const property = properties['Маршрут'];
  const title = property && property.title ? property.title : [];
  return title.map(function (item) {
    return item && (item.plain_text || item.text && item.text.content) ? (item.plain_text || item.text.content) : '';
  }).join('').trim();
}

function addCatalogVisitAttributionProperties_(properties, params) {
  contentVisitSetRichText_(properties, 'UTM source', params.utmSource);
  contentVisitSetRichText_(properties, 'UTM medium', params.utmMedium);
  contentVisitSetRichText_(properties, 'UTM campaign', params.utmCampaign);
  contentVisitSetRichText_(properties, 'UTM content', params.utmContent);
  contentVisitSetRichText_(properties, 'UTM term', params.utmTerm);
  contentVisitSetRichText_(properties, 'FBCLID', params.fbclid);
}

function buildCatalogVisitMetricTitle_(tour, channelLabel, date) {
  const subject = tour ? 'TOUR-' + tour : 'BIO';
  return subject + ' - ' + channelLabel + ' - ' + date;
}

function TEST_CATALOG_VISIT_WRITE() {
  const result = recordCatalogVisit_({
    eventType: 'catalog_visit',
    eventId: 'manual-catalog-' + Utilities.getUuid(),
    testEvent: '1',
    channel: 'instagram',
    tour: '3d',
    tourTitle: '3D Токио - Мэйдзи Дзингу, Харадзюку, Сибуя',
    utmSource: 'ig',
    utmMedium: 'social',
    utmContent: 'link_in_bio',
    fbclid: 'manual-test-fbclid',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?channel=instagram&utm_source=ig&utm_medium=social&utm_content=link_in_bio',
    catalogUrl: 'https://samuray-games.github.io/samuray-tours/',
    referrer: 'https://l.instagram.com/',
    device: 'mobile',
    platform: 'iPhone',
    os: 'iOS',
    browser: 'Instagram in-app browser',
    language: 'ru-RU',
    clientTimezone: CONTENT_VISIT_TIMEZONE_,
    clientTimestamp: new Date().toISOString(),
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function TEST_CATALOG_VISIT_FAMILY_WRITE() {
  const result = recordCatalogVisit_({
    eventType: 'catalog_visit',
    eventId: 'manual-catalog-family-' + Utilities.getUuid(),
    testEvent: '1',
    channel: 'telegram',
    tour: 'family',
    tourTitle: 'Токио для семей с детьми',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?tour=family&channel=telegram',
    catalogUrl: 'https://samuray-games.github.io/samuray-tours/',
    device: 'desktop',
    platform: 'Google Apps Script',
    os: 'Apps Script test',
    browser: 'Apps Script test',
    language: 'ru',
    clientTimezone: CONTENT_VISIT_TIMEZONE_,
    clientTimestamp: new Date().toISOString(),
  });

  console.log(JSON.stringify(result, null, 2));
  return result;
}

function TEST_CATALOG_ROUTE_COVERAGE() {
  const tours = [
    ['3d', '3D Токио - Мэйдзи Дзингу, Харадзюку, Сибуя'],
    ['asakusa', 'Асакуса: Путешествие из Эдо в Токио'],
    ['tsukiji', 'Утренний Цукидзи Food Sprint + Гиндза-глам'],
    ['akiba', 'Акихабара Geek Lite + Амэёко Маркет'],
    ['yanaka', 'Янака Ретро Эдо + Храм Нэзу Ториевый тоннель'],
    ['architecture', 'Архитектурный Центр: Гиндза → Маруноути → Токио стейшн'],
    ['gardens', 'Карманные Сады Большого Города'],
    ['depachika', 'Дешёвый & Весёлый Фуд-крол по Депачика'],
    ['hanami', 'Ханами Экспресс'],
    ['momiji', 'Момидзи Экспресс'],
    ['season-express', 'Сезонный Tokyo Express'],
    ['season-special', 'Сезонный Tokyo Special'],
    ['shinjuku', 'Синдзюку Неон & Голден Гай'],
    ['classic', 'Классический - Изюминки Токио'],
    ['contrast', 'Современность & Традиционность'],
    ['temples', 'Сады и храмы большого города'],
    ['culinary', 'Кулинарный день'],
    ['nightfull', 'Ночной Токио - комбо день'],
    ['express', 'Всё за день!'],
    ['family', 'Токио для семей с детьми'],
    ['imperial', 'Классика + Императорские сады'],
    ['odaiba', 'Одайба и бухта Токио'],
    ['karaoke', 'Караоке-вечер в Токио'],
    ['kawaguchiko', 'Кавагучико - тихая Япония у Фудзи'],
    ['kamakura', 'Камакура: самурайская столица у океана'],
  ];
  const token = contentVisitScriptProperty_('NOTION_TOKEN');
  const routesSourceId = contentVisitScriptProperty_('NOTION_ROUTES_DATA_SOURCE_ID') || CONTENT_VISIT_ROUTES_SOURCE_FALLBACK_;
  const missing = [];
  const ambiguous = [];
  const titleDrift = [];
  const matches = [];
  tours.forEach(function (tour) {
    const slug = tour[0];
    const frontendTitle = tour[1];
    const match = findRoutePageByCatalogUrl_(token, routesSourceId, 'https://samuray-games.github.io/samuray-tours/' + encodeURIComponent(slug));
    const count = match && match.ambiguous ? 2 : match && match.id ? 1 : 0;
    if (!match || !match.id) {
      if (match && match.ambiguous) ambiguous.push(slug);
      else missing.push(slug);
    } else if (match.title !== frontendTitle) {
      titleDrift.push({ slug: slug, frontendTitle: frontendTitle, routeTitle: match.title });
    }
    matches.push({ slug: slug, frontendTitle: frontendTitle, routePageId: match && match.id ? match.id : null, routeTitle: match && match.title ? match.title : null, matchedBy: match && match.matchedBy ? match.matchedBy : null, count: count });
  });
  const result = { ok: missing.length === 0 && ambiguous.length === 0 && matches.length === tours.length, total: tours.length, matched: matches.filter(function (item) { return item.routePageId; }).length, missing: missing, ambiguous: ambiguous, titleDrift: titleDrift, matches: matches };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
