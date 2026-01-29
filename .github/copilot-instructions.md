# HL7 C-CDA Viewer - AI Coding Agent Guide

## Project Overview
This is a browser-based HL7 C-CDA (Clinical Document Architecture) document viewer. It renders complex medical documents in an interactive, responsive HTML layout where users can organize sections via drag-and-drop, collapse/expand content, and manage visibility. All preferences persist to localStorage.

## Architecture

### Document Processing Pipeline
1. **XML Input** → User pastes C-CDA XML or loads from file/GitHub
2. **XSLT Transformation** → [cda.xsl](cda.xsl) (extended ANSI/HL7 CDAR2 v3) transforms XML to structured HTML
3. **JavaScript Layout Engine** → [js/core.js](js/core.js) applies Packery grid layout + Draggabilly drag-and-drop
4. **Persistence** → All section state (visibility, order, collapse) saved to localStorage

### Key Components

| File | Purpose |
|------|---------|
| [index.htm](index.htm) | HTML shell with input areas and target divs (#inputcda, #viewcda, #cdabody) |
| [js/core.js](js/core.js) | Core logic: event handlers, state management, section manipulation, localStorage sync |
| [cda.xsl](cda.xsl) | XSLT 1.0 stylesheet transforming C-CDA XML → HTML with data-code attributes |
| [js/xslt/xslt.js](js/xslt/xslt.js) | Browser-based XSLT processor (handles IE11 via ActiveXObject) |
| [css/cda.css](css/cda.css) | Section styling, controls, layout |
| **External Libraries** | jQuery 1.12, Packery (masonry layout), Draggabilly (drag library), Font Awesome icons, Pure CSS |

## Critical Design Patterns

### Section Identity & State
Each rendered section has a unique **data-code attribute** linking it across the DOM:
- XSL generates: `<div class="section" data-code="PROCEDURES">`
- TOC maintains: `<li class="toc" data-code="PROCEDURES">`
- State is tracked via: `sectionorder[]`, `hidden[]`, `firstsection[]` arrays

All state syncs to localStorage with keys: `hidden`, `firstsection`, `collapseall`, `lastaccess`

### Duplicate Detection
Tables are scanned for duplicate rows (detected by XSL template logic):
- `tr.duplicate` = exact duplicates (hidden by default, show/hide toggle)
- `tr.duplicatefirst` = potential duplicates (user-controlled visibility)

### Packery Grid Management
The document uses **stamp positioning** (`.stamp` class fixes TOC position) and **Draggabilly bindings** for section reordering:
```javascript
cdabody.packery({stamp: '.stamp', columnWidth: 'div.section:not(.narr_table)', itemSelector: 'div.section'});
cdabody.packery('bindDraggabillyEvents', draggie);
```
Every drag updates `localStorage.firstsection` via `orderItems()`.

## Common Workflows

### Adding New UI Features
- Button/icon handlers attach to selector in [js/core.js](js/core.js) `$(document).ready()` or within `init()`
- Must call `$('#cdabody').packery()` after DOM changes to reflow layout
- To persist state: update one of `hidden[]`, `firstsection[]`, `sectionorder[]` and call `localStorage.setItem()`

### Modifying Document Section Rendering
- Edit [cda.xsl](cda.xsl) templates, NOT core.js
- Ensure output divs have `class="section" data-code="UNIQUECODE"` to integrate with state management
- Test with sample files in [samples/](samples/) directory

### Cross-Browser Compatibility
- [js/xslt/xslt.js](js/xslt/xslt.js) detects IE via `"ActiveXObject" in window` and uses native IE XSLT processor
- jQuery 1.12 (older version) used intentionally; newer versions not tested
- Test in Firefox, Chrome, Safari, and IE 11

## Local Development
- No build process required; serve files via HTTP (Chrome security) or open [index.htm](index.htm) directly in Firefox/Safari
- Use browser DevTools console to inspect `cdaxml` (current XML), `hidden`, `firstsection` arrays
- localStorage can be cleared via DevTools Application tab

## GitHub Integration
[js/core.js](js/core.js) includes GitHub API integration (lines 15-82) to browse repositories for C-CDA XML files—feature complete but not core to viewing.

## Avoid Common Mistakes
- Don't modify section HTML structure in core.js; XSL controls output
- Always include 3+ lines of context before/after code edits to avoid ambiguity
- Remember `moveup()` and `movedown()` update both DOM and `firstsection[]` array—must call together
- localStorage keys are strings; splitting/joining with commas for arrays (e.g., `hidden.split(',')`)
