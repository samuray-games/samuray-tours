# SamuRay Tours

Публичный каталог авторских экскурсий SamuRay Tours по Токио.

## Frontend

GitHub Pages публикует `index.html` из ветки `main`, корень репозитория.

Планируемый GitHub Pages URL:

`https://samuray-games.github.io/samuray-tours/`

Будущий кастомный домен:

`samuray.tours`

## Заявки

Форма находится прямо в `index.html`. Выбранный тур подставляется автоматически.

Для реальной отправки нужно заменить:

`PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`

на URL опубликованного Google Apps Script Web App.

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

`cb03fce6cc9f4627ad29f5e1617c437b`

В текущей CRM значение источника каталога сохраняется как `Источник = Прямой`, а `Каталог SamuRay Tours` дополнительно записывается в `Платформа / номер` и `Особые запросы`, потому что отдельного select-значения `Каталог SamuRay Tours` пока нет.

## GitHub Pages

Если Pages ещё не включён:

`Settings -> Pages -> Build and deployment -> Deploy from a branch -> main -> /(root) -> Save`

После включения проверить каталог, фильтры, карточки, подробности, форму и мобильную верстку.
