const CONTENT_VISIT_NOTION_VERSION_ = '2026-03-11';
const CONTENT_VISIT_CONTENT_SOURCE_FALLBACK_ = '28d6d74c-b01d-4a5a-8f32-cbcdb22efcfa';
const CONTENT_VISIT_METRICS_SOURCE_FALLBACK_ = 'ee1f58dd-ae30-4968-a43a-a60344e1ce63';
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
    content: '',
    channel: 'telegram',
    post: 135,
    publicationUrl: 'https://t.me/samuray_tours/135',
    tour: '',
    pageUrl: 'https://samuray-games.github.io/samuray-tours/?channel=telegram&post=135',
    referrer: 'Apps Script manual test',
    device: 'desktop',
    platform: 'Google Apps Script',
    userAgent: 'TEST_CONTENT_VISIT_WRITE',
    language: 'ru',
    screen: '',
    viewport: '',
    clientTimezone: CONTENT_VISIT_TIMEZONE_,
    clientTimestamp: new Date().toISOString(),
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
  const contentId = contentVisitPositiveInteger_(params && params.content);
  const postId = contentVisitPositiveInteger_(params && params.post);
  const publicationUrl = normalizeContentVisitPublicationUrl_(params, channel, postId);
  const device = normalizeContentVisitDevice_(params && params.device);
  const date = Utilities.formatDate(new Date(), CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd');
  const metricTitle = buildContentVisitMetricTitle_(contentId, postId, channelLabel, date);
  const token = contentVisitScriptProperty_('NOTION_TOKEN');
  const contentSourceId = contentVisitScriptProperty_('NOTION_CONTENT_DATA_SOURCE_ID') || CONTENT_VISIT_CONTENT_SOURCE_FALLBACK_;
  const metricsSourceId = contentVisitScriptProperty_('NOTION_METRICS_DATA_SOURCE_ID') || CONTENT_VISIT_METRICS_SOURCE_FALLBACK_;

  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  cache.put(cacheKey, '1', 21600);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let contentPage = null;
    if (contentId) {
      contentPage = findContentVisitContentPage_(token, contentSourceId, contentId);
      if (!contentPage) {
        throw new Error('Content record not found for ID ' + contentId);
      }
    }

    const existing = findContentVisitMetricPage_(token, metricsSourceId, metricTitle);
    const deviceProperty = contentVisitDeviceProperty_(device);
    const deviceDescription = buildContentVisitDeviceDescription_(params, device);
    let metricPage = null;
    let total = 1;
    let deviceTotal = 1;

    if (existing) {
      total = contentVisitNumber_(existing.properties && existing.properties['Переходы']) + 1;
      deviceTotal = contentVisitNumber_(existing.properties && existing.properties[deviceProperty]) + 1;
      const properties = {
        'Переходы': { number: total },
        'Последний переход': { date: { start: new Date().toISOString() } },
        'Последнее устройство': contentVisitRichText_(deviceDescription),
      };
      if (postId) properties['Номер публикации'] = { number: postId };
      if (publicationUrl) properties['Ссылка публикации'] = { url: publicationUrl };
      properties[deviceProperty] = { number: deviceTotal };
      metricPage = updateContentVisitMetricPage_(token, existing.id, properties);
    } else {
      const properties = {
        'Публикация': contentVisitTitle_(metricTitle),
        'Дата': { date: { start: date } },
        'Канал': { select: { name: channelLabel } },
        'Переходы': { number: 1 },
        'Переходы - компьютер': { number: device === 'desktop' ? 1 : 0 },
        'Переходы - телефон': { number: device === 'mobile' ? 1 : 0 },
        'Переходы - планшет': { number: device === 'tablet' ? 1 : 0 },
        'Последний переход': { date: { start: new Date().toISOString() } },
        'Последнее устройство': contentVisitRichText_(deviceDescription),
      };
      if (postId) properties['Номер публикации'] = { number: postId };
      if (publicationUrl) properties['Ссылка публикации'] = { url: publicationUrl };
      if (contentPage && contentPage.id) {
        properties['Контент'] = { relation: [{ id: contentPage.id }] };
      }
      metricPage = createContentVisitMetricPage_(token, metricsSourceId, properties);
    }

    return {
      ok: true,
      duplicate: false,
      eventId: eventId,
      contentId: contentId,
      postId: postId,
      publicationUrl: publicationUrl || null,
      channel: channel,
      channelLabel: channelLabel,
      device: device,
      total: total,
      deviceTotal: deviceTotal,
      metricTitle: metricTitle,
      metricPageId: metricPage && metricPage.id ? metricPage.id : null,
      metricUrl: metricPage && metricPage.url ? metricPage.url : null,
    };
  } catch (err) {
    cache.remove(cacheKey);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function inspectContentVisitMetric_(params) {
  const channel = normalizeContentVisitChannel_(params && params.channel);
  const channelLabel = contentVisitChannelLabel_(channel);
  const contentId = contentVisitPositiveInteger_(params && params.content);
  const postId = contentVisitPositiveInteger_(params && params.post);
  const date = Utilities.formatDate(new Date(), CONTENT_VISIT_TIMEZONE_, 'yyyy-MM-dd');
  const metricTitle = buildContentVisitMetricTitle_(contentId, postId, channelLabel, date);
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
  return contentVisitNotionRequest_(token, 'https://api.notion.com/v1/pages', 'post', {
    parent: { data_source_id: dataSourceId },
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

function buildContentVisitMetricTitle_(contentId, postId, channelLabel, date) {
  const subjects = [];
  if (postId && channelLabel === 'Telegram') subjects.push('TG-' + postId);
  if (contentId) subjects.push('CT-' + contentId);
  if (!subjects.length) subjects.push('BIO');
  return subjects.join(' / ') + ' - ' + channelLabel + ' - ' + date;
}

function normalizeContentVisitPublicationUrl_(params, channel, postId) {
  const explicit = contentVisitText_(params && params.publicationUrl);
  if (/^https?:\/\//i.test(explicit)) return explicit.slice(0, 2000);
  if (channel === 'telegram' && postId) return 'https://t.me/samuray_tours/' + postId;
  return '';
}

function normalizeContentVisitChannel_(value) {
  const channel = contentVisitText_(value).toLowerCase();
  return ['telegram', 'instagram', 'vk', 'direct'].indexOf(channel) !== -1 ? channel : 'direct';
}

function contentVisitChannelLabel_(channel) {
  const labels = {
    telegram: 'Telegram',
    instagram: 'Instagram',
    vk: 'VK',
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

function buildContentVisitDeviceDescription_(params, device) {
  const labels = { desktop: 'компьютер', mobile: 'телефон', tablet: 'планшет' };
  const parts = [labels[device] || labels.desktop];
  const platform = contentVisitText_(params && params.platform);
  const timezone = contentVisitText_(params && params.clientTimezone);
  const language = contentVisitText_(params && params.language);
  const screen = contentVisitText_(params && params.screen);
  const viewport = contentVisitText_(params && params.viewport);
  if (platform) parts.push(platform);
  if (language) parts.push(language);
  if (screen) parts.push('экран ' + screen);
  if (viewport) parts.push('окно ' + viewport);
  if (timezone) parts.push(timezone);
  return parts.join(' | ').slice(0, 500);
}

function contentVisitScriptProperty_(name) {
  return contentVisitText_(PropertiesService.getScriptProperties().getProperty(name));
}

function contentVisitPositiveInteger_(value) {
  const text = contentVisitText_(value);
  if (!/^\d+$/.test(text)) return null;
  const number = parseInt(text, 10);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function contentVisitNumber_(property) {
  const value = property && property.number;
  return Number.isFinite(value) ? value : 0;
}

function contentVisitPlainText_(property) {
  const items = property && property.rich_text ? property.rich_text : [];
  return items.map(function (item) {
    return item && item.plain_text ? item.plain_text : '';
  }).join('');
}

function contentVisitDate_(property) {
  return property && property.date && property.date.start ? property.date.start : null;
}

function contentVisitTitle_(text) {
  return { title: [{ text: { content: contentVisitText_(text).slice(0, 2000) } }] };
}

function contentVisitRichText_(text) {
  return { rich_text: [{ text: { content: contentVisitText_(text).slice(0, 2000) } }] };
}

function contentVisitText_(value) {
  return String(value == null ? '' : value).trim();
}

function contentVisitJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
