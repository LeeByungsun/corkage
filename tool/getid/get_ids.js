#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// Require Playwright from the local web node_modules to run standalone from any directory
const { chromium } = require('../../web/node_modules/playwright');

// Recursive helper to extract place items from arbitrary API/GraphQL JSON structures
function extractPlacesFromJson(obj, results = new Map()) {
  if (typeof obj !== 'object' || obj === null) return results;

  const hasIdAndName = obj.id && obj.name && typeof obj.id === 'string' && typeof obj.name === 'string';
  const isPlaceItem = hasIdAndName && (
    obj.__typename === 'PlaceListBusinessesItem' ||
    obj.category ||
    obj.categoryPath ||
    obj.categoryPathList
  );

  if (isPlaceItem) {
    const category = obj.category || (Array.isArray(obj.categoryPathList) ? obj.categoryPathList.join(' > ') : (obj.categoryPath || ''));
    results.set(obj.id, {
      id: obj.id,
      name: obj.name,
      category: category,
      roadAddress: obj.roadAddress || obj.address || '',
      fullAddress: obj.fullAddress || obj.roadAddress || obj.address || '',
      x: obj.x || '',
      y: obj.y || ''
    });
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        extractPlacesFromJson(obj[key], results);
      }
    }
  }
  return results;
}

// Balance brace JSON extraction helper for window.__APOLLO_STATE__
function extractJsonBalanced(html, startMarker) {
  const pos = html.indexOf(startMarker);
  if (pos === -1) return null;

  const bracePos = html.indexOf('{', pos);
  if (bracePos === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = bracePos; i < html.length; i++) {
    const char = html[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return html.substring(bracePos, i + 1);
        }
      }
    }
  }
  return null;
}

// Function to fetch details and extract facilities for a specific placeId using HTTP GET
async function fetchPlaceFacilities(placeId) {
  const url = `https://m.place.naver.com/restaurant/${placeId}/home`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
    "Referer": "https://map.naver.com/"
  };

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      console.log(`  -> Failed to fetch place ${placeId}. Status: ${response.status}`);
      return null;
    }
    const html = await response.text();

    if (html.includes("요청하신 페이지를 찾을 수 없습니다")) {
      console.log(`  -> Place ${placeId} got bot-blocked (404 page).`);
      return null;
    }

    const rawJs = extractJsonBalanced(html, "window.__APOLLO_STATE__");
    if (!rawJs) {
      return null;
    }

    const data = JSON.parse(rawJs);
    const facilities = [];
    let corkageInfo = { allowed: false, fee: '정보없음' };

    for (const [key, val] of Object.entries(data)) {
      if (val && val.__typename === 'InformationFacilities') {
        facilities.push(val.name);
        if (val.name.includes('콜키지')) {
          corkageInfo.allowed = true;
          if (val.name.includes('무료')) {
            corkageInfo.fee = '무료';
          } else if (val.name.includes('유료')) {
            corkageInfo.fee = '유료';
          } else {
            corkageInfo.fee = '가능';
          }
        }
      }
    }

    return {
      facilities,
      corkageInfo
    };

  } catch (err) {
    console.error(`  -> Error fetching place ${placeId}:`, err.message);
    return null;
  }
}

// Optimization: check if a category is eligible for corkage to reduce unnecessary detail requests
function isCorkageEligibleCategory(categoryStringOrArray) {
  if (!categoryStringOrArray) return true;

  const cat = Array.isArray(categoryStringOrArray)
    ? categoryStringOrArray.join(' > ')
    : String(categoryStringOrArray);

  const lowerCat = cat.toLowerCase();

  // Non-eligible keywords
  const nonEligibleKeywords = [
    '카페', '디저트', '베이커리', '빵집', '밀키트', '핫도그', '도넛',
    '와플', '아이스크림', '테이크아웃', '샌드위치', '토스트', '피자스쿨',
    '쥬스', '주스', '커피전문점', '제과점', '떡집', '떡방앗간', '도시락',
    '반찬가게', '햄버거', '패스트푸드', '분식', '편의점', '식자재', '정육점'
  ];

  for (const kw of nonEligibleKeywords) {
    if (lowerCat.includes(kw)) return false;
  }

  return true;
}

async function main() {
  const location = process.argv[2] || "경기도 화성시 청계동";
  const keyword = process.argv[3] || "음식점";
  const searchQuery = `${location} ${keyword}`;

  console.log(`Starting place ID and Corkage status extraction...`);
  console.log(`Target Location: ${location}`);
  console.log(`Target Keyword:  ${keyword}`);
  console.log(`Search Query:    "${searchQuery}"`);

  const url = `https://map.naver.com/p/search/${encodeURIComponent(searchQuery)}`;

  // Launch Playwright with stealth options
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 1024 },
    locale: 'ko-KR'
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const allRestaurants = new Map();

  // Monitor network responses to intercept JSON data
  page.on('response', async response => {
    const reqUrl = response.url();
    if (response.status() === 200 && (reqUrl.includes('allSearch') || reqUrl.includes('graphql'))) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const body = await response.json();
          const initialSize = allRestaurants.size;
          extractPlacesFromJson(body, allRestaurants);
          const added = allRestaurants.size - initialSize;
          if (added > 0) {
            console.log(`[API Intercept] Extracted ${added} new unique items. (Total: ${allRestaurants.size})`);
          }
        }
      } catch (e) {
        // Safe check
      }
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 });
    console.log("Main search page loaded.");

    // Access search iframe
    const searchFrame = page.frameLocator('iframe#searchIframe');

    let pageNum = 1;
    while (pageNum <= 10) {
      console.log(`\n--- Crawling Page ${pageNum} ---`);

      // Wait for the list container to be attached
      await searchFrame.locator('#_pcmap_list_scroll_container').waitFor({ timeout: 15000 });

      // Scroll the container down incrementally to trigger lazy loading of all items
      console.log("Scrolling container to load all items...");
      await searchFrame.locator('#_pcmap_list_scroll_container').evaluate(async (container) => {
        if (!container) return;
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            const scrollHeight = container.scrollHeight;
            container.scrollTop += distance;
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 150);
        });
      });

      // Wait a short duration for lazy loading responses
      await page.waitForTimeout(2000);
      console.log(`Page ${pageNum} processing finished. Current total: ${allRestaurants.size}`);

      // Handle next page navigation
      const nextBtn = searchFrame.locator('a:has-text("다음페이지")');
      const nextExists = await nextBtn.count() > 0;
      if (!nextExists) {
        console.log("No next page button found. Ending pagination.");
        break;
      }

      // Check if next button is disabled
      const isNextDisabled = await nextBtn.getAttribute('aria-disabled') === 'true' ||
                             await nextBtn.evaluate(el => el.classList.contains('disabled') || el.classList.contains('readonly')).catch(() => true);

      if (isNextDisabled) {
        console.log("Next page button is disabled. Ending pagination.");
        break;
      }

      // Capture first item text to monitor transition
      const firstNameLocator = searchFrame.locator('.TYaxT').first();
      const p1FirstText = await firstNameLocator.count() > 0 ? await firstNameLocator.textContent() : '';

      // Click next page
      console.log("Clicking next page button...");
      await nextBtn.click();

      // Wait for page transition (first item text changes or timeout)
      console.log("Waiting for new page to load...");
      let transitionDone = false;
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(250);
        const currentFirstText = await firstNameLocator.count() > 0 ? await firstNameLocator.textContent() : '';
        if (currentFirstText && currentFirstText !== p1FirstText) {
          console.log(`Transition detected! New page first item: "${currentFirstText}"`);
          transitionDone = true;
          break;
        }
      }

      if (!transitionDone) {
        console.log("Page transition timed out (5s). Continuing...");
        // Add safety wait
        await page.waitForTimeout(2000);
      }

      pageNum++;
    }

    console.log(`\nCrawl complete! Total unique items found: ${allRestaurants.size}`);

    // Now, run the detail inspection loop
    const resultsArray = Array.from(allRestaurants.values());
    console.log(`\nStarting detail page fetch to inspect corkage status...`);

    let corkageCount = 0;

    for (let i = 0; i < resultsArray.length; i++) {
      const place = resultsArray[i];
      const percent = ((i + 1) / resultsArray.length * 100).toFixed(1);

      // Check if the category is corkage eligible
      if (!isCorkageEligibleCategory(place.category)) {
        place.corkageAllowed = false;
        place.corkageFee = '정보없음';
        place.facilities = [];
        console.log(`[Detail Fetch ${i+1}/${resultsArray.length} (${percent}%)] ID: ${place.id}, Name: ${place.name} -> SKIPPED (Ineligible Category: ${place.category})`);
        continue;
      }

      console.log(`[Detail Fetch ${i+1}/${resultsArray.length} (${percent}%)] ID: ${place.id}, Name: ${place.name} (Eligible Category: ${place.category})...`);

      const details = await fetchPlaceFacilities(place.id);
      if (details) {
        place.corkageAllowed = details.corkageInfo.allowed;
        place.corkageFee = details.corkageInfo.fee;
        place.facilities = details.facilities;

        if (details.corkageInfo.allowed) {
          corkageCount++;
          console.log(`  >>> [CORKAGE ALLOWED] Fee: ${details.corkageInfo.fee}. Facilities: ${JSON.stringify(details.facilities)}`);
        }
      } else {
        place.corkageAllowed = null;
        place.corkageFee = null;
        place.facilities = null;
      }

      // Throttling delay to prevent blocking (500ms to 800ms)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300));
    }

    console.log(`\nAll detail fetches finished.`);
    console.log(`Total restaurants found supporting corkage: ${corkageCount}`);

    // Save results
    const formattedLocation = location.replace(/\s+/g, '_');
    const formattedKeyword = keyword.replace(/\s+/g, '_');
    const filename = `results_${formattedLocation}_${formattedKeyword}.json`;
    const outputPath = path.join(__dirname, filename);

    fs.writeFileSync(outputPath, JSON.stringify(resultsArray, null, 2), 'utf-8');
    console.log(`Saved results to clickable link: [${filename}](file://${outputPath})`);

  } catch (error) {
    console.error("Crawl process failed:", error.message);
  }

  await browser.close();
}

main().catch(console.error);
