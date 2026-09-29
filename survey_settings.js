$(() => {
  const module = ExternalModules.UWMadison.ModernSurvey
  const themes = module.themes

  if (!$('#custom_css').length) return

  let activeThemeId = null
  let selectedThemeId = null

  const syncNativeIframeVisibility = () => {
    let isModernSelected = !!(activeThemeId || selectedThemeId)
    $('body').toggleClass('ms-theme-active', isModernSelected)
    if (isModernSelected) {
      $('#survey_theme_design').closest('tr').hide()
    } else {
      $('#survey_theme_design').closest('tr').show()
    }
  }

  const syncReqPosVisibility = () => {
    let isNone = $('#ms_req_style').val() === 'none'
    $('#ms_req_pos').closest('.ms-option-group').toggle(!isNone)
  }

  const escapeHtml = (str) => {
    if (!str) return ''
    return $('<div>').text(str).html()
  }

  const statusBadgeTemplate = (activeTheme) => {
    if (activeTheme) return `<div class="ms-status-badge active"><span class="status-dot"></span> Active: ${escapeHtml(activeTheme.name)}</div>`
    return '<div class="ms-status-badge"><span class="status-dot"></span> No Modern Theme Active</div>'
  }

  const swatchesTemplate = (colors) => `
	  <div class="ms-card-swatches">
		<div class="swatch" style="background:${colors.primary};" title="Primary Accent: ${colors.primary}"></div>
		<div class="swatch" style="background:${colors.bg};" title="Page Background: ${colors.bg}"></div>
		<div class="swatch" style="background:${colors.card_bg};" title="Card Surface: ${colors.card_bg}"></div>
		<div class="swatch" style="background:${colors.section_bg};" title="Section Banner: ${colors.section_bg}"></div>
	  </div>`

  const themeCardTemplate = (id, theme, isSelected, isActive) => {
    let buttonLabel = 'Select Theme'
    if (isSelected && isActive) buttonLabel = '✓ Currently Active'
    else if (isSelected) buttonLabel = '✓ Selected'

    return `
		<div class="ms-card ${isSelected ? 'selected' : ''}" data-theme-id="${id}">
		  ${swatchesTemplate(theme.colors)}
		  <div class="ms-card-content">
			<div class="ms-card-header">
			  <h4 class="ms-card-title">${escapeHtml(theme.name)}</h4>
			  <span class="ms-card-category">${escapeHtml(theme.category)}</span>
			</div>
			<p class="ms-card-desc">${escapeHtml(theme.description)}</p>
			<div class="ms-card-meta">
			  <span class="ms-tag"><i class="fas fa-palette"></i> ${escapeHtml(theme.tagline || 'Theme Palette')}</span>
			  <span class="ms-tag"><i class="fas fa-shapes"></i> ${theme.radius} Corners</span>
			  <span class="ms-tag"><i class="far fa-image"></i> ${escapeHtml(theme.bg_name)}</span>
			</div>
		  </div>
		  <button type="button" class="ms-card-btn">${buttonLabel}</button>
		</div>`
  }

  const modernSurveyContainerTemplate = (statusBadgeHtml, cardsHtml) => `
	<tr id="modern_survey_tr">
	  <td colspan="3" style="padding: 10px 0;">
		<div id="modern_survey_container">
		  <div class="ms-header">
			<div class="ms-header-title">
			  <div class="ms-header-icon"><i class="fas fa-layer-group"></i></div>
			  <div class="ms-header-text">
				<h3>Modern Survey Themes</h3>
				<p>Select a modern responsive theme with rounded card containers, sleek field controls, and subtle background styling.</p>
			  </div>
			</div>
			<div id="ms_status_wrapper">${statusBadgeHtml}</div>
		  </div>
		  <div class="ms-carousel-wrapper">
			<button type="button" class="ms-bumper-btn ms-bumper-left" id="ms_bumper_prev" aria-label="Previous Themes" title="Scroll Left">
			  <i class="fas fa-chevron-left"></i>
			</button>
			<div class="ms-cards-scroll-container" id="ms_cards_scroll">
			  <div class="ms-cards-track">
				${cardsHtml}
			  </div>
			</div>
			<button type="button" class="ms-bumper-btn ms-bumper-right" id="ms_bumper_next" aria-label="Next Themes" title="Scroll Right">
			  <i class="fas fa-chevron-right"></i>
			</button>
		  </div>
		  <div class="ms-options-bar">
			<div class="ms-option-group">
			  <label for="ms_corner_radius"><svg class="ms-icon-corner" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-1px; margin-right:3px;"><path d="M3 13V6a3 3 0 0 1 3-3h7"/></svg>Corner Rounding:</label>
			  <select id="ms_corner_radius" class="ms-select">
				<option value="12px">Subtle (12px)</option>
				<option value="14px">Compact (14px)</option>
				<option value="16px" selected>Modern (16px - Recommended)</option>
				<option value="18px">Smooth (18px)</option>
				<option value="20px">Extra Rounded (20px)</option>
				<option value="26px">Smooth Pill (26px)</option>
			  </select>
			</div>
			<div class="ms-option-group">
			  <label for="ms_bg_style"><i class="fas fa-paint-roller"></i> Background Style:</label>
			  <select id="ms_bg_style" class="ms-select">
				<option value="default" selected>Theme Pattern (Artwork)</option>
				<option value="mesh_aurora">Aurora Gradient (Vibrant Color Flow)</option>
				<option value="soft_wash">Soft Pastel Wash (Gentle Duo-tone)</option>
				<option value="sunset_glow">Warm Sunset Glow (Radial Bloom)</option>
				<option value="emerald_breeze">Emerald &amp; Sky Breeze (Fresh Linear)</option>
				<option value="slate_grid">Slate Micro-Grid (Geometric Tech)</option>
				<option value="dark_glow">Obsidian Deep Glow (Atmospheric)</option>
				<option value="solid">Subtle Solid Tint (No Pattern)</option>
				<option value="custom">Custom Image Upload / URL...</option>
			  </select>
			</div>
			<div class="ms-option-group">
			  <label for="ms_req_style"><i class="fas fa-asterisk"></i> Required Marker:</label>
			  <select id="ms_req_style" class="ms-select">
				<option value="asterisk" selected>Red Asterisk (*)</option>
				<option value="pill">Badge Pill (Required)</option>
				<option value="dot">Red Dot Indicator (•)</option>
				<option value="classic">Classic Text (* must provide value)</option>
				<option value="none">Don't Show</option>
			  </select>
			</div>
			<div class="ms-option-group">
			  <label for="ms_req_pos"><i class="fas fa-arrows-alt-h"></i> Position:</label>
			  <select id="ms_req_pos" class="ms-select">
				<option value="right" selected>Right of Question (Default)</option>
				<option value="left">Left of Question (Before Text)</option>
			  </select>
			</div>
			<div class="ms-option-group">
			  <label for="ms_autocomplete_min"><i class="fas fa-search"></i> Autocomplete Dropdowns:</label>
			  <select id="ms_autocomplete_min" class="ms-select">
				<option value="5" selected>≥5 options</option>
				<option value="10">≥10 options</option>
				<option value="always">Always (All Dropdowns)</option>
				<option value="never">Never (Standard Behavior)</option>
			  </select>
			</div>
			<div class="ms-option-group" id="ms_custom_bg_group" style="display:none; flex-wrap: wrap; gap: 8px;">
			  <input type="file" id="ms_bg_file_input" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;">
			  <button type="button" class="ms-btn-upload" id="ms_btn_upload_bg" ${module && module.fileRepoEnabled ? '' : 'disabled style="opacity:0.6; cursor:not-allowed;" title="File Repository is not enabled in REDCap. Enable it in REDCap to upload images."'} >
				<i class="fas fa-cloud-upload-alt"></i> Upload to File Repo...
			  </button>
			  ${module && module.fileRepoEnabled ? '' : '<span style="color:#b45309; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-exclamation-triangle"></i> File Repository disabled (Uploads unavailable)</span>'}
			  <span id="ms_bg_upload_status" class="ms-upload-status" style="display:none;"></span>
			  <input type="text" id="ms_custom_bg_url" class="ms-input-text" placeholder="Or enter image URL..." style="width: 190px;">
			  <label for="ms_bg_blur" style="margin-left: 4px;"><i class="fas fa-tint"></i> Blur:</label>
			  <select id="ms_bg_blur" class="ms-select">
				<option value="0px">None (0px - Sharp)</option>
				<option value="4px">Subtle (4px)</option>
				<option value="8px" selected>Medium (8px - Recommended)</option>
				<option value="14px">Soft Focus (14px)</option>
				<option value="20px">Heavy (20px)</option>
				<option value="30px">Dreamy (30px)</option>
			  </select>
			</div>
		  </div>
		  <div class="ms-actions-row">
			<div class="ms-actions-left">
			  <button type="button" id="ms_btn_apply" class="ms-btn-apply">
				<i class="fas fa-check"></i> Apply Theme to Survey
			  </button>
			  <button type="button" id="ms_btn_preview" class="ms-btn-preview">
				<i class="fas fa-eye"></i> Live Interactive Preview
			  </button>
			</div>
			<div>
			  <button type="button" id="ms_btn_clear" class="ms-btn-clear">
				<i class="fas fa-undo"></i> Clear / Revert Theme
			  </button>
			</div>
		  </div>
		  <div class="ms-info-hint">
			<i class="fas fa-info-circle"></i>
			<span><strong>Theme Automation:</strong> When applied, Modern Themes automatically set optimal display options (enhanced radio/checkbox buttons, typography, width, and custom CSS). Look for the <strong>Set by Theme</strong> pill reminder next to managed settings.</span>
		  </div>
		</div>
	  </td>
	</tr>`

  const pillReminderTemplate = (settingKey, tooltip) => `
	<span class="ms-pill-reminder" data-setting="${settingKey}" title="${escapeHtml(tooltip)}">
	  <i class="fas fa-check-circle"></i>
	  <span class="pill-label">Set by Theme</span>
	</span>`

  const previewModalContainerTemplate = () => `
	<div id="ms_preview_modal_container" style="width: 100%; height: 560px; padding: 0; margin: 0; overflow: hidden; background: #ffffff;">
	  <iframe id="ms_preview_modal_iframe" style="width: 100%; height: 100%; border: none; display: block;" frameborder="0"></iframe>
	</div>`

  const previewModalDocumentTemplate = (theme, css, linkTags) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(theme.name)} Preview</title>
  <base href="${escapeHtml(window.location.origin + window.location.pathname)}">
  ${linkTags || ''}
  <style>
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  min-height: 100% !important;
  background-color: var(--ms-bg-page, #ffffff);
  font-family: var(--ms-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif);
}
#pagecontainer {
  max-width: 740px !important;
  margin: 20px auto !important;
  padding: 10px 16px !important;
  box-sizing: border-box !important;
}
#footer {
  text-align: center !important;
  width: 100% !important;
  margin: 0 auto !important;
  padding: 18px 0 10px !important;
  display: block !important;
}

/* Enhanced Choice container & non-overlapping layout */
.enhancedchoice_wrapper {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  width: 100% !important;
  max-width: 380px !important;
  margin-top: 4px !important;
}
div.enhancedchoice {
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
div.enhancedchoice label {
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 10px 16px !important;
  border-radius: var(--ms-radius, 16px) !important;
  cursor: pointer !important;
  line-height: 1.4 !important;
}
div.enhancedchoice label span.ec {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
}

/* Crisp self-contained section header icons */
.ms-sec-icon {
  display: inline-block !important;
  vertical-align: -2.5px !important;
  margin-right: 8px !important;
  flex-shrink: 0 !important;
}

${css}
  </style>
</head>
<body>
  <div id="pagecontainer">
    <div id="container">
      <div id="surveytitlelogo">
        <div id="surveytitle">${escapeHtml(theme.name)} — Theme Preview</div>
      </div>
      <div id="surveyinstructions">
        <p>This live preview showcases rounded corners, input styling, enhanced choices, matrix rows, and sliders in the <strong>${escapeHtml(theme.name)}</strong> theme.</p>
      </div>
      <table id="questiontable" cellpadding="0" cellspacing="0">
        <tbody>
          <tr class="header">
            <td colspan="2" class="header">
              <svg class="ms-sec-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Section 1: Standard &amp; Enhanced Fields</span>
            </td>
          </tr>
          <tr>
            <td class="labelrc" style="width: 45%;"><span class="questionnum">1</span> <div data-kind="field-label" style="display:inline-flex; align-items:baseline; gap:4px;"><span>Participant Full Name</span> <div class="requiredlabel" aria-label="Required field">* must provide value</div></div></td>
            <td class="data"><input type="text" value="Jane Doe" style="width: 85%;"></td>
          </tr>
          <tr>
            <td class="labelrc"><span class="questionnum">2</span> Preferred Contact Method (Enhanced Choices)</td>
            <td class="data">
              <div class="enhancedchoice_wrapper">
                <div class="enhancedchoice">
                  <label class="selectedradio">
                    <span class="ec">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:-1px; margin-right:5px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      Email
                    </span>
                  </label>
                </div>
                <div class="enhancedchoice"><label><span class="ec">Phone Call</span></label></div>
                <div class="enhancedchoice"><label><span class="ec">SMS Text</span></label></div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="labelrc"><span class="questionnum">3</span> Primary Study Department</td>
            <td class="data">
              <select style="width: 85%;">
                <option>General Medicine & Oncology</option>
                <option>Cardiovascular Research</option>
                <option>Population Health</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="labelrc"><span class="questionnum">4</span> Research Notes & Comments</td>
            <td class="data"><textarea style="width: 90%; height: 60px;">Modern, clean notes input with subtle rounded corners and focus elevation.</textarea></td>
          </tr>
          <tr class="header">
            <td colspan="2" class="header">
              <svg class="ms-sec-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span>Section 2: Matrix &amp; Visual Analog Scale</span>
            </td>
          </tr>
          <tr>
            <td class="labelrc"><span class="questionnum">5</span> Satisfaction Rating (0 - 100)</td>
            <td class="data" style="padding-top:20px; padding-bottom:20px;">
              <div class="slider ui-widget-content" style="position:relative; width: 85%;">
                <div class="ui-state-default" style="position:absolute; left: 75%;"></div>
              </div>
              <div class="sliderlabels" style="display:flex; justify-content:space-between; width:85%; margin-top:10px;">
                <span>Poor (0)</span><span>Neutral (50)</span><span>Excellent (100)</span>
              </div>
            </td>
          </tr>
          <tr class="surveysubmit">
            <td colspan="2">
              <button type="button" name="submit-btn-saveprevpage" style="margin-right:10px;">Previous Page</button>
              <button type="button" name="submit-btn-saverecord">Submit Response</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div id="footer">Powered by REDCap & Modern Survey Themes</div>
    </div>
  </div>
</body>
</html>`

  const toastTemplate = (msg) => `<div class="ms-toast"><i class="fas fa-check-circle"></i> ${escapeHtml(msg)}</div>`

  const bgPresets = {
    mesh_aurora: 'background-image: radial-gradient(at 10% 10%, rgba(99, 102, 241, 0.18) 0px, transparent 50%), radial-gradient(at 90% 15%, rgba(236, 72, 153, 0.18) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(14, 165, 233, 0.18) 0px, transparent 50%) !important; background-attachment: fixed !important; background-size: cover !important;',
    soft_wash: 'background-image: linear-gradient(135deg, rgba(241, 245, 249, 0.8) 0%, rgba(224, 231, 255, 0.5) 50%, rgba(243, 232, 255, 0.6) 100%) !important; background-attachment: fixed !important; background-size: cover !important;',
    sunset_glow: 'background-image: radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.18) 0%, transparent 45%), radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.16) 0%, transparent 50%) !important; background-attachment: fixed !important; background-size: cover !important;',
    emerald_breeze: 'background-image: linear-gradient(120deg, rgba(167, 243, 208, 0.35) 0%, rgba(186, 230, 253, 0.35) 100%) !important; background-attachment: fixed !important; background-size: cover !important;',
    slate_grid: 'background-image: linear-gradient(to right, rgba(100, 116, 139, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(100, 116, 139, 0.08) 1px, transparent 1px) !important; background-size: 24px 24px !important; background-attachment: fixed !important;',
    dark_glow: 'background-image: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.25) 0%, transparent 70%), radial-gradient(ellipse at 50% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 70%) !important; background-attachment: fixed !important; background-size: cover !important;',
    solid: 'background-image: none !important;'
  }

  const applyBackgroundToCss = (css, bgStyle, customBgUrl, blurAmount) => {
    let cleanCss = css.replace(/\/\* MS_BG_START \*\/[\s\S]*?\/\* MS_BG_END \*\/\s*/g, '')
    if (!bgStyle || bgStyle === 'default') return cleanCss

    if (bgPresets[bgStyle]) {
      let rule = bgPresets[bgStyle]
      let bgBlock = `\n/* MS_BG_START */\nbody, html {\n  ${rule}\n}\n/* MS_BG_END */\n`
      return cleanCss + bgBlock
    }

    if (bgStyle === 'custom' && customBgUrl) {
      let blur = blurAmount || '0px'
      if (blur !== '0px' && blur !== '0') {
        let blurredRule = `\n/* MS_BG_START */
body, html {
  background-color: transparent !important;
  background-image: none !important;
}
body::before {
  content: "" !important;
  position: fixed !important;
  top: -20px !important;
  left: -20px !important;
  right: -20px !important;
  bottom: -20px !important;
  width: calc(100% + 40px) !important;
  height: calc(100% + 40px) !important;
  background-image: url("${customBgUrl}") !important;
  background-repeat: no-repeat !important;
  background-size: cover !important;
  background-position: center !important;
  background-attachment: fixed !important;
  filter: blur(${blur}) !important;
  -webkit-filter: blur(${blur}) !important;
  z-index: -1 !important;
  pointer-events: none !important;
}
/* MS_BG_END */\n`
        return cleanCss + blurredRule
      } else {
        let customRule = `background-image: url("${customBgUrl}") !important; background-repeat: no-repeat !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important;`
        let bgBlock = `\n/* MS_BG_START */\nbody, html {\n  ${customRule}\n}\n/* MS_BG_END */\n`
        return cleanCss + bgBlock
      }
    }
    return cleanCss
  }

  const generateRequiredMarkerCSS = (position, style) => {
    let pos = position || 'right'
    let st = style || 'asterisk'
    let css = '\n/* Custom Required Field Marker */\n'

    if (st === 'none') {
      css += `.requiredlabel, span.requiredlabel, div.requiredlabel {
  display: none !important;
}\n`
      return css
    }

    if (st === 'classic') {
      css += `.requiredlabel, span.requiredlabel, div.requiredlabel {
  display: inline-flex !important;
  align-items: center !important;
  color: #ef4444 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}\n`
    } else {
      css += `.requiredlabel, span.requiredlabel, div.requiredlabel {
  display: inline-flex !important;
  align-items: center !important;
  font-size: 0 !important;
  line-height: 0 !important;
  color: transparent !important;
  vertical-align: middle !important;
}\n`
      if (st === 'asterisk') {
        css += `.requiredlabel::before, span.requiredlabel::before, div.requiredlabel::before {
  content: "*" !important;
  font-size: 16px !important;
  line-height: 1 !important;
  font-weight: 700 !important;
  color: #ef4444 !important;
  display: inline-block !important;
}\n`
      } else if (st === 'pill') {
        css += `.requiredlabel::before, span.requiredlabel::before, div.requiredlabel::before {
  content: "Required" !important;
  font-size: 10px !important;
  line-height: 1 !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  color: #ef4444 !important;
  background: #fef2f2 !important;
  border: 1px solid #fecaca !important;
  border-radius: 9999px !important;
  padding: 3px 8px !important;
  display: inline-block !important;
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.08) !important;
}\n`
      } else if (st === 'dot') {
        css += `.requiredlabel::before, span.requiredlabel::before, div.requiredlabel::before {
  content: "" !important;
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background-color: #ef4444 !important;
  display: inline-block !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
}\n`
      }
    }

    if (pos === 'left') {
      css += `td.labelrc div[data-kind="field-label"] {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  align-items: baseline !important;
  gap: 4px !important;
}
td.labelrc .requiredlabel, td.labelrc div.requiredlabel, td.labelrc span.requiredlabel {
  order: -1 !important;
  float: left !important;
  margin-right: 6px !important;
  margin-left: 0 !important;
  margin-top: 2px !important;
}\n`
    } else {
      css += `td.labelrc div[data-kind="field-label"] {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  align-items: baseline !important;
  gap: 4px !important;
}
td.labelrc .requiredlabel, td.labelrc div.requiredlabel, td.labelrc span.requiredlabel {
  order: 1 !important;
  margin-left: 6px !important;
  margin-right: 0 !important;
}\n`
    }

    return css
  }

  // Helper: Detect active theme from #custom_css and update all UI option controls
  const detectCurrentTheme = () => {
    let css = $('#custom_css').val() || ''
    if (!css) {
      activeThemeId = null
      selectedThemeId = null
      syncNativeIframeVisibility()
      if ($('#ms_corner_radius').length) $('#ms_corner_radius').val('16px')
      if ($('#ms_bg_style').length) {
        $('#ms_bg_style').val('default')
        $('#ms_custom_bg_group').hide()
      }
      if ($('#ms_req_style').length) $('#ms_req_style').val('asterisk')
      if ($('#ms_req_pos').length) $('#ms_req_pos').val('right')
      if (typeof syncReqPosVisibility === 'function') syncReqPosVisibility()
      if ($('#ms_autocomplete_min').length) $('#ms_autocomplete_min').val('5')
      return
    }

    let detectedThemeId = null

    // 1. Try matching "Modern Survey Theme: <id or name>"
    let match = css.match(/Modern Survey Theme:\s*([^\r\n*]+)/i)
    if (match && match[1]) {
      let raw = match[1].trim()
      let idMatch = raw.match(/^([a-zA-Z0-9_-]+)/)
      if (idMatch && themes[idMatch[1]]) {
        detectedThemeId = idMatch[1]
      } else {
        let cleanedRaw = raw.replace(/\(.*?\)/g, '').trim().toLowerCase()
        for (let tid in themes) {
          let tName = (themes[tid].name || '').toLowerCase()
          if (tName === cleanedRaw || cleanedRaw.startsWith(tName)) {
            detectedThemeId = tid
            break
          }
        }
      }
    }

    // 2. Fallback: match by unique theme primary color if comment missing
    if (!detectedThemeId) {
      for (let tid in themes) {
        let pColor = themes[tid].colors && themes[tid].colors.primary
        if (pColor && css.includes(`--ms-primary: ${pColor}`) && css.includes(`--ms-primary-hover:`)) {
          detectedThemeId = tid
          break
        }
      }
    }

    if (detectedThemeId && themes[detectedThemeId]) {
      activeThemeId = detectedThemeId
      selectedThemeId = detectedThemeId
    } else {
      activeThemeId = null
      selectedThemeId = null
    }

    syncNativeIframeVisibility()

    // 3. Restore Corner Radius
    let radiusMatch = css.match(/--ms-radius:\s*([^;]+);/)
    if (radiusMatch && radiusMatch[1] && $('#ms_corner_radius').length) {
      let r = radiusMatch[1].trim()
      if (!$('#ms_corner_radius option[value="' + r + '"]').length) {
        $('#ms_corner_radius').append(`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`)
      }
      $('#ms_corner_radius').val(r)
    } else if (activeThemeId && themes[activeThemeId] && $('#ms_corner_radius').length) {
      let r = themes[activeThemeId].radius
      if (!$('#ms_corner_radius option[value="' + r + '"]').length) {
        $('#ms_corner_radius').append(`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`)
      }
      $('#ms_corner_radius').val(r)
    }

    // 4. Restore Background Style and custom image options
    let bgMatch = css.match(/Modern Survey Background:\s*([a-zA-Z0-9_-]+)(?:,\s*blur:\s*([0-9]+px))?(?:,\s*url:\s*([^\s*]+))?/i)
    if (bgMatch && bgMatch[1] && $('#ms_bg_style').length) {
      $('#ms_bg_style').val(bgMatch[1])
      if (bgMatch[1] === 'custom') {
        $('#ms_custom_bg_group').show()
        if (bgMatch[2] && $('#ms_bg_blur').length) {
          if (!$('#ms_bg_blur option[value="' + bgMatch[2] + '"]').length) {
            $('#ms_bg_blur').append(`<option value="${escapeHtml(bgMatch[2])}">${escapeHtml(bgMatch[2])}</option>`)
          }
          $('#ms_bg_blur').val(bgMatch[2])
        }
        if (bgMatch[3] && $('#ms_custom_bg_url').length) {
          $('#ms_custom_bg_url').val(bgMatch[3])
          let filename = bgMatch[3].split('/').pop().split('?')[0]
          $('#ms_bg_upload_status').show().html(`<i class="fas fa-image"></i> ${escapeHtml(filename)}`)
        }
      } else {
        $('#ms_custom_bg_group').hide()
      }
    } else if ($('#ms_bg_style').length) {
      let detectedBg = 'default'
      if (css.includes('/* MS_BG_START */')) {
        for (let preset in bgPresets) {
          if (css.includes(bgPresets[preset])) {
            detectedBg = preset
            break
          }
        }
        if (detectedBg === 'default' && (css.includes('body::before') || css.includes('background-image: url('))) {
          detectedBg = 'custom'
        }
      }
      $('#ms_bg_style').val(detectedBg)
      if (detectedBg === 'custom') {
        $('#ms_custom_bg_group').show()
      } else {
        $('#ms_custom_bg_group').hide()
      }
    }

    // 5. Restore Required Marker style and position
    let reqPosMatch = css.match(/Modern Survey Required:[^\r\n*]*\bpos:\s*([a-zA-Z0-9_-]+)/i)
    let reqStyleMatch = css.match(/Modern Survey Required:[^\r\n*]*\bstyle:\s*([a-zA-Z0-9_-]+)/i)

    let reqPos = reqPosMatch ? reqPosMatch[1].toLowerCase() : null
    let reqStyle = reqStyleMatch ? reqStyleMatch[1].toLowerCase() : null

    // Fallback detection from CSS rules if metadata comment is not present
    if (!reqStyle) {
      if (css.includes('/* Custom Required Field Marker */') || css.includes('.requiredlabel')) {
        if (css.includes('.requiredlabel') && css.includes('display: none !important')) {
          reqStyle = 'none'
        } else if (css.includes('content: "Required" !important')) {
          reqStyle = 'pill'
        } else if (css.includes('border-radius: 50% !important')) {
          reqStyle = 'dot'
        } else if (css.includes('font-weight: 600 !important') && css.includes('color: #ef4444 !important')) {
          reqStyle = 'classic'
        } else if (css.includes('content: "*" !important')) {
          reqStyle = 'asterisk'
        }
      }
    }

    if (!reqPos) {
      if (css.includes('order: -1 !important') || css.includes('float: left !important')) {
        reqPos = 'left'
      } else if (css.includes('order: 1 !important')) {
        reqPos = 'right'
      }
    }

    if (reqPos && $('#ms_req_pos').length) {
      $('#ms_req_pos').val(reqPos)
    }
    if (reqStyle && $('#ms_req_style').length) {
      $('#ms_req_style').val(reqStyle)
    }
    if (typeof syncReqPosVisibility === 'function') {
      syncReqPosVisibility()
    }

    // 6. Restore Autocomplete threshold
    let acMatch = css.match(/Modern Survey Autocomplete:\s*min:\s*([a-zA-Z0-9_-]+)/i)
    if (acMatch && acMatch[1] && $('#ms_autocomplete_min').length) {
      let val = acMatch[1].toLowerCase()
      if (['5', '10', 'always', 'never'].includes(val)) {
        $('#ms_autocomplete_min').val(val)
      } else {
        $('#ms_autocomplete_min').val('5')
      }
    }
  }

  // Helper: Builds preview CSS using currently selected or active theme and options
  const buildCurrentPreviewCSS = (themeId) => {
    let tid = themeId || selectedThemeId || activeThemeId
    if (!tid || !themes[tid]) return ''

    let theme = themes[tid]
    let radius = $('#ms_corner_radius').val() || theme.radius || '10px'
    let bgStyle = $('#ms_bg_style').val() || 'default'
    let customBgUrl = (bgStyle === 'custom') ? $('#ms_custom_bg_url').val() : ''
    let blurAmount = (bgStyle === 'custom') ? $('#ms_bg_blur').val() : '0px'
    let reqStyle = $('#ms_req_style').val() || 'asterisk'
    let reqPos = $('#ms_req_pos').val() || 'right'

    let css = theme.css
    if (radius !== theme.radius) {
      css = css.replace(/--ms-radius:\s*[^;]+;/g, `--ms-radius: ${radius};`)
    }
    css = applyBackgroundToCss(css, bgStyle, customBgUrl, blurAmount)
    css += generateRequiredMarkerCSS(reqPos, reqStyle)
    return css
  }

  // Helper: Injects custom CSS into REDCap's native preview iframe
  const applyIframePreviewCSS = (css) => {
    try {
      let $iframe = $('#survey_theme_design')
      if (!$iframe.length) return

      let iframeDoc = $iframe[0].contentDocument || $iframe[0].contentWindow.document
      if (!iframeDoc) return

      let target = iframeDoc.body || iframeDoc.head
      if (!target) return

      let $style = $(iframeDoc).find('#ms_preview_injected_css')
      if (!$style.length) {
        $style = $('<style id="ms_preview_injected_css" type="text/css"></style>')
        $(target).append($style)
      }

      // Add iframe-specific overrides to beat REDCap's inline body style with higher specificity
      let iframeOverrides = `
html body, body {
  width: 100% !important;
  min-height: 100% !important;
  box-sizing: border-box !important;
  background-color: var(--ms-bg-page, #ffffff) !important;
}
#questiontable {
  max-width: 95% !important;
  margin: 0 auto !important;
}
`
      $style.html(css ? (css + iframeOverrides) : '')
    } catch (err) {
      // Frame not accessible or cross-origin
    }
  }

  const updateIframePreview = () => {
    let css = buildCurrentPreviewCSS()
    if (css) {
      applyIframePreviewCSS(css)
    }
  }

  // Helper: Place a pill reminder next to a setting
  const renderPillReminderFor = (settingKey, selector, tooltip) => {
    let $elem = $(selector)
    if (!$elem.length) return

    $(`.ms-pill-reminder[data-setting="${settingKey}"]`).remove()
    let badgeHtml = pillReminderTemplate(settingKey, tooltip)

    if (settingKey === 'custom_css') $elem.before(`<div style="margin-bottom:6px;">${badgeHtml}</div>`)
    else if (settingKey === 'theme') $elem.append(badgeHtml)
    else $elem.after(badgeHtml)
  }

  // Helper: Place all pill reminders
  const placeAllPillReminders = () => {
    renderPillReminderFor('enhanced_choices', '#enhanced_choices', 'Enhanced radio and checkbox buttons enabled for modern touch/click targets.')
    renderPillReminderFor('font_family', '#font_family', 'Clean, modern font family configured for high readability.')
    renderPillReminderFor('survey_width_percent', '#survey_width_percent', 'Optimal survey container width configured.')
    renderPillReminderFor('custom_css', '#custom_css', 'Modern responsive theme CSS with rounded cards and background styling.')
    renderPillReminderFor('theme', '#theme_parent', 'Standard theme cleared to avoid style collisions with Modern Theme CSS.')
    renderPillReminderFor('show_required_field_text', 'select[name="show_required_field_text"]', 'Required field marker appearance is managed by the Modern Theme via CSS.')
  }

  const removeAllPillReminders = () => {
    $('.ms-pill-reminder').fadeOut(200, function () {
      $(this).remove()
    })
  }

  const showToast = (msg) => {
    $('.ms-toast').remove()
    let $toast = $(toastTemplate(msg))
    $('body').append($toast)
    setTimeout(() => {
      $toast.fadeOut(400, function () { $(this).remove() })
    }, 3500)
  }

  // Helper: Apply chosen theme
  const applyTheme = (themeId) => {
    let theme = themes[themeId]
    if (!theme) return

    let radius = $('#ms_corner_radius').val()
    let bgStyle = $('#ms_bg_style').val()
    let customBgUrl = (bgStyle === 'custom') ? $('#ms_custom_bg_url').val() : ''
    let blurAmount = (bgStyle === 'custom') ? $('#ms_bg_blur').val() : '0px'
    let reqStyle = $('#ms_req_style').val() || 'asterisk'
    let reqPos = $('#ms_req_pos').val() || 'right'
    let acMin = $('#ms_autocomplete_min').val() || '5'

    let css = theme.css
    if (radius !== theme.radius) {
      css = css.replace(/--ms-radius:\s*[^;]+;/g, `--ms-radius: ${radius};`)
    }
    css = applyBackgroundToCss(css, bgStyle, customBgUrl, blurAmount)
    css += generateRequiredMarkerCSS(reqPos, reqStyle)

    // Cleanly prepend Modern Survey Theme header
    css = css.replace(/\/\* Modern Survey Theme:[^\r\n*]+\*\/\s*/gi, '')
    let themeMeta = `/* Modern Survey Theme: ${themeId} (${theme.name}) */\n`
    css = themeMeta + css

    let reqMeta = `/* Modern Survey Required: pos: ${reqPos}, style: ${reqStyle} */\n`
    css = reqMeta + css

    let acMeta = `/* Modern Survey Autocomplete: min: ${acMin} */\n`
    css = acMeta + css

    if (bgStyle && bgStyle !== 'default') {
      let meta = `/* Modern Survey Background: ${bgStyle}`
      if (bgStyle === 'custom') {
        meta += `, blur: ${blurAmount}, url: ${customBgUrl}`
      }
      meta += ' */\n'
      css = meta + css
    }

    // 1. Update form inputs
    $('#custom_css').val(css)
    if ($('#enhanced_choices').length) $('#enhanced_choices').val('1')
    if ($('#font_family').length && theme.font_family) $('#font_family').val(theme.font_family)
    if ($('#survey_width_percent').length && theme.survey_width) $('#survey_width_percent').val(theme.survey_width)
    if ($('#theme').length) {
      $('#theme').val('')
      if (typeof cancelCustomThemeOptions === 'function') cancelCustomThemeOptions()
    }

    // 2. Update active states
    activeThemeId = themeId
    selectedThemeId = themeId

    // 3. Place pill reminders
    placeAllPillReminders()

    // 4. Update UI cards & status
    $('#ms_status_wrapper').html(statusBadgeTemplate(theme))
    $('.ms-card').removeClass('selected')
    $(`.ms-card[data-theme-id="${themeId}"]`).addClass('selected').find('.ms-card-btn').text('✓ Currently Active')

    // 5. Update iframe preview
    updateIframePreview()
    syncNativeIframeVisibility()

    showToast(`"${theme.name}" applied! Display options updated with pill reminders.`)
  }

  // Helper: Clear theme
  const clearTheme = () => {
    if (!confirm('Are you sure you want to clear the modern theme custom CSS?')) return

    $('#custom_css').val('')
    activeThemeId = null
    selectedThemeId = null
    removeAllPillReminders()

    $('#ms_status_wrapper').html(statusBadgeTemplate(null))
    $('.ms-card').removeClass('selected')
    $('.ms-card-btn').text('Select Theme')

    if ($('#ms_corner_radius').length) $('#ms_corner_radius').val('16px')
    if ($('#ms_bg_style').length) {
      $('#ms_bg_style').val('default')
      $('#ms_custom_bg_group').hide()
      $('#ms_custom_bg_url').val('')
      $('#ms_bg_upload_status').hide().empty()
      $('#ms_bg_blur').val('8px')
    }
    if ($('#ms_req_style').length) $('#ms_req_style').val('asterisk')
    if ($('#ms_req_pos').length) $('#ms_req_pos').val('right')
    syncReqPosVisibility()
    if ($('#ms_autocomplete_min').length) $('#ms_autocomplete_min').val('5')

    syncNativeIframeVisibility()
    applyIframePreviewCSS('')

    showToast('Theme cleared. Default settings restored.')
  }

  // Helper: Open preview modal
  const openPreviewModal = (themeId) => {
    let tid = themeId || selectedThemeId || activeThemeId || 'modern_slate'
    let theme = themes[tid]
    if (!theme) return
    let css = buildCurrentPreviewCSS(tid)

    let linkTags = ''
    try {
      linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(l => l.href && (l.href.includes('font-awesome') || l.href.includes('fontawesome') || l.href.includes('fonts.css')))
        .map(l => `<link rel="stylesheet" href="${escapeHtml(l.href)}">`)
        .join('\n')
    } catch (e) {}
    if (moduleObj && moduleObj.fontsCssUrl && !linkTags.includes('fonts.css')) {
      linkTags += `\n<link rel="stylesheet" href="${escapeHtml(moduleObj.fontsCssUrl)}">`
    }

    let modalHtml = previewModalContainerTemplate()
    if (typeof simpleDialog === 'function') {
      simpleDialog(modalHtml, `Theme Preview: ${theme.name}`, 'ms_preview_dialog', 840)

      let populateIframe = () => {
        let iframe = document.getElementById('ms_preview_modal_iframe')
        if (iframe) {
          let doc = iframe.contentDocument || iframe.contentWindow.document
          if (doc) {
            doc.open()
            doc.write(previewModalDocumentTemplate(theme, css, linkTags))
            doc.close()
          }
        }
      }
      populateIframe()
      setTimeout(populateIframe, 60)
    } else {
      alert(`Preview for ${theme.name} ready.`)
    }
  }

  // Initialize UI: detect active theme for card rendering
  detectCurrentTheme()

  if (!$('#modern_survey_container').length) {
    let cardsHtml = Object.keys(themes).map((id) => {
      let theme = themes[id]
      let isSelected = (id === selectedThemeId)
      let isActive = (id === activeThemeId)
      return themeCardTemplate(id, theme, isSelected, isActive)
    }).join('')

    let activeTheme = activeThemeId ? themes[activeThemeId] : null
    let containerHtml = modernSurveyContainerTemplate(statusBadgeTemplate(activeTheme), cardsHtml)

    let $targetRow = $('#custom_css').closest('tr')
    if ($targetRow.length) $targetRow.before(containerHtml)
    else $('#question_by_section-tr').before(containerHtml)
  }

  // Update all option controls (corner radius, background, required marker, autocomplete)
  // now that the controls exist in the DOM
  detectCurrentTheme()

  if (activeThemeId && themes[activeThemeId]) {
    placeAllPillReminders()

    setTimeout(() => {
      let $activeCard = $(`.ms-card[data-theme-id="${activeThemeId}"]`)
      if ($activeCard.length && $activeCard[0]) {
        $activeCard[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
      updateBumperStates()
    }, 150)
  }

  setTimeout(() => {
    syncNativeIframeVisibility()
    updateIframePreview()
  }, 200)

  const updateBumperStates = () => {
    let el = $('#ms_cards_scroll')[0]
    if (!el) return
    let atStart = el.scrollLeft <= 10
    let atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
    $('#ms_bumper_prev').toggleClass('disabled', atStart).prop('disabled', atStart)
    $('#ms_bumper_next').toggleClass('disabled', atEnd).prop('disabled', atEnd)
  }
  setTimeout(updateBumperStates, 100)

  // Event Listeners
  $(document).on('click', '#ms_bumper_prev', () => {
    let $scroll = $('#ms_cards_scroll')
    $scroll.animate({ scrollLeft: $scroll.scrollLeft() - 259 }, 250, updateBumperStates)
  })

  $(document).on('click', '#ms_bumper_next', () => {
    let $scroll = $('#ms_cards_scroll')
    $scroll.animate({ scrollLeft: $scroll.scrollLeft() + 259 }, 250, updateBumperStates)
  })

  $(document).on('scroll', '#ms_cards_scroll', updateBumperStates)

  $(document).on('click', '.ms-card', function () {
    let themeId = $(this).data('theme-id')
    selectedThemeId = themeId
    $('.ms-card').removeClass('selected')
    $(this).addClass('selected')

    $('.ms-card-btn').text('Select Theme')
    if (activeThemeId === themeId) $(this).find('.ms-card-btn').text('✓ Currently Active')
    else $(this).find('.ms-card-btn').text('✓ Selected')

    if ($(this)[0]) $(this)[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    syncNativeIframeVisibility()
    updateIframePreview()
  })

  $(document).on('change', '#ms_bg_style', function () {
    if ($(this).val() === 'custom') $('#ms_custom_bg_group').show()
    else $('#ms_custom_bg_group').hide()
    updateIframePreview()
  })

  $(document).on('change', '#ms_req_style', () => {
    syncReqPosVisibility()
    updateIframePreview()
  })

  $(document).on('change', '#ms_corner_radius, #ms_bg_blur, #ms_custom_bg_url, #ms_req_pos, #ms_autocomplete_min', () => {
    updateIframePreview()
  })

  $(document).on('click', '#ms_btn_upload_bg', (e) => {
    if (!module.fileRepoEnabled) {
      e.preventDefault()
      alert('REDCap File Repository is disabled for this project or system. Uploading background images requires the File Repository to be enabled.')
      return
    }
    $('#ms_bg_file_input').trigger('click')
  })

  $(document).on('change', '#ms_bg_file_input', function () {
    let file = this.files[0]
    if (!file) return

    if (!module.fileRepoEnabled) {
      alert('REDCap File Repository is not enabled. Background images cannot be uploaded.')
      this.value = ''
      return
    }

    let ext = file.name.split('.').pop().toLowerCase()
    let allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    if (!allowed.includes(ext)) {
      alert('Please select a valid image file (JPG, PNG, WEBP, or GIF).')
      this.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('The selected image is larger than 10 MB. Please select a smaller image.')
      this.value = ''
      return
    }

    let $status = $('#ms_bg_upload_status')
    $status.show().html('<i class="fas fa-spinner fa-spin"></i> Storing in File Repository...')

    let reader = new FileReader()
    reader.onload = (e) => {
      let dataUrl = e.target.result

      module.ajax('upload_bg_image', {
        dataUrl: dataUrl,
        filename: file.name
      }).then((res) => {
        if (res && res.success && res.url) {
          $('#ms_custom_bg_url').val(res.url)
          $status.html(`<i class="fas fa-check" style="color:#10b981;"></i> Saved to File Repo: ${escapeHtml(res.filename || file.name)}`)
          showToast('Background image saved to File Repository!')
        } else {
          let err = (res && res.error) ? res.error : 'Upload failed'
          $status.html(`<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> ${escapeHtml(err)}`)
          alert('File Repository Upload Error: ' + err)
        }
      }).catch((err) => {
        let msg = typeof err === 'string' ? err : (err && err.message ? err.message : 'Upload request failed.')
        $status.html('<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Upload failed')
        alert('Upload failed via REDCap AJAX framework: ' + msg)
      })
    }

    reader.onerror = () => {
      $status.html('<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> Read error')
      alert('Failed to read selected image file.')
    }

    reader.readAsDataURL(file)
  })

  $(document).on('click', '#ms_btn_apply', (e) => {
    e.preventDefault()
    applyTheme(selectedThemeId)
  })

  $(document).on('click', '#ms_btn_clear', (e) => {
    e.preventDefault()
    clearTheme()
  })

  $(document).on('click', '#ms_btn_preview', (e) => {
    e.preventDefault()
    openPreviewModal(selectedThemeId)
  })

  // Mark pill reminder as User Adjusted if setting manually edited
  const watched = ['#enhanced_choices', '#font_family', '#survey_width_percent', '#custom_css', '#theme']
  $(document).on('change keyup', watched.join(', '), function () {
    let id = $(this).attr('id')
    let $pill = $(`.ms-pill-reminder[data-setting="${id}"]`)
    if ($pill.length) {
      $pill.addClass('user-modified')
        .html('<i class="fas fa-pen"></i> <span class="pill-label">User Adjusted</span>')
    }
  })

  $(document).on('change', 'select[name="show_required_field_text"]', function () {
    let $pill = $('.ms-pill-reminder[data-setting="show_required_field_text"]')
    if ($pill.length) {
      $pill.addClass('user-modified')
        .html('<i class="fas fa-pen"></i> <span class="pill-label">User Adjusted</span>')
    }
  })

  // Keep native preview iframe visibility and styling synced whenever it loads
  $('#survey_theme_design').on('load', () => {
    syncNativeIframeVisibility()
    updateIframePreview()
  })
})
