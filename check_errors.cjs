const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  console.log(content.slice(0, 1000)); // Print beginning of DOM
  
  const errorBoundaryText = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log("TEXT ON PAGE:", errorBoundaryText);

  await browser.close();
})();
