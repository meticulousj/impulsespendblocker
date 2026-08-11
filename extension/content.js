/* Impulse Spend Blocker — auto pop-up on shopping & checkout pages */
(() => {
  if (window.__isbInjected) return;
  window.__isbInjected = true;

  const APP_URL = "https://impulsespendblocker.lovable.app";
  const CHECKOUT_RE = /(checkout|\/cart|basket|payment|place-?order|buy-?now|order-summary)/i;

  const parsePrice = (text) => {
    if (!text) return null;
    const cleaned = String(text).replace(/[^\d.,]/g, "");
    if (!cleaned) return null;
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const normalized = lastComma > lastDot
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
    const n = parseFloat(normalized);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? (el.getAttribute("content") || el.textContent || "").trim() : "";
  };
  const pickAll = (sels) => {
    for (const s of sels) { const v = pick(s); if (v) return v; }
    return "";
  };

  function scrape() {
    const host = location.hostname;
    let title = "", priceText = "";

    if (/amazon\./.test(host)) {
      title = pickAll(["#productTitle", "#title"]);
      priceText = pickAll([".a-price .a-offscreen", "#priceblock_ourprice", "#corePrice_feature_div .a-offscreen", "#apex_desktop .a-offscreen", "#subtotals .a-color-price", ".grand-total-price"]);
    } else if (/etsy\./.test(host)) {
      title = pickAll(['h1[data-buy-box-listing-title]', "h1"]);
      priceText = pickAll(['p[data-selector="price-only"]', '[data-buy-box-region="price"] p', '[data-test-id="cart-total"]']);
    } else if (/ebay\./.test(host)) {
      title = pickAll(["h1.x-item-title__mainTitle span", "h1"]);
      priceText = pickAll([".x-price-primary span", ".x-bin-price__content span"]);
    } else if (/target\./.test(host)) {
      title = pickAll(['h1[data-test="product-title"]', "h1"]);
      priceText = pickAll(['[data-test="product-price"]', '[data-test="orderSummaryTotal"]']);
    } else if (/bestbuy\./.test(host)) {
      title = pickAll(['.sku-title h1', "h1"]);
      priceText = pickAll([".priceView-hero-price span", ".priceView-customer-price span", ".order-summary__total .cart-total"]);
    } else if (/walmart\./.test(host)) {
      title = pickAll(['h1[itemprop="name"]', "h1"]);
      priceText = pickAll(['span[itemprop="price"]', '[data-testid="price-wrap"] span', '[data-testid="line-item-subtotal"]']);
    }

    if (!title) title = pickAll(['meta[property="og:title"]', 'meta[name="twitter:title"]', "h1"]) || document.title;
    if (!priceText) {
      priceText = pickAll([
        'meta[property="product:price:amount"]', 'meta[property="og:price:amount"]',
        'meta[itemprop="price"]', '[itemprop="price"]',
        '[data-testid*="total" i]', '[class*="order-total" i]', '[class*="grand-total" i]',
        '[class*="subtotal" i]', ".price", ".product-price", ".product__price", ".money",
      ]);
    }
    return { title: (title || "").slice(0, 120), price: parsePrice(priceText) };
  }

  const isCheckout = () =>
    CHECKOUT_RE.test(location.href) ||
    !!document.querySelector('form[action*="checkout" i], [data-testid*="checkout" i], #checkout');

  function verdictFor(price, monthlyIncome) {
    if (!monthlyIncome) return null;
    const pct = (price / monthlyIncome) * 100;
    if (pct >= 25) return { v: "SKIP", pct };
    if (pct >= 5) return { v: "WAIT", pct };
    return { v: "BUY", pct };
  }

  const COLORS = { BUY: "#15803d", WAIT: "#b45309", SKIP: "#b91c1c" };

  function render({ title, price, settings, checkout }) {
    document.getElementById("isb-root")?.remove();
    const wage = Number(settings.hourlyWage) || 0;
    const income = Number(settings.monthlyIncome) || 0;
    const hours = wage > 0 ? price / wage : income > 0 ? price / (income / 160) : null;
    const res = verdictFor(price, income);

    const root = document.createElement("div");
    root.id = "isb-root";
    root.innerHTML = `
      <div class="isb-card" style="--isb-accent:${res ? COLORS[res.v] : "#15803d"}">
        <button class="isb-x" aria-label="Dismiss">×</button>
        <p class="isb-kicker">${checkout ? "Checkout detected" : "Before you buy"}</p>
        <p class="isb-title">${title.replace(/[<>]/g, "")}</p>
        <p class="isb-price">$${price.toFixed(2)}</p>
        ${hours ? `<p class="isb-time">≈ ${hours.toFixed(1)} hours of your work</p>` : ""}
        ${res ? `<p class="isb-verdict">${res.v}<span> · ${res.pct.toFixed(1)}% of monthly income</span></p>`
              : `<p class="isb-time">Add your income in the extension for an instant verdict.</p>`}
        <div class="isb-actions">
          <button class="isb-primary">Analyze in app</button>
          <button class="isb-ghost">Not now</button>
        </div>
      </div>`;
    document.documentElement.appendChild(root);

    const close = () => root.remove();
    root.querySelector(".isb-x").onclick = close;
    root.querySelector(".isb-ghost").onclick = () => {
      sessionStorage.setItem("isb-dismissed:" + location.pathname, "1");
      close();
    };
    root.querySelector(".isb-primary").onclick = () => {
      window.open(`${APP_URL}/?item=${encodeURIComponent(title)}&price=${price}&src=ext`, "_blank");
      close();
    };
  }

  async function maybeShow() {
    const settings = await chrome.storage.local.get(["autoCheck", "hourlyWage", "monthlyIncome", "minPrice"]);
    if (settings.autoCheck === false) return;
    if (sessionStorage.getItem("isb-dismissed:" + location.pathname)) return;
    const { title, price } = scrape();
    if (!price) return;
    const min = Number(settings.minPrice);
    if (Number.isFinite(min) && min > 0 && price < min) return;
    render({ title, price, settings, checkout: isCheckout() });
  }

  let last = location.href;
  const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(maybeShow, 900); }; })();

  setTimeout(maybeShow, 1200);
  new MutationObserver(() => {
    if (location.href !== last) {
      last = location.href;
      document.getElementById("isb-root")?.remove();
      debounced();
    }
  }).observe(document, { subtree: true, childList: true });

  chrome.runtime.onMessage?.addListener((msg) => {
    if (msg?.type === "isb-check") { document.getElementById("isb-root")?.remove(); maybeShow(); }
  });
})();
