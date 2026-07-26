function diagnoseRouteRelation() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  const bookingSourceId = props.getProperty('NOTION_BOOKINGS_DATA_SOURCE_ID') || BOOKING_DATA_SOURCE_FALLBACK;
  const routesSourceId = props.getProperty('NOTION_ROUTES_DATA_SOURCE_ID') || ROUTES_DATA_SOURCE_FALLBACK;
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const bookingSchemaResult = notionDiagnosticRequest_(token, 'get', bookingSourceId, null);
  const routesSchemaResult = notionDiagnosticRequest_(token, 'get', routesSourceId, null);
  const bookingSchema = bookingSchemaResult.json || {};
  const routesSchema = routesSchemaResult.json || {};
  const bookingProperties = bookingSchema.properties || {};
  const routesProperties = routesSchema.properties || {};
  const bookingTitleProperty = diagnosticTitleProperty_(bookingProperties);
  const routesTitleProperty = diagnosticTitleProperty_(routesProperties);
  const relationProperties = diagnosticRelationProperties_(bookingProperties);
  const selectedRelationProperty = pickRelationName_(bookingProperties, ['Маршрут', 'Маршруты', 'Экскурсия', 'Экскурсии']);

  const allRoutesResult = notionDiagnosticRequest_(token, 'post', routesSourceId, { page_size: 100 });
  const routePages = allRoutesResult.ok ? extractNotionQueryResults_(allRoutesResult.json || {}) : [];
  const titles = ['Токио Экспресс', 'Цукидзи + Гиндза'];
  const matches = {};

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    matches[title] = diagnoseRouteTitle_(token, routesSourceId, routesTitleProperty, title, routePages);
  }

  const result = {
    ok: bookingSchemaResult.ok && routesSchemaResult.ok && allRoutesResult.ok,
    effectiveBookingsDataSourceId: bookingSourceId,
    effectiveRoutesDataSourceId: routesSourceId,
    bookingSchemaStatus: bookingSchemaResult.status,
    routesSchemaStatus: routesSchemaResult.status,
    routesQueryStatus: allRoutesResult.status,
    bookingSchemaError: bookingSchemaResult.error,
    routesSchemaError: routesSchemaResult.error,
    routesQueryError: allRoutesResult.error,
    bookingTitleProperty: bookingTitleProperty,
    routesTitleProperty: routesTitleProperty,
    relationProperties: relationProperties,
    selectedRelationProperty: selectedRelationProperty,
    selectedRelationTargetId: diagnosticRelationTargetId_(bookingProperties[selectedRelationProperty]),
    routePageCount: routePages.length,
    routePages: routePages,
    matches: matches,
  };

  console.log(JSON.stringify(result));
  return result;
}

function diagnoseRouteTitle_(token, routesSourceId, titlePropertyName, tourTitle, routePages) {
  const resolved = resolveCanonicalRouteTitle_(tourTitle);
  if (!resolved) {
    return {
      inputTitle: tourTitle,
      canonicalTitle: null,
      exactQueryStatus: null,
      exactQueryError: 'Canonical title not resolved',
      matchedRouteId: null,
      matchedRouteTitle: null,
      matched: false,
      ambiguous: false,
    };
  }
  if (!titlePropertyName) {
    return {
      inputTitle: tourTitle,
      canonicalTitle: resolved.title,
      exactQueryStatus: null,
      exactQueryError: 'Routes title property not found',
      matchedRouteId: null,
      matchedRouteTitle: null,
      matched: false,
      ambiguous: false,
    };
  }

  const exactResult = notionDiagnosticRequest_(token, 'post', routesSourceId, {
    page_size: 25,
    filter: {
      property: titlePropertyName,
      title: { equals: resolved.title },
    },
  });
  const exactMatches = exactResult.ok ? extractNotionQueryResults_(exactResult.json || {}) : [];
  let match = null;
  let ambiguous = false;

  if (exactMatches.length === 1) {
    match = exactMatches[0];
  } else if (exactMatches.length > 1) {
    ambiguous = true;
  } else if (exactResult.ok) {
    const candidates = buildRouteSearchTerms_(resolved.title, tourTitle);
    const scored = [];
    for (let i = 0; i < routePages.length; i++) {
      const page = routePages[i] || {};
      const score = scoreRoutePage_(page.title, candidates);
      if (score > 0) scored.push({ id: page.id || null, title: page.title || null, score: score });
    }
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    if (scored.length === 1 || (scored.length > 1 && scored[0].score > scored[1].score)) {
      match = scored[0];
    } else if (scored.length > 1 && scored[0].score === scored[1].score) {
      ambiguous = true;
    }
  }

  return {
    inputTitle: tourTitle,
    canonicalTitle: resolved.title,
    exactQueryStatus: exactResult.status,
    exactQueryError: exactResult.error,
    exactMatchCount: exactMatches.length,
    matchedRouteId: match && match.id ? match.id : null,
    matchedRouteTitle: match && match.title ? match.title : null,
    matched: Boolean(match && match.id),
    ambiguous: ambiguous,
  };
}

function notionDiagnosticRequest_(token, method, dataSourceId, body) {
  const id = String(dataSourceId || '').replace(/^collection:\/\//, '');
  const options = {
    method: method,
    headers: notionHeaders_(token),
    muteHttpExceptions: true,
  };
  if (body != null) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(body);
  }

  const response = UrlFetchApp.fetch('https://api.notion.com/v1/data_sources/' + encodeURIComponent(id) + (method === 'post' ? '/query' : ''), options);
  const status = response.getResponseCode();
  const text = response.getContentText() || '';
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    json = null;
  }
  return {
    ok: status >= 200 && status < 300,
    status: status,
    json: json,
    error: status >= 200 && status < 300 ? null : diagnosticNotionError_(status, text),
  };
}

function diagnosticNotionError_(status, text) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  return 'Notion API ' + status + ': ' + compact.slice(0, 800);
}

function diagnosticTitleProperty_(properties) {
  const names = Object.keys(properties || {});
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (properties[name] && properties[name].type === 'title') return name;
  }
  return null;
}

function diagnosticRelationProperties_(properties) {
  const out = [];
  const names = Object.keys(properties || {});
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const schema = properties[name] || {};
    if (schema.type !== 'relation') continue;
    out.push({
      name: name,
      type: schema.type,
      targetId: diagnosticRelationTargetId_(schema),
    });
  }
  return out;
}

function diagnosticRelationTargetId_(schema) {
  const relation = schema && schema.relation ? schema.relation : {};
  return relation.data_source_id || relation.database_id || relation.synced_property_id || null;
}
