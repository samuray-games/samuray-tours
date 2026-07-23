/**
 * SamuRay Tours - обработчик заявок каталога.
 *
 * Что делает:
 * 1) принимает JSON от сайта;
 * 2) отправляет уведомление на raykhalit@icloud.com;
 * 3) создаёт запись в Notion "Бронирования SamuRay Tours".
 *
 * Script Properties:
 * NOTION_TOKEN       - Internal Integration Secret из Notion
 * NOTION_DATABASE_ID - ID базы бронирований
 */

const OWNER_EMAIL = 'raykhalit@icloud.com';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    validate_(payload);
    const emailResult = sendEmail_(payload);
    const notionResult = createNotionBooking_(payload);
    return json_({ ok: true, email: emailResult, notion: notionResult });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'SamuRay Tours applications' });
}

function validate_(p) {
  ['name', 'contactType', 'contact', 'date', 'tourTitle'].forEach(k => {
    if (!String(p[k] || '').trim()) throw new Error('Missing field: ' + k);
  });
}

function sendEmail_(p) {
  const guests = Number(p.adults || 0) + Number(p.children || 0);
  const subject = `Новая заявка SamuRay Tours: ${p.tourTitle} - ${p.date}`;
  const body = [
    'Новая заявка из каталога SamuRay Tours',
    '',
    `Тур: ${p.tourTitle}`,
    `Цена в каталоге: ${p.tourPrice || '-'}`,
    `Дата: ${p.date}`,
    `Альтернативная дата: ${p.altDate || '-'}`,
    `Гостей: ${guests} (${p.adults || 0} взрослых, ${p.children || 0} детей)`,
    `Возраст детей: ${p.childrenAges || '-'}`,
    `Отель / район: ${p.hotel || '-'}`,
    `Интересы: ${(p.interests || []).join(', ') || '-'}`,
    `Пожелания: ${p.notes || '-'}`,
    '',
    `Клиент: ${p.name}`,
    `Связь: ${p.contactType}`,
    `Контакт: ${p.contact}`,
    '',
    'Источник: Каталог SamuRay Tours',
    `Страница: ${p.pageUrl || '-'}`,
    `Отправлено: ${p.submittedAt || new Date().toISOString()}`
  ].join('\n');

  MailApp.sendEmail({ to: OWNER_EMAIL, subject, body, name: 'SamuRay Tours' });
  return 'sent';
}

function createNotionBooking_(p) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('NOTION_TOKEN');
  const databaseId = props.getProperty('NOTION_DATABASE_ID');
  if (!token || !databaseId) throw new Error('Set NOTION_TOKEN and NOTION_DATABASE_ID in Script Properties');

  const adults = Number(p.adults || 0);
  const children = Number(p.children || 0);
  const guests = adults + children;
  const special = [
    p.notes ? `Пожелания: ${p.notes}` : '',
    p.interests && p.interests.length ? `Интересы: ${p.interests.join(', ')}` : '',
    children ? `Дети: ${children}; возраст: ${p.childrenAges || 'не указан'}` : '',
    p.altDate ? `Альтернативная дата: ${p.altDate}` : '',
    `Контакт: ${p.contactType} - ${p.contact}`,
    'Источник: Каталог SamuRay Tours'
  ].filter(Boolean).join('\n');

  const notionPayload = {
    parent: { database_id: databaseId },
    properties: {
      'Бронирование': { title: [{ text: { content: `${p.name} - ${p.tourTitle}` } }] },
      'Дата действия': { date: { start: p.date } },
      'Дата бронирования': { date: { start: new Date().toISOString().slice(0, 10) } },
      'Гостей': { number: guests },
      'Место встречи / отель': { rich_text: [{ text: { content: String(p.hotel || '') } }] },
      'Особые запросы': { rich_text: [{ text: { content: special.slice(0, 1900) } }] },
      'Источник': { select: { name: 'Прямой' } },
      'Канал импорта': { select: { name: 'Другое' } },
      'Платформа / номер': { rich_text: [{ text: { content: 'Каталог SamuRay Tours' } }] }
    }
  };

  const response = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': '2022-06-28'
    },
    payload: JSON.stringify(notionPayload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const txt = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Notion error ' + code + ': ' + txt);
  const obj = JSON.parse(txt);
  return obj.id || 'created';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
