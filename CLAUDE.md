# CLAUDE.md - AI Assistant Guide

## Project Overview

This is a **Software Specification Document Creator** (ソフトウェア仕様書作成アプリ) - a Japanese-language web application for creating and managing software procurement specification documents. The application is a single-page application (SPA) built with vanilla JavaScript, requiring no build tools or backend server.

**Key Features:**
- Form-based specification document creation
- Automatic versioning (semantic versioning)
- Auto-save to browser LocalStorage
- Export to multiple formats (Markdown, PDF, Word)
- Dynamic task management
- Japanese language UI

**Tech Stack:**
- Vanilla JavaScript (ES6+ with classes)
- HTML5
- CSS3 with responsive design
- LocalStorage for persistence
- External CDN libraries: jsPDF, docx.js, FileSaver.js

---

## Codebase Structure

```
.
├── index.html              # Main HTML file (UI structure)
├── css/
│   └── style.css          # All application styles
├── js/
│   ├── app.js             # Core application logic & state management
│   └── export.js          # Export functionality (MD, PDF, DOCX)
├── README.md              # User-facing documentation (Japanese)
├── CLAUDE.md              # This file - AI assistant guide
└── .gitignore             # Standard Python .gitignore (legacy, not used)
```

**File Purposes:**

| File | Lines | Purpose | Key Classes/Functions |
|------|-------|---------|---------------------|
| `index.html` | 141 | Application structure, form fields, CDN imports | N/A |
| `css/style.css` | 264 | All styling, responsive design, print styles | N/A |
| `js/app.js` | 264 | State management, form handling, versioning | `SpecApp` class |
| `js/export.js` | 340 | Document export to MD/PDF/DOCX | `SpecExporter` class |

---

## Architecture & Design Patterns

### Application Architecture

**Pattern:** MVC-lite (Model-View-Controller inspired)
- **Model:** LocalStorage + `SpecApp.formData` object
- **View:** HTML form in `index.html`
- **Controller:** `SpecApp` class handles all interactions

**State Management:**
- Single source of truth: LocalStorage
- Three storage keys:
  - `specVersion` - semantic version (e.g., "1.0.0")
  - `specCreatedDate` - ISO date string (YYYY-MM-DD)
  - `specFormData` - JSON serialized form data

### Class Structure

#### `SpecApp` (app.js:2-257)
**Responsibilities:**
- Initialize application state
- Manage form data persistence
- Handle versioning
- Coordinate UI updates
- Manage dynamic task list

**Key Methods:**
```javascript
constructor()                    // Initialize from LocalStorage
init()                          // Setup event listeners, restore data
updateVersion()                 // Increment patch version
saveFormData()                  // Persist form to LocalStorage
restoreFormData()               // Load form from LocalStorage
collectFormData()               // Extract current form values
addTask(title, details)         // Add dynamic task item
debounce(func, wait)           // Throttle auto-save
```

#### `SpecExporter` (export.js:2-329)
**Responsibilities:**
- Export to Markdown format
- Generate PDF documents (jsPDF)
- Create Word documents (docx.js)
- Handle file downloads

**Key Methods:**
```javascript
exportMarkdown()                // Generate .md file
exportPDF()                     // Generate .pdf file (with pagination)
exportWord()                    // Generate .docx file
generateMarkdown(data)          // Create markdown string
formatDeadline(dateString)      // Format dates for Japanese locale
downloadFile(blob, filename)    // Trigger browser download
```

---

## Key Components & Logic

### 1. Version Management

**Location:** `app.js:22-52`

**Behavior:**
- Semantic versioning format: `MAJOR.MINOR.PATCH`
- Default initial version: `1.0.0`
- Increment operation: Only increments PATCH version
- Storage: Persisted to `localStorage.specVersion`
- User triggered via "バージョンを更新する" button

**Example:**
```javascript
// Current: 1.0.0
updateVersion() → 1.0.1
updateVersion() → 1.0.2
```

### 2. Auto-Save System

**Location:** `app.js:155-177`

**Behavior:**
- Triggers on form `change` events (immediate for checkboxes/radios)
- Triggers on `input` events with 1000ms debounce (for text fields)
- Serializes entire form to JSON
- Stores in `localStorage.specFormData`

**Debounce Pattern:**
```javascript
form.addEventListener('input', this.debounce(() => {
    this.saveFormData();
}, 1000));
```

### 3. Dynamic Task Management

**Location:** `app.js:179-228`

**Behavior:**
- Tasks are dynamic form sections
- Minimum 1 task always exists
- Delete button hidden when only 1 task
- Each task has: title (text input) + details (textarea)
- Tasks stored in array: `formData.tasks[]`

**DOM Structure per Task:**
```html
<div class="task-item">
  <input class="task-title">
  <textarea class="task-details">
  <button class="btn btn-danger remove-task">
</div>
```

### 4. Form Data Structure

**Location:** `app.js:88-113`

**Schema:**
```javascript
{
  // Basic Information
  subject: string,              // 件名
  background: string,           // 調達の背景
  purpose: string,              // 調達の目的
  deliverables: string,         // 納品物
  deliveryLocation: string,     // 納品場所
  deliveryDeadline: string,     // YYYY-MM-DD format

  // Procurement Information
  procurementType: string,      // "準委任" | "委任"
  procurementScope: string[],   // ["コンサルティング", "要件定義支援", ...]
  contractorRequirements: string,
  basicRequirements: string,

  // Dynamic Tasks
  tasks: [
    { title: string, details: string },
    ...
  ]
}
```

### 5. Export System

**Markdown Export (export.js:23-74):**
- Pure markdown generation
- Japanese date formatting
- Hierarchical heading structure
- File naming: `仕様書_{subject}_v{version}.md`

**PDF Export (export.js:77-159):**
- Uses jsPDF library
- ASCII-only limitation (Japanese displayed as-is, may have font issues)
- Auto-pagination at ~270mm y-position
- Margin: 20mm, Line height: 7mm
- File naming: `spec_{subject}_v{version}.pdf`

**Word Export (export.js:162-301):**
- Uses docx.js library
- Full Japanese support
- Proper heading levels (TITLE, HEADING_1, HEADING_2)
- Bulleted lists for scope items
- File naming: `仕様書_{subject}_v{version}.docx`

---

## Development Workflow

### Local Development Setup

**No build process required!** This is a static web application.

**Method 1: Direct File Opening**
```bash
# Simply open index.html in a browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

**Method 2: Local Server (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then visit: http://localhost:8000
```

**Why local server is better:**
- Proper MIME types for JavaScript modules
- Avoids CORS issues with LocalStorage
- More accurate testing environment

### Testing

**No automated tests exist.** Testing is currently manual.

**Manual Testing Checklist:**
1. Fill out all form fields
2. Add/remove tasks
3. Update version
4. Reload page (verify auto-save)
5. Export to all three formats
6. Verify Japanese characters in exports
7. Test on mobile viewport (responsive design)

### Making Changes

**When modifying `app.js`:**
- Maintain the class-based architecture
- Update debounce timing if auto-save feels laggy
- Preserve LocalStorage key names (breaking changes!)
- Test restoration from LocalStorage after changes

**When modifying `export.js`:**
- Test all three export formats after changes
- Verify Japanese character encoding
- Check PDF pagination with long content
- Ensure Word document structure remains valid

**When modifying `style.css`:**
- Test responsive breakpoints (768px)
- Verify print styles (`@media print`)
- Maintain Japanese font stack
- Check color contrast for accessibility

**When modifying `index.html`:**
- Maintain required field markers (`<span class="required">`)
- Preserve form field `id` and `name` attributes
- Keep CDN library versions stable
- Validate HTML structure

---

## Code Conventions

### JavaScript Style

**ES6+ Features Used:**
- Classes (constructor, methods)
- Arrow functions
- Template literals
- `const`/`let` (no `var`)
- Array methods (`.map()`, `.forEach()`, `.filter()`)
- Optional chaining (`?.`)
- Spread operator (not heavily used)

**Naming Conventions:**
```javascript
// Classes: PascalCase
class SpecApp {}
class SpecExporter {}

// Methods/functions: camelCase
updateVersion()
saveFormData()
generateMarkdown()

// DOM IDs: camelCase
document.getElementById('currentVersion')
document.getElementById('updateVersionBtn')

// CSS classes: kebab-case
.btn-primary
.form-section
.task-item
```

**Comment Style:**
```javascript
// Single-line comments for section headers
// 日本語コメントも使用可能

/*
 * Multi-line comments rare,
 * prefer single-line
 */
```

### HTML Conventions

**Form Structure:**
- Semantic HTML5 elements
- Required fields marked with `<span class="required">*</span>`
- Inputs grouped in `.form-group` divs
- Sections wrapped in `.form-section`

**Japanese Text:**
- All UI labels in Japanese
- Comments may be in Japanese
- Variable names in English

### CSS Conventions

**Organization:**
1. CSS reset
2. Base styles (body, container)
3. Component styles (buttons, forms)
4. Layout-specific styles
5. Media queries (responsive)
6. Print styles

**Color Palette:**
```css
Primary Blue: #0066cc
Dark Blue: #0052a3
Gray: #6c757d
Success Green: #28a745
Danger Red: #dc3545
Background: #f5f5f5
Border: #e0e0e0
```

**Responsive Breakpoint:**
```css
@media (max-width: 768px) { /* Mobile styles */ }
```

---

## Data Persistence & Storage

### LocalStorage Strategy

**Keys Used:**
```javascript
'specVersion'      // String: "1.0.0"
'specCreatedDate'  // String: "2025-01-15" (ISO date)
'specFormData'     // String: JSON serialized form data
```

**Storage Timing:**
- Version: On update button click
- Created date: On first load only
- Form data: On change (immediate) + input (1s debounce)

**Data Migration:**
None currently implemented. Breaking changes to schema will lose user data!

**Backup Strategy:**
Users should export regularly. No cloud backup or sync.

### Browser Compatibility

**LocalStorage Support:**
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum IE 8+ (not tested, likely broken due to ES6)

**Storage Limits:**
- Typically 5-10MB per domain
- This app uses ~5-50KB typically (text data only)

**Private/Incognito Mode:**
- LocalStorage available but cleared on browser close
- Warn users to export before closing

---

## Common Development Tasks

### Adding a New Form Field

1. **Add to HTML** (index.html):
```html
<div class="form-group">
    <label for="newField">新しいフィールド <span class="required">*</span></label>
    <input type="text" id="newField" name="newField" required>
</div>
```

2. **Update Data Collection** (app.js:88):
```javascript
collectFormData() {
    const data = {
        // ... existing fields
        newField: document.getElementById('newField').value,
    };
}
```

3. **Update Data Restoration** (app.js:115):
```javascript
restoreFormData() {
    // ... existing restorations
    document.getElementById('newField').value = data.newField || '';
}
```

4. **Update Exports** (export.js):
```javascript
// Markdown
md += `### 新しいフィールド\n\n${data.newField || '（未入力）'}\n\n`;

// PDF
addSection('■ 新しいフィールド', data.newField);

// Word
addSection('新しいフィールド', data.newField);
```

### Adding a New Export Format

1. **Add button to HTML**:
```html
<button id="exportCustomBtn" class="btn btn-secondary">Custom形式でエクスポート</button>
```

2. **Create export method in `SpecExporter`**:
```javascript
exportCustom() {
    const data = this.app.getFormData();
    // Generate custom format
    const content = this.generateCustomFormat(data);
    const blob = new Blob([content], { type: 'text/plain' });
    this.downloadFile(blob, `spec_v${this.app.version}.custom`);
}
```

3. **Add event listener** (export.js:8):
```javascript
setupExportListeners() {
    // ... existing listeners
    document.getElementById('exportCustomBtn').addEventListener('click', () => {
        this.exportCustom();
    });
}
```

### Modifying Version Increment Behavior

**Current:** Only PATCH increments (app.js:39)
```javascript
const newVersion = `${major}.${minor}.${patch + 1}`;
```

**To add MAJOR/MINOR options:**
```javascript
updateVersion(type = 'patch') {
    const parts = this.version.split('.');
    let [major, minor, patch] = parts.map(Number);

    switch(type) {
        case 'major': major++; minor=0; patch=0; break;
        case 'minor': minor++; patch=0; break;
        case 'patch': patch++; break;
    }

    const newVersion = `${major}.${minor}.${patch}`;
    // ...
}
```

Then add buttons for each type.

---

## Dependencies & External Libraries

### CDN Libraries (index.html:132-134)

**jsPDF v2.5.1**
- **Purpose:** PDF generation
- **CDN:** `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- **Usage:** `export.js:77-159`
- **Limitations:** Poor Japanese font support (basic text only)
- **Documentation:** https://github.com/parallax/jsPDF

**docx.js v8.5.0**
- **Purpose:** Microsoft Word .docx generation
- **CDN:** `https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.min.js`
- **Usage:** `export.js:162-301`
- **Features:** Full Japanese support, proper document structure
- **Documentation:** https://docx.js.org/

**FileSaver.js v2.0.5**
- **Purpose:** Cross-browser file download handling
- **CDN:** `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js`
- **Usage:** Indirect (docx.js uses it internally)
- **Documentation:** https://github.com/eligrey/FileSaver.js/

**Dependency Management:**
- No package.json (not needed)
- CDN versions pinned for stability
- Offline development: Download libraries locally
- Update strategy: Manual version bumps (test thoroughly!)

**Browser API Dependencies:**
- LocalStorage API
- Blob API
- URL.createObjectURL
- Date API (Japanese formatting)
- DOM API (ES6 querySelector, classList, etc.)

---

## For AI Assistants: Special Guidance

### Understanding User Intent

**This is a business application for procurement documents.**
- Users are likely project managers or procurement specialists
- Japanese business context (formal language)
- Accuracy and data persistence are critical
- Export formats must be professional

### Common User Requests & How to Handle

**"Add a new field"**
→ Follow "Adding a New Form Field" section above
→ Ask: What type (text, textarea, select, radio, checkbox)?
→ Ask: Is it required? Where should it appear?

**"Fix export formatting"**
→ Check which format (MD/PDF/Word)
→ PDF has font limitations (warn about Japanese)
→ Word is best for Japanese documents

**"Data is lost"**
→ LocalStorage cleared by user/browser
→ Explain: No cloud backup, must export regularly
→ Cannot recover lost data

**"Add feature X"**
→ Confirm it aligns with spec document purpose
→ Check if it affects data schema (migration needed?)
→ Prefer additive changes over breaking changes

### Code Modification Guidelines

**DO:**
- Preserve existing LocalStorage keys and format
- Maintain backward compatibility with saved data
- Test all three export formats after changes
- Keep the class-based architecture
- Add comments for complex logic
- Use Japanese labels for UI elements

**DON'T:**
- Break existing LocalStorage schema without migration
- Add build tools (keep it simple!)
- Remove auto-save functionality
- Change semantic versioning to other formats
- Add dependencies without CDN availability
- Use frameworks (React, Vue) - this is intentionally vanilla

### Testing Strategy for AI Assistants

**After making changes, suggest this test:**
```
1. Fill form with Japanese text
2. Click "バージョンを更新する" → Check version increments
3. Reload page → Verify data persists
4. Add 3 tasks → Verify delete button shows
5. Delete task → Verify save works
6. Export MD → Check Japanese encoding
7. Export PDF → Check pagination
8. Export Word → Check formatting
9. Clear LocalStorage → Verify clean start
10. Test on mobile width (< 768px)
```

### When to Suggest Refactoring

**Appropriate times:**
- Adding >3 related fields (suggest a new section)
- Export methods exceed 100 lines (extract helpers)
- Duplicate code appears (DRY principle)
- Performance issues with large documents

**Inappropriate times:**
- "Just because" refactoring
- Switching to TypeScript (out of scope)
- Adding a framework (goes against project philosophy)
- Over-engineering simple features

### Handling Ambiguity

**If user asks for unclear features:**
1. Ask clarifying questions about business requirements
2. Suggest simple solution first, complex as alternative
3. Show examples of how it would look in the UI
4. Consider export impact (will it export well?)

**Example:**
User: "Add file upload"
You ask:
- What file types? (Images? Documents?)
- Display in form or just attach to export?
- Storage: LocalStorage (limited) or reference only?
- Should it appear in PDF/Word exports?

### Performance Considerations

**Current Performance Profile:**
- No significant bottlenecks in current implementation
- LocalStorage operations are synchronous (negligible time)
- Export generation: 100ms - 2s depending on format & size
- DOM operations: Minimal reflows

**Watch out for:**
- >100 tasks (DOM performance degrades)
- Very long text fields (>10,000 chars in PDF export)
- Rapid version updates (unnecessary LocalStorage writes)

**Optimization opportunities:**
- Debounce is 1000ms (could be tuned)
- PDF uses basic text wrapping (could improve)
- No virtualization for task list (add if >50 tasks)

---

## Quick Reference

### Important File Locations

| What | Where |
|------|-------|
| Version increment logic | `app.js:33-48` |
| Auto-save logic | `app.js:78-81, 167-177` |
| Form data schema | `app.js:88-113` |
| Task add/remove | `app.js:179-228` |
| Markdown export | `export.js:23-74` |
| PDF export | `export.js:77-159` |
| Word export | `export.js:162-301` |
| LocalStorage keys | `app.js:24, 56, 84` |
| CSS color palette | `style.css:83-117` |
| Responsive breakpoint | `style.css:222` |

### Key DOM Selectors

```javascript
// Buttons
'#updateVersionBtn'    // Version update
'#exportMarkdownBtn'   // Export Markdown
'#exportPdfBtn'        // Export PDF
'#exportWordBtn'       // Export Word
'#addTaskBtn'          // Add task

// Display elements
'#currentVersion'      // Version display
'#createdDate'         // Date display

// Form fields (basic info)
'#subject'             // 件名
'#background'          // 調達の背景
'#purpose'             // 調達の目的
'#deliverables'        // 納品物
'#deliveryLocation'    // 納品場所
'#deliveryDeadline'    // 納品期限

// Form fields (procurement)
'input[name="procurementType"]'    // Radio: 準委任/委任
'input[name="procurementScope"]'   // Checkboxes: scope
'#contractorRequirements'
'#basicRequirements'

// Task containers
'#tasksContainer'      // Task list container
'.task-item'           // Individual task
'.task-title'          // Task title input
'.task-details'        // Task details textarea
'.remove-task'         // Task remove button
```

### Common Debugging Scenarios

**Problem: Data not saving**
- Check console for LocalStorage errors
- Verify browser isn't in private mode
- Check if LocalStorage quota exceeded
- Confirm event listeners attached

**Problem: Export fails**
- Check CDN library loaded (network tab)
- Verify data structure matches export expectations
- Check for special characters breaking format
- Test with minimal data first

**Problem: Version not updating**
- Check LocalStorage for `specVersion` key
- Verify button click event fires
- Check for JavaScript errors in console
- Confirm alert shows (indicates success)

**Problem: Page refresh loses data**
- LocalStorage cleared manually?
- Browser setting blocking storage?
- Check Application tab in DevTools
- Verify JSON.parse doesn't fail

---

## Changelog & Version History

**v1.0.0 (Initial Release)**
- Commit: `477b893` - "ソフトウェア仕様書作成Webアプリケーションを実装"
- Date: Per git history
- Features: Full spec document creation, versioning, exports

**Current Development Branch:**
- `claude/claude-md-mi4cysys6g824gqn-01DhDv5xTVYJzmc1hUYnEnUh`

**Git Workflow:**
- Main branch: (not specified, likely `main` or `master`)
- Feature branches: `claude/` prefix
- PR merged: #1 (initial implementation)

---

## License & Attribution

**License:** MIT License (per README.md:108)

**Author/Maintainer:** Not specified in codebase

**Third-party Credits:**
- jsPDF - MIT License
- docx.js - MIT License
- FileSaver.js - MIT License

---

## Contact & Support

**For Users:** See README.md (Japanese documentation)

**For Developers/AI Assistants:** This document (CLAUDE.md)

**Repository:** GitHub (inferred from git history)

---

*Last Updated: 2025-01-18*
*Document Version: 1.0.0*
*For Claude Code AI Assistant Usage*
