const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/khaldounaakramah/.local/lib/node_modules/@playwright/cli/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const url = 'file://' + path.join(root, 'index.html');
const evidence = path.join(root, 'evidence');
(async () => {
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const report = {url, checks:[], screenshots:[], errors:[]};
  try {
    for (const width of [1440,390,375]) {
      const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      page.on('pageerror', e => report.errors.push(e.message));
      await page.goto(url, {waitUntil:'load'});
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => { const images=[...document.images]; images.forEach(i=>i.loading='eager'); await Promise.all(images.map(i=>i.decode().catch(()=>{}))); });
      const state = await page.evaluate(() => ({overflow: document.documentElement.scrollWidth > innerWidth + 1,broken:[...document.images].filter(i => !i.complete || i.naturalWidth===0).map(i => i.src),h1:document.querySelectorAll('h1').length,hiddenText:[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity==='0').length}));
      if (state.overflow || state.broken.length || state.h1!==1 || state.hiddenText) throw new Error(`${width}: ${JSON.stringify(state)}`);
      report.checks.push(`${width}px: no overflow, all images loaded, one h1, reduced-motion text visible`);
      if (width!==375) {
        const file=`page-${width}.png`;
        await page.screenshot({path:path.join(evidence,file),fullPage:true});
        report.screenshots.push(file);
      }
      if (width===390) {
        await page.locator('#holdButton').focus();
        await page.keyboard.press('Enter');
        if (!(await page.locator('#decisionStage').evaluate(e=>e.classList.contains('is-held')))) throw new Error('Keyboard interaction failed');
        if (!(await page.locator('#holdResult').textContent()).includes('ابحث عن المصدر')) throw new Error('Decision feedback failed');
        report.checks.push('Keyboard decision works with visible feedback');
      }
      await page.close();
    }
    const motionPage = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});
    await motionPage.goto(url,{waitUntil:'load'});
    for (const element of await motionPage.locator('.reveal').all()) { await element.scrollIntoViewIfNeeded(); await motionPage.waitForTimeout(120); }
    await motionPage.waitForTimeout(900);
    const invisible = await motionPage.locator('.reveal:not(.in-view)').count();
    if (invisible) throw new Error(`${invisible} animated sections did not reveal`);
    report.checks.push('Normal scrolling reveals every section');
    await motionPage.close();
    const page = await browser.newPage({viewport:{width:1200,height:630},reducedMotion:'reduce',deviceScaleFactor:1});
    await page.goto(url,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    await page.addStyleTag({content:'.hero-top,.hero-scroll{display:none!important}.hero-copy{position:absolute;top:50%;right:40px;width:calc(100% - 80px);transform:translateY(-50%);padding:0}'});
    await page.screenshot({path:path.join(root,'images','og-share.jpg'),type:'jpeg',quality:87});
    report.checks.push('OG preview rendered at 1200x630');
    await page.close();
    if(report.errors.length) throw new Error(report.errors.join('\n'));
    report.passed=true;
    fs.writeFileSync(path.join(evidence,'browser-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exit(1)});
