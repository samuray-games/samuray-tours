import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const site = 'https://samuray-games.github.io/samuray-tours/';
const browser = await chromium.launch({headless:true});
await mkdir('test-artifacts',{recursive:true});
for (const [label,width,height] of [['desktop',1440,900],['iphone',390,844]]) {
  const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.SAMURAY_PHOTO_LAYER && window.SAMURAY_PHOTO_LAYER.tourCount===25,{timeout:60000});
  await page.waitForSelector('#grid .card[data-photo-ready]',{timeout:30000});
  await page.evaluate(() => {
    document.querySelectorAll('#grid .card[data-photo-ready] .tour-photo-open img')
      .forEach(img => { img.loading = 'eager'; });
  });
  await page.waitForFunction(() => Array.from(
    document.querySelectorAll('#grid .card[data-photo-ready] .tour-photo-open img')
  ).length === 25 && Array.from(
    document.querySelectorAll('#grid .card[data-photo-ready] .tour-photo-open img')
  ).every(img => img.complete && img.naturalWidth > 100), null, {timeout:45000});
  const count = await page.locator('#grid .card[data-photo-ready]').count();
  const withImages = await page.locator('#grid .card[data-photo-ready] .tour-photo-open img').count();
  assert.equal(count,25,'Expected 25 tour cards, found '+count);
  assert.equal(withImages,25,'Expected 25 tour images, found '+withImages);
  const photoStatus = await page.locator('#grid .card[data-photo-ready] .tour-photo-open img').evaluateAll(imgs=>imgs.map(img=>({
    tour:img.closest('.card')?.getAttribute('data-tour-id')||img.closest('.card')?.getAttribute('data-catalog25-card'),
    complete:img.complete, width:img.naturalWidth, src:img.currentSrc
  })));
  const failed = photoStatus.filter(x=>!x.complete||x.width<100);
  assert.equal(failed.length,0,'Broken photos: '+JSON.stringify(failed));
  const docWidth = await page.evaluate(()=>document.documentElement.scrollWidth);
  assert(docWidth<=width+4,'Unexpected horizontal scroll: '+docWidth+' for '+width);
  await page.screenshot({path:'test-artifacts/catalog-'+label+'.png',fullPage:true});
  const firstPhoto = page.locator('#grid .card[data-tour-id="asakusa"] .tour-photo-open');
  assert.equal(await firstPhoto.count(),1,'Asakusa cover button missing');
  await firstPhoto.click();
  await page.waitForSelector('#modal.open .tour-detail-poster[data-photo-ready="asakusa"]',{timeout:12000});
  assert(await page.locator('#modal.open').getByText('Оставить заявку').count()>0,'Booking CTA missing');
  assert((await page.locator('#modal.open .tour-poster-artstage').count())>0,'Photo poster missing');
  await page.screenshot({path:'test-artifacts/asakusa-modal-'+label+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Browser JS errors: '+errors.join('; '));
  console.log('PASS '+label+': 25/25 images, modal and booking CTA, width '+docWidth+', no JS errors');
  await page.close();
}
await browser.close();
