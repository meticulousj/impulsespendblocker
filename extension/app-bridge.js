/* Sync active holds from the signed-in web app without copying auth credentials. */
(() => {
  const SOURCE_ID = "isb-extension-holds";

  function syncHolds() {
    const source = document.getElementById(SOURCE_ID);
    if (!source?.textContent) return;

    try {
      const payload = JSON.parse(source.textContent);
      if (payload?.version !== 1 || !Array.isArray(payload.holds)) return;

      const holds = payload.holds
        .filter((hold) =>
          typeof hold?.id === "string" &&
          typeof hold?.item === "string" &&
          Number.isFinite(Number(hold?.price)) &&
          Number.isFinite(Number(hold?.readyAt)),
        )
        .map((hold) => ({
          id: hold.id,
          item: hold.item.slice(0, 120),
          price: Number(hold.price),
          readyAt: Number(hold.readyAt),
        }));

      chrome.storage.local.set({ syncedHolds: holds, holdsSyncedAt: Date.now() });
    } catch {
      // Ignore incomplete data while React is updating the sync element.
    }
  }

  syncHolds();
  new MutationObserver(syncHolds).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["data-updated-at"],
  });
})();