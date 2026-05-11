const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    //my chrome
    const browser = await puppeteer.launch({ 
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: "new",
        args: ['--no-sandbox'] 
    });

    const page = await browser.newPage();
    
    //console.log("Pornim cu Google Chrome local...");

    page.on('response', async (response) => {
        if (response.url().includes('https://airnet.waqi.info/airnet/map/bounds')) {
            try {
                const data = await response.json();
                const filePath = path.join(__dirname, 'date_aer.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log("JSON salvat cu succes la: " + filePath);
                await browser.close();
                process.exit(0);
            } catch (e) {
                console.error("Eroare parsare JSON:", e);
            }
        }
    });

    await page.goto('https://aqicn.org/station/@130207/ro/', { waitUntil: 'networkidle2' });
    
    // Safety exit if it doesn't trigger within 30 seconds
    setTimeout(async () => {
        console.log(" Nu s-a putut intercepta request-ul in 30 de secunde, inchidem.");
        await browser.close();
        process.exit(1);
    }, 30000);
})();
