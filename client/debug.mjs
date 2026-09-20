import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // Listen for console messages
        page.on('console', msg => {
            console.log(`PAGE LOG [${msg.type()}]:`, msg.text());
        });

        // Listen for page errors (e.g. unhandled exceptions)
        page.on('pageerror', err => {
            console.error('PAGE ERROR:', err.toString());
        });

        // Go to dashboard
        await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0', timeout: 10000 });
        
        await browser.close();
    } catch (e) {
        console.error('PUPPETEER ERROR:', e.message);
    }
})();
