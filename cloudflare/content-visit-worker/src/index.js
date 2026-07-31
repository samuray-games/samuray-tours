const ALLOWED_CHANNELS = new Set([
  'telegram',
  'instagram',
  'vk',
  'googlemaps',
  'tripster',
  'airbnb',
  'viator',
  'direct',
]);

const CONTINENT_NAMES_RU = {
  AF: 'Африка',
  AN: 'Антарктида',
  AS: 'Азия',
  EU: 'Европа',
  NA: 'Северная Америка',
  OC: 'Океания',
  SA: 'Южная Америка',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function cleanText(value, maxLength = 500) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function positiveInteger(value) {
  const text = cleanText(value, 32);
  if (!/^\d+$/.test(text)) return '';
  const number = Number.parseInt(text, 10);
  return number > 0 ? String(number) : '';
}

function normalizeChannel(value) {
  const raw = cleanText(value, 40).toLowerCase();
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
  return aliases[raw] || 'direct';
}

function safeHttpUrl(value) {
  const text = cleanText(value, 2000);
  if (!/^https?:\/\//i.test(text)) return '';
  try {
    return new URL(text).toString();
  } catch {
    return '';
  }
}

function countryNameRu(countryCode) {
  const code = cleanText(countryCode, 2).toUpperCase();
  if (!code) return '';
  try {
    const names = new Intl.DisplayNames(['ru'], { type: 'region' });
    return cleanText(names.of(code), 200) || code;
  } catch {
    return code;
  }
}

function setIfPresent(params, key, value, maxLength = 500) {
  const text = cleanText(value, maxLength);
  if (text) params.set(key, text);
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function noContentResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return noContentResponse();
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    try {
      const incomingUrl = new URL(request.url);
      const debug = incomingUrl.searchParams.get('debug') === '1';
      const eventType = cleanText(incomingUrl.searchParams.get('eventType'), 50);
      const eventId = cleanText(incomingUrl.searchParams.get('eventId'), 200);
      const postId = positiveInteger(incomingUrl.searchParams.get('post'));
      const contentId = positiveInteger(incomingUrl.searchParams.get('content'));
      const channel = normalizeChannel(incomingUrl.searchParams.get('channel'));
      const pageUrl = safeHttpUrl(incomingUrl.searchParams.get('pageUrl'));

      if (eventType !== 'content_visit') {
        return jsonResponse({ ok: false, error: 'Unsupported eventType' }, 400);
      }
      if (!eventId) {
        return jsonResponse({ ok: false, error: 'Missing eventId' }, 400);
      }
      if (!postId && !contentId) {
        return jsonResponse({ ok: false, error: 'Missing post or content identifier' }, 400);
      }
      if (!ALLOWED_CHANNELS.has(channel)) {
        return jsonResponse({ ok: false, error: 'Unsupported channel' }, 400);
      }
      if (!pageUrl) {
        return jsonResponse({ ok: false, error: 'Missing pageUrl' }, 400);
      }

      const parsedPageUrl = new URL(pageUrl);
      if (parsedPageUrl.hostname !== 'samuray-games.github.io' || !parsedPageUrl.pathname.startsWith('/samuray-tours')) {
        return jsonResponse({ ok: false, error: 'Untrusted pageUrl' }, 403);
      }

      const appsScriptUrl = safeHttpUrl(env.APPS_SCRIPT_URL);
      if (!appsScriptUrl) {
        return jsonResponse({ ok: false, error: 'APPS_SCRIPT_URL is not configured' }, 500);
      }

      const target = new URL(appsScriptUrl);
      incomingUrl.searchParams.forEach((value, key) => {
        if (key === 'debug') return;
        if (key.startsWith('geo')) return;
        if (key === 'sourceUrl') return;
        if (key === 'cloudflareRayId') return;
        target.searchParams.set(key, cleanText(value, 2000));
      });

      target.searchParams.set('channel', channel);
      if (postId) target.searchParams.set('post', postId);
      if (contentId) target.searchParams.set('content', contentId);
      target.searchParams.set('sourceUrl', `${incomingUrl.origin}${incomingUrl.pathname}`);

      const cf = request.cf || {};
      const countryCode = cleanText(cf.country || request.headers.get('CF-IPCountry'), 2).toUpperCase();
      const continentCode = cleanText(cf.continent, 2).toUpperCase();

      setIfPresent(target.searchParams, 'geoCountry', countryNameRu(countryCode), 200);
      setIfPresent(target.searchParams, 'geoCountryCode', countryCode, 2);
      setIfPresent(target.searchParams, 'geoContinent', CONTINENT_NAMES_RU[continentCode] || continentCode, 100);
      setIfPresent(target.searchParams, 'geoRegion', cf.region, 300);
      setIfPresent(target.searchParams, 'geoRegionCode', cf.regionCode, 100);
      setIfPresent(target.searchParams, 'geoCity', cf.city, 300);
      setIfPresent(target.searchParams, 'geoPostalCode', cf.postalCode, 100);
      setIfPresent(target.searchParams, 'geoTimezone', cf.timezone, 100);
      setIfPresent(target.searchParams, 'geoLatitude', cf.latitude, 50);
      setIfPresent(target.searchParams, 'geoLongitude', cf.longitude, 50);
      setIfPresent(target.searchParams, 'geoAsn', cf.asn, 50);
      setIfPresent(target.searchParams, 'geoAsOrganization', cf.asOrganization, 500);
      setIfPresent(target.searchParams, 'geoColo', cf.colo, 20);
      setIfPresent(target.searchParams, 'cloudflareRayId', request.headers.get('CF-Ray'), 100);

      const upstreamResponse = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SamuRay-Tours-Content-Visit-Worker/1.0',
        },
      });

      const upstreamText = await upstreamResponse.text();
      let upstreamPayload = null;
      try {
        upstreamPayload = JSON.parse(upstreamText);
      } catch {
        upstreamPayload = { raw: cleanText(upstreamText, 1000) };
      }

      if (!upstreamResponse.ok || !upstreamPayload || upstreamPayload.ok !== true) {
        return jsonResponse({
          ok: false,
          upstreamStatus: upstreamResponse.status,
          upstream: upstreamPayload,
        }, 502);
      }

      if (debug) {
        return jsonResponse({
          ok: true,
          worker: 'samuray-content-visits',
          geolocationAttached: Boolean(countryCode || cf.city || cf.region),
          countryCode: countryCode || null,
          city: cleanText(cf.city, 300) || null,
          upstream: upstreamPayload,
        });
      }

      return noContentResponse();
    } catch (error) {
      return jsonResponse({
        ok: false,
        error: cleanText(error && error.message ? error.message : error, 1000),
      }, 500);
    }
  },
};
