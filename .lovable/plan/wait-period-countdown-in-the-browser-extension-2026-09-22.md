# Wait-period countdown in the browser extension

## What will change
- Sync active WAIT purchases from the signed-in app into the installed extension whenever the app is opened.
- Match the current shopping product to a synced hold using its name and price.
- Replace the normal verdict card with an “On hold” state showing a live countdown and revisit date.
- Keep expired holds visible as “Ready to revisit,” with a link back to the saved decision.
- Update the downloadable extension package and installation notes.

## Technical details
- Add a small app-to-extension bridge using same-page browser messages; no login token or private financial data is copied into the extension.
- Add the published app to the extension manifest and store only decision ID, item, price, and ready time locally.
- Reuse the app’s existing smart-period calculation so app and extension countdowns agree.
- Use conservative title-token and price matching to avoid showing a hold on the wrong product.
- Verify the app UI in the browser and the extension behavior on a controlled product page.
