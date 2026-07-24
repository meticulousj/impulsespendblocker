const APP_URL = "https://impulsespendblocker.lovable.app";

const itemInput = document.getElementById("item");
const priceInput = document.getElementById("price");
const detected = document.getElementById("detected");
const analyzeBtn = document.getElementById("analyze");

function parsePrice(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  // Handle "1,299.99" vs "1.299,99"
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Runs inside the tab. Must be a self-contained function.
function scrapeProduct() {
  const host = location.hostname;
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? (el.getAttribute("content") || el.textContent || "").trim() : "";
  };
  const pickAll = (sels) => {
    for (const s of sels) {
      const v = pick(s);
      if (v) return v;
    }
    return "";
  };

  let title = "";
  let priceText = "";

  if (/amazon\./.test(host)) {
    title = pickAll(["#productTitle", "#title"]);
    priceText = pickAll([
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#priceblock_saleprice",
      "#corePrice_feature_div .a-offscreen",
      "#apex_desktop .a-offscreen",
    ]);
  } else if (/etsy\./.test(host)) {
    title = pickAll(['h1[data-buy-box-listing-title]', "h1"]);
    priceText = pickAll(['p[data-selector="price-only"]', '[data-buy-box-region="price"] p']);
  } else if (/ebay\./.test(host)) {
    title = pickAll(["h1.x-item-title__mainTitle span", "h1"]);
    priceText = pickAll([".x-price-primary span", ".x-bin-price__content span"]);
  } else if (/target\./.test(host)) {
    title = pickAll(['h1[data-test="product-title"]', "h1"]);
    priceText = pickAll(['[data-test="product-price"]', 'span[data-test="product-price"]']);
  } else if (/bestbuy\./.test(host)) {
    title = pickAll(['.sku-title h1', "h1"]);
    priceText = pickAll([".priceView-hero-price span", ".priceView-customer-price span"]);
  } else if (/walmart\./.test(host)) {
    title = pickAll(['h1[itemprop="name"]', "h1"]);
    priceText = pickAll(['span[itemprop="price"]', '[data-testid="price-wrap"] span']);
  }

  // Generic fallbacks (Shopify + most e-commerce use these)
  if (!title) {
    title = pickAll([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      "h1",
    ]) || document.title;
  }
  if (!priceText) {
    priceText = pickAll([
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[itemprop="price"]',
      '[itemprop="price"]',
      ".price",
      ".product-price",
      ".product__price",
      ".money",
    ]);
  }

  return { title: (title || "").slice(0, 200), priceText };
}

async function run() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/i.test(tab.url || "")) {
      detected.textContent = "Open a product page to scan a price.";
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeProduct,
    });
    const data = results?.[0]?.result || { title: "", priceText: "" };
    const price = parsePrice(data.priceText);

    if (data.title) itemInput.value = data.title;
    if (price != null) priceInput.value = price.toFixed(2);

    if (price != null || data.title) {
      detected.className = "detected ok";
      detected.textContent = price != null
        ? `Detected: $${price.toFixed(2)}`
        : "Detected item — enter the price to continue.";
    } else {
      detected.textContent = "Couldn't auto-detect. Enter the item and price manually.";
    }
  } catch (err) {
    detected.textContent = "Couldn't read this page. Enter the item and price manually.";
  }
}

analyzeBtn.addEventListener("click", () => {
  const item = itemInput.value.trim();
  const price = parsePrice(priceInput.value);
  if (!item || price == null) {
    detected.textContent = "Add an item name and price first.";
    return;
  }
  const url = `${APP_URL}/?item=${encodeURIComponent(item)}&price=${price}&src=ext`;
  chrome.tabs.create({ url });
});

run();