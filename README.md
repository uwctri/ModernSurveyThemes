# Modern Survey Themes - REDCap External Module

**Modern Survey Themes** (`modern_survey_v1.0.0`) provides handcrafted, modern design themes for REDCap public surveys. It replaces REDCap's dated survey aesthetic with clean form cards, elevated shadows, rounded controls, refined typography, and lightweight vector background patterns.

Because themes are applied directly into REDCap's native **Custom CSS** field on the Survey Settings page, surveys render with **zero PHP or database overhead on survey load** and work seamlessly across desktop and mobile devices.

---

## Included Themes

| Theme | Aesthetic & Tone | Background Pattern |
| :--- | :--- | :--- |
| **Modern Slate** | Clean corporate indigo & cool slate | Micro-Grid Mesh |
| **Nordic Teal** | Calming clinical teal & oceanic waves | Fluid Contour Waves |
| **Warm Botanical** | Warm ivory paper & forest sage green | Topographic Curves |
| **Midnight Executive** | Dark mode with luminous violet & sapphire glows | Ambient Dark Glow |
| **Sunset Rose** | Friendly coral, peach & warm sunrise tones | Radiant Sunrise Glow |
| **Emerald Horizon** | Nature-inspired mint & deep emerald | Diamond Pattern Mesh |
| **Cobalt Precision** | High-clarity royal cobalt & cool ice-blue | Technical Coordinate Grid |
| **Lavender Mist** | Calming violet, soft lilac & gentle slate | Soft Concentric Ripples |
| **Terracotta Sand** | Grounded earthen amber & warm clay | Earthen Sand Stratum |
| **Carbon Minimalist** | Ultra-clean high-contrast monochrome | Architectural Dot Matrix |

---

## Key Features

- **Survey Settings Integration**: Visual theme picker embedded directly inside REDCap's Survey Settings page (`Surveys/edit_info.php`).
- **Interactive Live Preview**: Preview the survey card, typography, buttons, and form inputs live before saving.
- **Display Setting Badges**: Automatically configures Enhanced Choices, font family, survey width, and corner radius, showing informative "Set by Theme" indicator badges.
- **Custom Backgrounds & Blur**: Support for theme SVG patterns, solid fills, or custom image uploads with optional backdrop blur.
- **Fully Responsive**: Optimized touch targets, font scaling, and fluid layout on mobile screens ($\le 768\text{px}$).

---

## Installation & Usage

1. **Install**: Copy the `modern_survey_v1.0.0` folder to your REDCap `modules/` directory.
2. **Enable**: Enable **Modern Survey Themes** under **Control Center** > **External Modules**, then enable it in your project.
3. **Apply a Theme**:
   - Go to **Project Setup** > **Online Designer** > click **Survey Settings** for any instrument.
   - Choose a theme from the **Modern Survey Themes** section.
   - Optionally customize corner radius or background style.
   - Click **Apply Theme to Survey** and save changes at the bottom of the page.
