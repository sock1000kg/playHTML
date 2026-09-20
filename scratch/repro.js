const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173');
  console.log('Opened home page');
  
  // Wait for "Create Room" button (assuming there's a button with text "Start new room")
  // Let's find the button
  await page.waitForSelector('button');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Start new room')) {
      await btn.click();
      break;
    }
  }
  
  console.log('Clicked Start new room');
  await page.waitForTimeout(1000);
  console.log('Hash is now:', await page.evaluate(() => window.location.hash));
  
  // Now click "Leave Room"
  const leaveButtons = await page.$$('button');
  for (const btn of leaveButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Leave Room')) {
      await btn.click();
      break;
    }
  }
  
  console.log('Clicked Leave Room');
  await page.waitForTimeout(1000);
  console.log('Hash is now:', await page.evaluate(() => window.location.hash));
  
  // Now click "Start new room" again
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Start new room')) {
      await btn.click();
      break;
    }
  }
  
  console.log('Clicked Start new room again');
  await page.waitForTimeout(1000);
  console.log('Hash is now:', await page.evaluate(() => window.location.hash));

  await browser.close();
})();

