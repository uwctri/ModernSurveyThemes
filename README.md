# Modern Survey Themes - REDCap External Module

**Modern Survey Themes** (`modern_survey_v1.0.0`) is a REDCap External Module designed to transform default public surveys into clean, responsive, and visually modern survey experiences.

By default, REDCap public surveys can look outdated and bland. While REDCap provides standard survey "themes", their customization is largely restricted to basic solid colors and blocky layouts. This External Module leverages the Survey Settings page, particularly **Custom CSS**, to deliver handcrafted, modern themes with rounded form cards, sleek field controls, and high-resolution, lightweight background images.

---

## Key Features

1. **Integrated Survey Settings Area**:
   - Seamlessly injects a dedicated **Modern Survey Themes** manager into REDCap's Survey Settings page (`Surveys/edit_info.php` and `Surveys/create_survey.php`).
   - Displays selectable visual cards with live color swatches, metadata tags, and descriptions.

2. **Handful of Handcrafted Modern Themes**:
   - **Modern Slate**: Clean & minimalist corporate indigo aesthetic with cool slate cards and micro-grid background. Perfect for general research and clinical trials.
   - **Nordic Teal**: Fresh, calming clinical healthcare aesthetic with flowing oceanic ambient waves and deep teal highlights.
   - **Warm Botanical**: Human-centered palette with organic topographic contour lines on warm ivory paper with forest sage green accents. Ideal for social sciences and psychology.
   - **Midnight Executive**: Sleek dark mode with obsidian glassmorphic card container, luminous violet and sapphire ambient glows, and high-contrast typography.
   - **Sunset Rose**: Inviting and energizing consumer aesthetic with radiant sunrise gradient background and warm coral highlights.
   - **Emerald Horizon**: Luxurious, balanced design with diamond micro-patterns, fresh mint background, and deep emerald green focus elements.

3. **Form Card with Rounded Corners**:
   - Rounds the outer `#container` (12px, 16px, 20px, or 28px).
   - Adds modern elevation drop shadows (`box-shadow: 0 10px 30px -5px rgba(0,0,0,0.08)`).
   - Replaces the default `#F3F3F3` grey table cells with seamless card surfaces.
   - Rounds input elements, textareas, selects, enhanced choice buttons, and navigation buttons.

4. **Full REDCap Field & Configuration Support**:
   - **Text inputs & Password fields**: Rounded corners (8px), subtle borders, modern focus ring glow.
   - **Notes & Textareas**: Optimized padding, clean line-height, rounded corners.
   - **Dropdowns & Auto-complete**: Styled select elements with smooth focus elevation.
   - **Enhanced Choices**: Pill/rounded buttons (10px), hover elevations, and solid active states.
   - **Standard Radios & Checkboxes**: Clean accent colors and typography.
   - **Matrix of Choices**: Alternating row tints, styled column headers, and floating matrix header support.
   - **Sliders (VAS)**: Custom rounded tracks with circular elevation thumb handles.
   - **File Upload & Signature**: Polished upload buttons and rounded canvas containers.
   - **Calculated Fields**: Clean read-only styling with subtle dashed borders.
   - **Section Headers**: Rounded left-accented pill banners replacing legacy table gradients.
   - **Survey Buttons**: Modern submit, next-page, previous-page, and save-and-return buttons.
   - **Return Corner & Survey Queue**: Rounded pill badges in the top-right corner.
   - **Mobile Responsiveness**: Dynamic stacking and full-width touch targets on screens $\le 768\text{px}$.

5. **Reasonable, Scalable Background Images**:
   - Each theme includes a custom, lightweight SVG background pattern (mesh gradients, fluid wave contours, topographic curves, micro-grids, and radiant glows).
   - Embedded directly into CSS as Base64-encoded data URIs:
     - 100% immune to PHP `strip_tags()` parsing.
     - Zero external network dependencies (works in offline or firewalled hospital environments).
     - Crisp and sharp on all retina and 4K displays.
   - Also supports solid tints or custom image URLs.

6. **The Pill Reminder Indicator**:
   - When a theme is selected, JavaScript automatically adjusts key survey display settings:
     - Enables **Enhanced Choices** (`#enhanced_choices = '1'`).
     - Configures optimal **Font Family** (`#font_family`).
     - Sets optimal **Survey Width** (`#survey_width_percent = '70'`).
     - Clears conflicting legacy REDCap theme colors (`#theme = ''`).
     - Populates **Custom CSS** (`#custom_css`).
   - A distinctive **Set by Theme** pill badge is immediately placed next to each of these settings so administrators know the theme has configured them.
   - If an administrator manually modifies any of those settings, the badge updates dynamically to reflect "User Adjusted".

7. **Live Interactive Preview**:
   - Injects the generated CSS directly into REDCap's native survey preview iframe (`#survey_theme_design`) so changes can be seen immediately.
   - Includes a **Live Interactive Preview** modal displaying sample questions, dropdowns, radios, checkboxes, matrix rows, and sliders.

---

## Directory Structure

```text
modern_survey_v1.0.0/
├── config.json                     # Module configuration and framework metadata
├── ModernSurvey.php                # Main External Module class handling REDCap hooks
├── survey_settings.js              # Client script for UI injection, pill reminders, and iframe preview
├── themes.json                     # Theme metadata (names, descriptions, swatches, default settings)
├── css/
│   ├── survey_settings.css         # Styles for theme cards, options, and pill reminders
│   ├── theme-modern-slate.css      # Modern Slate theme stylesheet
│   ├── theme-nordic-teal.css       # Nordic Teal theme stylesheet
│   ├── theme-warm-botanical.css    # Warm Botanical theme stylesheet
│   ├── theme-midnight-executive.css# Midnight Executive dark mode stylesheet
│   ├── theme-sunset-rose.css       # Sunset Rose theme stylesheet
│   └── theme-emerald-horizon.css   # Emerald Horizon theme stylesheet
└── README.md                       # Documentation and usage guide
```

---

## Installation & Usage

1. **Install Module**:
   Place the `modern_survey_v1.0.0` directory inside your REDCap installation's `modules/` folder.

2. **Enable Module**:
   - Go to **Control Center** > **External Modules** and enable **Modern Survey Themes**.
   - Enable the module in your target project.

3. **Apply a Theme**:
   - Open your project and click **Online Designer**.
   - Click **Survey Settings** for any instrument.
   - Scroll to the **Modern Survey Themes** section (located directly above Custom CSS).
   - Select your preferred theme card (e.g., *Nordic Teal*, *Modern Slate*, or *Midnight Executive*).
   - Optionally fine-tune the corner radius or background style.
   - Click **Apply Theme to Survey**.
   - Notice the **Set by Theme** pill badges placed next to Enhanced Choices, Font Family, Survey Width, and Custom CSS.
   - Scroll to the bottom and click **Save Changes**.
