# SamuRay Tours content visit Worker

Cloudflare Worker for privacy-safe click geolocation.

## What it does

1. Receives a click event from the SamuRay Tours catalog.
2. Reads approximate geolocation and network metadata from Cloudflare `request.cf`.
3. Does not read, store, hash, or forward the visitor IP address.
4. Forwards the event and anonymized metadata to the existing Google Apps Script endpoint.
5. Google Apps Script updates the daily aggregate and creates one row in `Контент-переходы SamuRay Tours`.

## Data forwarded

- country name and ISO code
- continent
- region and region code
- city and postal code
- network timezone
- approximate latitude and longitude
- ASN and network organization
- Cloudflare data center code
- content, channel, tour, time, device, browser, OS, screen, language and network profile

## Deployment

```bash
cd cloudflare/content-visit-worker
npm install
npx wrangler login
npm run deploy
```

Wrangler prints the deployed URL, normally similar to:

```text
https://samuray-content-visits.<account-subdomain>.workers.dev
```

Cloudflare documents `wrangler deploy` as the standard Worker deployment command, and `workers.dev` provides a route for the Worker without requiring a separate domain.

## Test

Open the deployed URL with a real tracking payload and `debug=1`:

```text
https://samuray-content-visits.<account-subdomain>.workers.dev/?debug=1&eventType=content_visit&eventId=manual-worker-test-1&content=311&channel=telegram&tour=3d&pageUrl=https%3A%2F%2Fsamuray-games.github.io%2Fsamuray-tours%2F%3Ftour%3D3d%26content%3D311%26channel%3Dtelegram&catalogUrl=https%3A%2F%2Fsamuray-games.github.io%2Fsamuray-tours%2F&device=desktop
```

Expected response:

```json
{
  "ok": true,
  "worker": "samuray-content-visits",
  "geolocationAttached": true,
  "upstream": {
    "ok": true,
    "eventLogged": true
  }
}
```

The Cloudflare Dashboard and Playground preview may not populate `request.cf`, so geolocation should be verified on the deployed `workers.dev` URL.

## Connect the catalog

After deployment, set the Worker URL as the click endpoint before the tracking include runs:

```html
<meta name="samuray-content-visit-endpoint" content="https://samuray-content-visits.<account-subdomain>.workers.dev/">
```

The frontend falls back to the existing Apps Script URL until this meta tag is added. That means device details can be collected before the Worker is connected, while IP-derived geolocation remains empty.

## Privacy rule

Do not add `CF-Connecting-IP`, `X-Forwarded-For`, a hashed IP, or any other persistent IP-derived identifier to the forwarded payload or Notion schema.
