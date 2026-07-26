function cleanupKnownTestArtifacts() {
  const pageIds = [
    '3a9815ae752f81fab902f1ce4ce909d3',
    '3a9815ae752f8172924bca458e3ddd60',
    '3a9815ae752f818daa78f23657dec839',
    '3a9815ae752f81f0b2f1f36f48e25a15',
  ];
  const results = [];
  for (let i = 0; i < pageIds.length; i++) {
    results.push(trashNotionPage_(pageIds[i]));
  }
  console.log(JSON.stringify(results));
  return results;
}

function trashNotionPage_(pageId) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  if (!token) throw new Error('Set NOTION_TOKEN in Script Properties');

  const response = UrlFetchApp.fetch('https://api.notion.com/v1/pages/' + encodeURIComponent(String(pageId)), {
    method: 'patch',
    contentType: 'application/json',
    headers: notionHeaders_(token),
    payload: JSON.stringify({ in_trash: true }),
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  const text = response.getContentText() || '';
  let body = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch (err) {
    body = null;
  }
  const result = {
    pageId: pageId,
    ok: status >= 200 && status < 300,
    status: status,
    inTrash: body && typeof body.in_trash === 'boolean' ? body.in_trash : null,
    error: status >= 200 && status < 300 ? null : ('Notion API ' + status + ': ' + String(text).replace(/\s+/g, ' ').trim().slice(0, 800)),
  };
  return result;
}
