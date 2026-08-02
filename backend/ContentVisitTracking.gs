const CONTENT_VISIT_NOTION_VERSION_ = '2026-03-11';
const CONTENT_VISIT_CONTENT_SOURCE_FALLBACK_ = '28d6d74c-b01d-4a5a-8f32-cbcdb22efcfa';
const CONTENT_VISIT_METRICS_SOURCE_FALLBACK_ = 'ee1f58dd-ae30-4968-a43a-a60344e1ce63';
const CONTENT_VISIT_EVENTS_SOURCE_FALLBACK_ = '2875a5b5-5e0d-46fd-9960-413faecdb924';
const CONTENT_VISIT_ROUTES_SOURCE_FALLBACK_ = '3242a1d2-b113-46a3-abe5-942bed2a94d2';
const CONTENT_VISIT_TIMEZONE_ = 'Asia/Tokyo';

function handleContentVisitGet_(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    return contentVisitJson_(recordContentVisit_(params));
  } catch (err) {
    console.error(err);
    return contentVisitJson_({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
}

function TEST_CONTENT_VISIT_LOOKUP() {
  const result = inspectContentVisitMetric_({
    post: 135,
    channel: 'telegram',
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function TEST_CONTENT_VISIT_WRITE() {
  const result = recordContentVisit_({
    eventType: 'content_visit',
    eventId: 'manual-' + Utilities.getUuid(),
    testEvent: '1',
    post: 135,
    channel: 'telegram',
    publicationUrl: 'https://t.me/samuray_tours/135',
    tour: '3d',
    tourTitle: '3D Токио - Мэйдзи Дзингу, Харадзюку, Сибуя',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?tour=3d&post=135&channel=telegram',
    catalogUrl: 'https://samuray-games.github.io/samuray-tours/',
    referrer: 'https://t.me/samuray_tours/135',
    device: 'desktop',
    platform: 'Google Apps Script',
    os: 'Apps Script test',
    browser: 'Apps Script test',
    userAgent: 'Apps Script manual test',
    language: 'ru',
    languages: 'ru, en, ja',
    screen: '1440x900',
    viewport: '1200x800',
    pixelRatio: 2,
    colorDepth: 24,
    touchPoints: 0,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    networkProfile: 'test',
    dnt: '1',
    clientTimezone: CONTENT_VISIT_TIMEZONE_,
    clientTimestamp: new Date().toISOString(),
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function TEST_CONTENT_VISIT_DETAILED_WRITE() {
  const result = recordContentVisit_({
    eventType: 'content_visit',
    eventId: 'manual-detailed-' + Utilities.getUuid(),
    testEvent: '1',
    content: 311,
    channel: 'telegram',
    tour: '3d',
    tourTitle: '3D Токио - Мэйдзи Дзингу, Харадзюку, Сибуя',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?tour=3d&content=311&channel=telegram',
    catalogUrl: 'https://samuray-games.github.io/samuray-tours/',
    referrer: 'https://t.me/samuray_tours',
    device: 'mobile',
    platform: 'iPhone',
    os: 'iOS',
    browser: 'Safari',
    userAgent: 'Manual detailed test',
    language: 'ru-RU',
    languages: 'ru-RU, en-US, ja-JP',
    screen: '430x932',
    viewport: '393x852',
    pixelRatio: 3,
    colorDepth: 24,
    touchPoints: 5,
    hardwareConcurrency: 6,
    deviceMemory: 0,
    networkProfile: '4g | 10 Mbps | 50 ms',
    dnt: '1',
    clientTimezone: 'Asia/Tokyo',
    clientTimestamp: new Date().toISOString(),
    geoCountry: 'Япония',
    geoCountryCode: 'JP',
    geoContinent: 'Азия',
    geoRegion: 'Tokyo',
    geoRegionCode: '13',
    geoCity: 'Tokyo',
    geoPostalCode: '100-0001',
    geoTimezone: 'Asia/Tokyo',
    geoLatitude: 35.6895,
    geoLongitude: 139.6917,
    geoAsn: 2516,
    geoAsOrganization: 'KDDI CORPORATION',
    geoColo: 'NRT',
    cloudflareRayId: 'manual-test-NRT',
    sourceUrl: 'https://example.workers.dev/',
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function TEST_CONTENT_VISIT_FAMILY_WRITE() {
  const result = recordContentVisit_({
    eventType: 'content_visit',
    eventId: 'manual-family-' + Utilities.getUuid(),
    testEvent: '1',
    content: 312,
    channel: 'telegram',
    tour: 'family',
    tourTitle: 'Токио для семей с детьми',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?tour=family&content=312&channel=telegram',
    catalogUrl: 'https://samuray-games.github.io/samuray-tours/',
    referrer: 'https://t.me/samuray_tours',
    device: 'desktop',
    platform: 'Google Apps Script',
    os: 'Apps Script test',
    browser: 'Apps Script test',
    userAgent: 'Apps Script manual test family',
    language: 'ru',
    languages: 'ru, en, ja',
    screen: '1440x900',
    viewport: '1200x800',
    pixelRatio: 2,
    colorDepth: 24,
    touchPoints: 0,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    networkProfile: 'test',
    dnt: '1',
    clientTimezone: CONTENT_VISIT_TIMEZONE_,
    clientTimestamp: new Date().toISOString(),
    geoCountry: 'Япония',
    geoCountryCode: 'JP',
    geoContinent: 'Азия',
    geoRegion: 'Tokyo',
    geoRegionCode: '13',
    geoCity: 'Tokyo',
    geoPostalCode: '100-0001',
    geoTimezone: 'Asia/Tokyo',
    geoLatitude: 35.6895,
    geoLongitude: 139.6917,
    geoAsn: 2516,
    geoAsOrganization: 'KDDI CORPORATION',
    geoColo: 'NRT',
    cloudflareRayId: 'manual-test-family',
    sourceUrl: 'https://example.workers.dev/',
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function recordContentVisit_(params) {
  const eventId = contentVisitText_(params && params.eventId) || Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const cacheKey = 'samuray-content-visit:' + eventId;
  if (cache.get(cacheKey)) {
    return { ok: true, duplicate: true, eventId: eventId };
  }

  const channel = normalizeContentVisitChannel_(params && params.channel);
  const channelLabel = contentVisitChannelLabel_(channel);
  const postId = contentVisitPositiveInteger_(params && params.post);
  const contentId = contentVisitPositiveInteger_(params && params.content);
  const testEvent = contentVisitBoolean_(params && params.testEvent);
  const tour = contentVisitText_(params && params.tour).slice(0, 200);
  const tourTitle = contentVisitText_(params && params.tourTitle).slice(0, 2000) || contentVisitTourTitle_(tour);
  const pageUrl = contentVisitSafeUrl_(params && params.pageUrl);
  const publicationUrl = normalizeContentVisitPublicationUrl_(params, channel, postId);
  const device = normalizeContentVisitDevice_(params && params.device);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const date = Utilities.formatDate(nowDate, CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd');
  const metricTitle = buildContentVisitMetricTitle_(postId, contentId, channelLabel, date);

  if (!postId && !contentId) {
    throw new Error('Content visit requires post or content parameter');
  }

  const token = contentVisitScriptProperty_('NOTION_TOKEN');
  const contentSourceId = contentVisitScriptProperty_('NOTION_CONTENT_DATA_SOURCE_ID') || CONTENT_VISIT_CONTENT_SOURCE_FALLBACK_;
  const metricsSourceId = contentVisitScriptProperty_('NOTION_METRICS_DATA_SOURCE_ID') || CONTENT_VISIT_METRICS_SOURCE_FALLBACK_;
  const eventsSourceId = contentVisitScriptProperty_('NOTION_CLICK_EVENTS_DATA_SOURCE_ID') || CONTENT_VISIT_EVENTS_SOURCE_FALLBACK_;
  const routesSourceId = contentVisitScriptProperty_('NOTION_ROUTES_DATA_SOURCE_ID') || CONTENT_VISIT_ROUTES_SOURCE_FALLBACK_;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let contentPage = null;
    if (contentId) {
      contentPage = findContentVisitContentPage_(token, contentSourceId, contentId);
    }
    const routePage = resolveContentVisitRoutePage_(
      token,
      routesSourceId,
      tour,
      tourTitle,
      contentPage
    );

    let metricPage = null;
    let total = 0;
    let deviceTotal = 0;

    if (!testEvent) {
      const aggregateResult = upsertContentVisitMetric_({
        token: token,
        metricsSourceId: metricsSourceId,
        metricTitle: metricTitle,
        channelLabel: channelLabel,
        postId: postId,
        tour: tour,
        tourTitle: tourTitle,
        pageUrl: pageUrl,
        publicationUrl: publicationUrl,
        device: device,
        deviceDescription: buildContentVisitDeviceDescription_(params, device),
        date: date,
        now: now,
        contentPage: contentPage,
      });
      metricPage = aggregateResult.metricPage;
      total = aggregateResult.total;
      deviceTotal = aggregateResult.deviceTotal;
    }

    let eventPage = null;
    let eventError = null;
    try {
      eventPage = createContentVisitEventPage_(
        token,
        eventsSourceId,
        buildContentVisitEventProperties_({
          params: params || {},
          eventId: eventId,
          postId: postId,
          contentId: contentId,
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
          contentPage: contentPage,
          routePage: routePage,
          metricPage: metricPage,
        })
      );
    } catch (eventErr) {
      eventError = String(eventErr && eventErr.message ? eventErr.message : eventErr);
      console.error('Detailed content visit event failed: ' + eventError);
    }

    cache.put(cacheKey, '1', 21600);
    return {
      ok: true,
      duplicate: false,
      testEvent: testEvent,
      aggregateSkipped: testEvent,
      eventId: eventId,
      postId: postId,
      contentId: contentId,
      channel: channel,
      device: device,
      tour: tour || null,
      total: testEvent ? null : total,
      deviceTotal: testEvent ? null : deviceTotal,
      metricTitle: metricTitle,
      metricPageId: metricPage && metricPage.id ? metricPage.id : null,
      metricUrl: metricPage && metricPage.url ? metricPage.url : null,
      eventLogged: Boolean(eventPage && eventPage.id),
      eventPageId: eventPage && eventPage.id ? eventPage.id : null,
      eventUrl: eventPage && eventPage.url ? eventPage.url : null,
      eventError: eventError,
      contentRelationMatched: Boolean(contentPage && contentPage.id),
      routePageId: routePage && routePage.id ? routePage.id : null,
      routeTitle: routePage && routePage.title ? routePage.title : null,
    };
  } finally {
    lock.releaseLock();
  }
}

function upsertContentVisitMetric_(context) {
  const existing = findContentVisitMetricPage_(context.token, context.metricsSourceId, context.metricTitle);
  const deviceProperty = contentVisitDeviceProperty_(context.device);
  let total = 1;
  let deviceTotal = 1;
  let metricPage;

  if (existing) {
    total = contentVisitNumber_(existing.properties && existing.properties['Переходы']) + 1;
    deviceTotal = contentVisitNumber_(existing.properties && existing.properties[deviceProperty]) + 1;
    const properties = {
      'Переходы': { number: total },
      'Последний переход': { date: { start: context.now } },
      'Последнее устройство': contentVisitRichText_(context.deviceDescription),
    };
    properties[deviceProperty] = { number: deviceTotal };
    if (context.postId) properties['Номер публикации'] = { number: context.postId };
    if (context.publicationUrl) properties['Ссылка публикации'] = { url: context.publicationUrl };
    if (context.tour) properties['Код тура'] = contentVisitRichText_(context.tour);
    if (context.tourTitle) properties['Полное название тура'] = contentVisitRichText_(context.tourTitle);
    if (context.pageUrl) properties['Целевая ссылка'] = { url: context.pageUrl };
    if (context.contentPage && context.contentPage.id) properties['Контент'] = { relation: [{ id: context.contentPage.id }] };
    metricPage = updateContentVisitMetricPage_(context.token, existing.id, properties);
  } else {
    const properties = {
      'Публикация': contentVisitTitle_(context.metricTitle),
      'Дата': { date: { start: context.date } },
      'Канал': { select: { name: context.channelLabel } },
      'Переходы': { number: 1 },
      'Переходы - компьютер': { number: context.device === 'desktop' ? 1 : 0 },
      'Переходы - телефон': { number: context.device === 'mobile' ? 1 : 0 },
      'Переходы - планшет': { number: context.device === 'tablet' ? 1 : 0 },
      'Последний переход': { date: { start: context.now } },
      'Последнее устройство': contentVisitRichText_(context.deviceDescription),
    };
    if (context.postId) properties['Номер публикации'] = { number: context.postId };
    if (context.publicationUrl) properties['Ссылка публикации'] = { url: context.publicationUrl };
    if (context.tour) properties['Код тура'] = contentVisitRichText_(context.tour);
    if (context.tourTitle) properties['Полное название тура'] = contentVisitRichText_(context.tourTitle);
    if (context.pageUrl) properties['Целевая ссылка'] = { url: context.pageUrl };
    if (context.contentPage && context.contentPage.id) properties['Контент'] = { relation: [{ id: context.contentPage.id }] };
    metricPage = createContentVisitMetricPage_(context.token, context.metricsSourceId, properties);
  }

  return {
    metricPage: metricPage,
    total: total,
    deviceTotal: deviceTotal,
  };
}

function buildContentVisitEventProperties_(context) {
  const params = context.params || {};
  const geographyReceived = Boolean(
    contentVisitText_(params.geoCountryCode) ||
    contentVisitText_(params.geoCountry) ||
    contentVisitText_(params.geoRegion) ||
    contentVisitText_(params.geoCity) ||
    contentVisitText_(params.geoAsn)
  );
  const properties = {
    'Переход': contentVisitTitle_(buildContentVisitEventTitle_(context)),
    'Event ID': contentVisitRichText_(context.eventId),
    'Канал': { select: { name: context.channelLabel } },
    'Дата и время': { date: { start: context.now } },
    'День JST': { date: { start: context.date } },
    'Устройство': { select: { name: contentVisitDeviceLabel_(context.device) } },
    'Дубликат': { checkbox: false },
    'Тест': { checkbox: Boolean(context.testEvent) },
    'География получена': { checkbox: geographyReceived },
  };

  const clientTimestamp = contentVisitIsoDate_(params.clientTimestamp);
  if (clientTimestamp) properties['Время клиента'] = { date: { start: clientTimestamp } };
  if (context.contentPage && context.contentPage.id) properties['Контент'] = { relation: [{ id: context.contentPage.id }] };
  if (context.routePage && context.routePage.id) properties['Название тура из контента'] = { relation: [{ id: context.routePage.id }] };
  if (context.metricPage && context.metricPage.id) properties['Сводная метрика'] = { relation: [{ id: context.metricPage.id }] };
  if (context.contentId) properties['CT номер'] = { number: context.contentId };
  if (context.postId) properties['Номер публикации'] = { number: context.postId };
  if (context.tour) properties['Код тура'] = contentVisitRichText_(context.tour);
  if (context.tourTitle) properties['Полное название тура'] = contentVisitRichText_(context.tourTitle);

  contentVisitSetRichText_(properties, 'Платформа', params.platform);
  contentVisitSetRichText_(properties, 'ОС', params.os);
  contentVisitSetRichText_(properties, 'Браузер', params.browser);
  contentVisitSetRichText_(properties, 'User Agent', params.userAgent);
  contentVisitSetRichText_(properties, 'Язык', params.language);
  contentVisitSetRichText_(properties, 'Языки', params.languages);
  contentVisitSetRichText_(properties, 'Часовой пояс устройства', params.clientTimezone);
  contentVisitSetRichText_(properties, 'Экран', params.screen);
  contentVisitSetRichText_(properties, 'Viewport', params.viewport);
  contentVisitSetNumber_(properties, 'Pixel ratio', params.pixelRatio, 0, 100);
  contentVisitSetNumber_(properties, 'Color depth', params.colorDepth, 0, 256);
  contentVisitSetNumber_(properties, 'Touch points', params.touchPoints, 0, 1000);
  contentVisitSetNumber_(properties, 'CPU потоки', params.hardwareConcurrency, 0, 1024);
  contentVisitSetNumber_(properties, 'Память устройства, ГБ', params.deviceMemory, 0, 4096);
  contentVisitSetRichText_(properties, 'Сетевой профиль', params.networkProfile);
  contentVisitSetRichText_(properties, 'DNT', params.dnt);

  contentVisitSetRichText_(properties, 'Страна', params.geoCountry);
  contentVisitSetRichText_(properties, 'Код страны', params.geoCountryCode);
  contentVisitSetRichText_(properties, 'Континент', params.geoContinent);
  contentVisitSetRichText_(properties, 'Регион', params.geoRegion);
  contentVisitSetRichText_(properties, 'Код региона', params.geoRegionCode);
  contentVisitSetRichText_(properties, 'Город', params.geoCity);
  contentVisitSetRichText_(properties, 'Почтовый индекс', params.geoPostalCode);
  contentVisitSetRichText_(properties, 'Часовой пояс сети', params.geoTimezone);
  contentVisitSetNumber_(properties, 'Широта', params.geoLatitude, -90, 90);
  contentVisitSetNumber_(properties, 'Долгота', params.geoLongitude, -180, 180);
  contentVisitSetNumber_(properties, 'ASN', params.geoAsn, 0, 4294967295);
  contentVisitSetRichText_(properties, 'Провайдер', params.geoAsOrganization);
  contentVisitSetRichText_(properties, 'Cloudflare POP', params.geoColo);
  contentVisitSetRichText_(properties, 'Cloudflare Ray ID', params.cloudflareRayId);

  contentVisitSetUrl_(properties, 'Источник', params.sourceUrl);
  contentVisitSetUrl_(properties, 'Страница каталога', params.catalogUrl);
  contentVisitSetUrl_(properties, 'Целевая ссылка', context.pageUrl);
  contentVisitSetUrl_(properties, 'Ссылка публикации', context.publicationUrl);
  contentVisitSetUrl_(properties, 'Referrer', params.referrer);

  return properties;
}

function inspectContentVisitMetric_(params) {
  const channel = normalizeContentVisitChannel_(params && params.channel);
  const channelLabel = contentVisitChannelLabel_(channel);
  const postId = contentVisitPositiveInteger_(params && params.post);
  const contentId = contentVisitPositiveInteger_(params && params.content);
  const date = Utilities.formatDate(new Date(), CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd');
  const metricTitle = buildContentVisitMetricTitle_(postId, contentId, channelLabel, date);
  const token = contentVisitScriptProperty_('NOTION_TOKEN');
  const metricsSourceId = contentVisitScriptProperty_('NOTION_METRICS_DATA_SOURCE_ID') || CONTENT_VISIT_METRICS_SOURCE_FALLBACK_;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const existing = findContentVisitMetricPage_(token, metricsSourceId, metricTitle);
  if (!existing) {
    return {
      ok: true,
      found: false,
      metricTitle: metricTitle,
      total: 0,
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };
  }

  return {
    ok: true,
    found: true,
    metricTitle: metricTitle,
    metricPageId: existing.id || null,
    metricUrl: existing.url || null,
    total: contentVisitNumber_(existing.properties && existing.properties['Переходы']),
    desktop: contentVisitNumber_(existing.properties && existing.properties['Переходы - компьютер']),
    mobile: contentVisitNumber_(existing.properties && existing.properties['Переходы - телефон']),
    tablet: contentVisitNumber_(existing.properties && existing.properties['Переходы - планшет']),
    lastDevice: contentVisitPlainText_(existing.properties && existing.properties['Последнее устройство']),
    lastVisit: contentVisitDate_(existing.properties && existing.properties['Последний переход']),
  };
}

function findContentVisitContentPage_(token, dataSourceId, contentId) {
  const result = contentVisitNotionQuery_(token, dataSourceId, {
    page_size: 2,
    filter: {
      property: 'ID контента',
      unique_id: { equals: contentId },
    },
  });
  return result.results && result.results.length === 1 ? result.results[0] : null;
}

function resolveContentVisitRoutePage_(token, routesSourceId, tour, tourTitle, contentPage) {
  const contentProperties = contentPage && contentPage.properties ? contentPage.properties : {};
  const contentRouteProperty = contentProperties['Маршруты'] || contentProperties['Маршрут'];
  const contentRoutes = contentRouteProperty && contentRouteProperty.relation
    ? contentRouteProperty.relation
    : [];
  if (contentRoutes.length === 1 && contentRoutes[0].id) {
    return { id: contentRoutes[0].id, title: null, matched: true };
  }
  if (contentRoutes.length > 1) {
    throw new Error('Content visit route relation is ambiguous');
  }

  const resolved = findRoutePage_(token, routesSourceId, 'Маршрут', tourTitle || contentVisitTourTitle_(tour));
  if (resolved && resolved.ambiguous) {
    throw new Error('Tour route match is ambiguous');
  }
  return resolved && resolved.id ? resolved : null;
}

function findContentVisitMetricPage_(token, dataSourceId, metricTitle) {
  const result = contentVisitNotionQuery_(token, dataSourceId, {
    page_size: 2,
    filter: {
      property: 'Публикация',
      title: { equals: metricTitle },
    },
  });
  return result.results && result.results.length === 1 ? result.results[0] : null;
}

function createContentVisitMetricPage_(token, dataSourceId, properties) {
  return contentVisitCreatePage_(token, dataSourceId, properties);
}

function createContentVisitEventPage_(token, dataSourceId, properties) {
  return contentVisitCreatePage_(token, dataSourceId, properties);
}

function contentVisitCreatePage_(token, dataSourceId, properties) {
  return contentVisitNotionRequest_(token, 'https://api.notion.com/v1/pages', 'post', {
    parent: { data_source_id: String(dataSourceId).replace(/^collection:\/\//, '') },
    properties: properties,
  });
}

function updateContentVisitMetricPage_(token, pageId, properties) {
  return contentVisitNotionRequest_(token, 'https://api.notion.com/v1/pages/' + encodeURIComponent(pageId), 'patch', {
    properties: properties,
  });
}

function contentVisitNotionQuery_(token, dataSourceId, payload) {
  return contentVisitNotionRequest_(
    token,
    'https://api.notion.com/v1/data_sources/' + encodeURIComponent(String(dataSourceId).replace(/^collection:\/\//, '')) + '/query',
    'post',
    payload
  );
}

function contentVisitNotionRequest_(token, url, method, payload) {
  const options = {
    method: method,
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      'Notion-Version': CONTENT_VISIT_NOTION_VERSION_,
    },
    muteHttpExceptions: true,
  };
  if (payload != null) options.payload = JSON.stringify(payload);

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Notion error ' + code + ': ' + text);
  }
  return JSON.parse(text || '{}');
}

function buildContentVisitMetricTitle_(postId, contentId, channelLabel, date) {
  const subjects = [];
  if (postId && channelLabel === 'Telegram') subjects.push('TG-' + postId);
  if (postId && channelLabel !== 'Telegram') subjects.push('POST-' + postId);
  if (contentId) subjects.push('CT-' + contentId);
  if (!subjects.length) subjects.push('BIO');
  return subjects.join(' / ') + ' - ' + channelLabel + ' - ' + date;
}

function buildContentVisitEventTitle_(context) {
  const subjects = [];
  if (context.postId && context.channelLabel === 'Telegram') subjects.push('TG-' + context.postId);
  if (context.postId && context.channelLabel !== 'Telegram') subjects.push('POST-' + context.postId);
  if (context.contentId) subjects.push('CT-' + context.contentId);
  if (!subjects.length) subjects.push('BIO');
  const time = Utilities.formatDate(context.nowDate || new Date(), CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd HH:mm:ss');
  return subjects.join(' / ') + ' - ' + context.channelLabel + ' - ' + time + ' JST';
}

function normalizeContentVisitPublicationUrl_(params, channel, postId) {
  const explicit = contentVisitSafeUrl_(params && params.publicationUrl);
  if (explicit) return explicit;
  if (channel === 'telegram' && postId) return 'https://t.me/samuray_tours/' + postId;
  return '';
}

function normalizeContentVisitChannel_(value) {
  const channel = contentVisitText_(value).toLowerCase();
  const aliases = {
    tg: 'telegram',
    telegram: 'telegram',
    ig: 'instagram',
    instagram: 'instagram',
    vk: 'vk',
    googlemaps: 'googlemaps',
    'google-maps': 'googlemaps',
    google_maps: 'googlemaps',
    tripster: 'tripster',
    airbnb: 'airbnb',
    viator: 'viator',
    direct: 'direct',
  };
  return aliases[channel] || 'direct';
}

function contentVisitChannelLabel_(channel) {
  const labels = {
    telegram: 'Telegram',
    instagram: 'Instagram',
    vk: 'VK',
    googlemaps: 'Google Maps',
    tripster: 'Tripster',
    airbnb: 'Airbnb',
    viator: 'Viator',
    direct: 'Прямой',
  };
  return labels[channel] || labels.direct;
}

function normalizeContentVisitDevice_(value) {
  const device = contentVisitText_(value).toLowerCase();
  return ['desktop', 'mobile', 'tablet'].indexOf(device) !== -1 ? device : 'desktop';
}

function contentVisitDeviceProperty_(device) {
  const properties = {
    desktop: 'Переходы - компьютер',
    mobile: 'Переходы - телефон',
    tablet: 'Переходы - планшет',
  };
  return properties[device] || properties.desktop;
}

function contentVisitDeviceLabel_(device) {
  const labels = {
    desktop: 'Компьютер',
    mobile: 'Телефон',
    tablet: 'Планшет',
  };
  return labels[device] || 'Неизвестно';
}

function buildContentVisitDeviceDescription_(params, device) {
  const labels = { desktop: 'компьютер', mobile: 'телефон', tablet: 'планшет' };
  const parts = [labels[device] || labels.desktop];
  const platform = contentVisitText_(params && params.platform);
  const os = contentVisitText_(params && params.os);
  const browser = contentVisitText_(params && params.browser);
  const timezone = contentVisitText_(params && params.clientTimezone);
  const language = contentVisitText_(params && params.language);
  const screen = contentVisitText_(params && params.screen);
  const viewport = contentVisitText_(params && params.viewport);
  const country = contentVisitText_(params && params.geoCountry);
  const city = contentVisitText_(params && params.geoCity);
  if (platform) parts.push(platform);
  if (os) parts.push(os);
  if (browser) parts.push(browser);
  if (language) parts.push(language);
  if (screen) parts.push('экран ' + screen);
  if (viewport) parts.push('окно ' + viewport);
  if (timezone) parts.push(timezone);
  if (country || city) parts.push([city, country].filter(Boolean).join(', '));
  return parts.join(' | ').slice(0, 500);
}

function contentVisitTourTitle_(tour) {
  const labels = {
    '3d': '3D Токио',
  };
  return labels[tour] || tour;
}

function contentVisitTourLabel_(tour) {
  const title = contentVisitTourTitle_(tour);
  return title ? title + ' (' + tour + ')' : tour;
}

function contentVisitSetRichText_(properties, name, value) {
  const text = contentVisitText_(value);
  if (text) properties[name] = contentVisitRichText_(text);
}

function contentVisitSetNumber_(properties, name, value, min, max) {
  const number = contentVisitFiniteNumber_(value, min, max);
  if (number != null) properties[name] = { number: number };
}

function contentVisitSetUrl_(properties, name, value) {
  const url = contentVisitSafeUrl_(value);
  if (url) properties[name] = { url: url };
}

function contentVisitScriptProperty_(name) {
  return contentVisitText_(PropertiesService.getScriptProperties().getProperty(name));
}

function contentVisitPositiveInteger_(value) {
  const text = contentVisitText_(value);
  if (!/^\d+$/.test(text)) return null;
  const number = parseInt(text, 10);
  return number > 0 ? number : null;
}

function contentVisitFiniteNumber_(value, min, max) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!isFinite(number)) return null;
  if (typeof min === 'number' && number < min) return null;
  if (typeof max === 'number' && number > max) return null;
  return number;
}

function contentVisitBoolean_(value) {
  if (value === true || value === 1) return true;
  const text = contentVisitText_(value).toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'on';
}

function contentVisitIsoDate_(value) {
  const text = contentVisitText_(value);
  if (!text) return '';
  const date = new Date(text);
  return isNaN(date.getTime()) ? '' : date.toISOString();
}

function contentVisitText_(value) {
  return String(value == null ? '' : value).trim();
}

function contentVisitSafeUrl_(value) {
  const text = contentVisitText_(value);
  return /^https?:\/\//i.test(text) ? text.slice(0, 2000) : '';
}

function contentVisitNumber_(property) {
  return property && typeof property.number === 'number' ? property.number : 0;
}

function contentVisitDate_(property) {
  return property && property.date && property.date.start ? property.date.start : null;
}

function contentVisitPlainText_(property) {
  const richText = property && property.rich_text ? property.rich_text : [];
  return richText.map(function (item) {
    return item && item.plain_text ? item.plain_text : '';
  }).join('');
}

function contentVisitTitle_(value) {
  return { title: [{ text: { content: contentVisitText_(value).slice(0, 2000) } }] };
}

function contentVisitRichText_(value) {
  const text = contentVisitText_(value).slice(0, 2000);
  return { rich_text: text ? [{ text: { content: text } }] : [] };
}

function contentVisitJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
