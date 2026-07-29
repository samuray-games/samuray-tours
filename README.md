# SamuRay Tours

Публичный каталог авторских экскурсий SamuRay Tours по Токио.

## Frontend

GitHub Pages публикует `index.html` из ветки `main`, корень репозитория.

Текущий GitHub Pages URL:

`https://samuray-games.github.io/samuray-tours/`

Будущий кастомный домен:

`samuray.tours`

## Заявки

Форма находится прямо в `index.html`. Выбранный тур подставляется автоматически.

Текущий Google Apps Script Web App URL:

`https://script.google.com/macros/s/AKfycbztCYRPUfjdHesTP0hDl9WEwP_Uapj31sLkYH8mO89qvREswQ_5n5Ccv8rP2he66bPiHA/exec`

Если backend недоступен, фронтенд открывает письмо на `raykhalit@icloud.com` с заполненными данными заявки.

Backend находится в:

`backend/Code.gs`

Он должен:

1. отправлять новую заявку на `raykhalit@icloud.com`;
2. создавать запись в Notion CRM `Бронирования SamuRay Tours`.

## Secrets

Никогда не добавлять Notion token или другие секреты в `index.html` или публичный репозиторий.

В Google Apps Script использовать Script Properties:

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

Текущий ID базы бронирований:

`cb03fce6-cc9f-4627-ad29-f5e1617c437b`

В текущей CRM значение источника каталога сохраняется как `Источник = Каталог`, а `Каталог SamuRay Tours` дополнительно записывается в `Платформа / номер` и `Особые запросы`, потому что отдельного select-значения `Каталог SamuRay Tours` пока нет.

## GitHub Pages

Если Pages ещё не включён:

`Settings -> Pages -> Build and deployment -> Deploy from a branch -> main -> /(root) -> Save`

После включения проверить каталог, фильтры, карточки, подробности, форму и мобильную верстку.

## Атрибуция контента

Заявку можно связать с публикацией в базе `Контент SamuRay Tours`, добавив к URL каталога параметры `content` и `channel`.

Параметры `content` и `channel` отвечают только за атрибуцию. Чтобы ссылка сразу раскрывала конкретную экскурсию, добавляется параметр `tour` с ID тура.

Примеры полной ссылки на `3D Токио`:

- `https://samuray-games.github.io/samuray-tours/?tour=3d&content=123&channel=telegram`
- `https://samuray-games.github.io/samuray-tours/?tour=3d&content=123&channel=instagram`
- `https://samuray-games.github.io/samuray-tours/?tour=3d&content=123&channel=vk`

Ссылка без `tour`, например `?content=123&channel=telegram`, открывает общий каталог и сохраняет атрибуцию для последующей заявки, но не выбирает экскурсию автоматически.

`content` - положительное целое число из свойства `ID контента` без префикса `CT-`.

Допустимые значения `channel`:

- `telegram`
- `instagram`
- `vk`
- `direct`

Backend читает параметры из уже передаваемого `pageUrl`, ищет запись по `ID контента` и при единственном совпадении заполняет relation `Контент` в бронировании. Relation `Контент 1` не используется.

В Google Apps Script можно задать Script Property:

- `NOTION_CONTENT_DATA_SOURCE_ID`

Fallback data source ID:

`28d6d74c-b01d-4a5a-8f32-cbcdb22efcfa`

Ручные безопасные проверки, не создающие бронирования:

- `TEST_PARSE_ATTRIBUTION`
- `TEST_CONTENT_LOOKUP`
