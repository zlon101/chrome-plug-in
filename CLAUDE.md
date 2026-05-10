# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) targeting Chengdu housing/government websites. It provides:
- Page content injection and parsing (parse catalogs, search, highlight)
- Custom UI overlays via Vue.js (bundled as `vendor/vue.esm.brower.js`)
- Context menu integration (right-click selection to search)
- Multiple content scripts for different target domains

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `manifest.json` | Extension entry point (MV3) |
| `background/` | Service worker (context menus, tab messaging) |
| `popup/` | Extension popup UI and filter configuration |
| `options/` | Extension options page |
| `render-page/` | Content scripts injected into web pages |
| `render-page/normal/` | Generic page parsing (catalog, search) |
| `render-page/house-dep/` | Housing department site (`zw.cdzjryb.com`) |
| `render-page/talent-net/` | Talent network site (`cdzj.chengdu.gov.cn`) |
| `render-page/youtube-music/` | YouTube music related script |
| `util/` | Shared utilities (messaging, storage, helpers) |
| `vendor/` | Third-party libs (Vue, evalCore) |
| `images/` | Extension icons |

## Key Architecture Patterns

### Messaging (Popup ↔ Content Script)
- `util/msg.js`: bidirectional messaging between popup/extension and content scripts
- `sendToCtxJs()`: popup → content script (via `chrome.tabs.sendMessage`)
- `sendMsgToExtension()`: content script → extension (via `chrome.runtime.sendMessage`)
- `regMsgListener()`: register `chrome.runtime.onMessage` handler
- **Important**: `chrome.runtime.onMessage` callbacks must return `true` for async (see README note)

### Event Bus
- `render-page/event-bus.js`: local pub/sub for coordinating content scripts
- Two channels: `ContentJs` and `ExtendJs`

### Storage
- `util/storage.js`: two layers
  - `Storager`: wraps `sessionStorage` / `localStorage`
  - `ChromeStorage`: wraps `chrome.storage.local` (persistent across sessions)

### Script Injection
- `render-page/inject-script.js`: two modes
  - `injectContentJs()`: injects a function into a tab via `chrome.scripting.executeScript`
  - default export: injects a `<script>` tag into `document.head` (runs in page context)

### Content Script Modules
- Each subdirectory under `render-page/` is a self-contained module for a specific target site
- Entry points are referenced in `manifest.json` → `content_scripts`
- Modules use dynamic `import()` to load dependencies at runtime

## Development Notes

### No Build Step
This is a plain Chrome extension with no bundler or build tool. Load the project directory directly in Chrome via `chrome://extensions` → Load unpacked.

### Vue.js
- Uses bundled Vue 2 (`vendor/vue.esm.brower.js`), loaded dynamically via `import()`
- Vue templates in this project **cannot use template strings** (see README)

### Known Constraints (from README)
1. Vue templates cannot use template strings (`` `...` ``)
2. `chrome.runtime.onMessage.addListener` callbacks **must** call `sendResponse`

### Manifest V3
- Uses service worker (not persistent background page)
- `content_scripts` + `web_accessible_resources` pattern for injecting content
- Permissions: `activeTab`, `scripting`, `storage`, `tabs`, `contextMenus`

## Target Sites

| Site | Content Script | Purpose |
|------|---------------|---------|
| `zw.cdzjryb.com` | `render-page/house-dep/index.js` | Housing department listing/detail parsing |
| `cdzj.chengdu.gov.cn` | `render-page/talent-net/*.js` | Talent network site |
| All sites (`*://*/*`) | `render-page/normal/index.js` | Generic catalog parsing + search overlay |
