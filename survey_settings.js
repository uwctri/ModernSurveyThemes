$(() => {
    // Access REDCap ExternalModules global
    const module = ExternalModules.UWMadison.ModernSurvey
    const themes = module.themes

    if (!$('#custom_css').length) return

    let activeThemeId = null
    let selectedThemeId = 'modern_slate'

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
			  <span class="ms-tag"><i class="fas fa-shapes"></i> ${theme.radius} Corners</span>
			  <span class="ms-tag"><i class="far fa-image"></i> ${escapeHtml(theme.bg_name)}</span>
			  <span class="ms-tag"><i class="fas fa-check-circle"></i> Enhanced Choices</span>
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
			  <div class="ms-header-icon"><i class="fas fa-magic"></i></div>
			  <div class="ms-header-text">
				<h3>Modern Survey Themes</h3>
				<p>Select a modern responsive theme with rounded card containers, sleek field controls, and subtle background styling.</p>
			  </div>
			</div>
			<div id="ms_status_wrapper">${statusBadgeHtml}</div>
		  </div>
		  <div class="ms-cards-grid">
			${cardsHtml}
		  </div>
		  <div class="ms-options-bar">
			<div class="ms-option-group">
			  <label for="ms_corner_radius"><i class="fas fa-vector-square"></i> Corner Rounding:</label>
			  <select id="ms_corner_radius" class="ms-select">
				<option value="12px">Subtle (12px)</option>
				<option value="16px" selected>Modern (16px - Recommended)</option>
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
				<option value="custom">Custom Image URL...</option>
			  </select>
			</div>
			<div class="ms-option-group" id="ms_custom_bg_group" style="display:none;">
			  <label for="ms_custom_bg_url">Image URL:</label>
			  <input type="text" id="ms_custom_bg_url" class="ms-input-text" placeholder="https://example.com/background.jpg">
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

	const previewModalTemplate = (theme, css) => `
	<div id="ms_preview_modal_content" style="padding: 10px; max-height: 520px; overflow-y: auto;">
	  <div id="pagecontainer" style="max-width: 740px; margin: 0 auto; padding: 10px 0;">
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
				<td colspan="2" class="header"><i class="fas fa-user-edit"></i> Section 1: Standard & Enhanced Fields</td>
			  </tr>
			  <tr>
				<td class="labelrc" style="width: 45%;"><span class="questionnum">1</span> Participant Full Name <span class="requiredlabel">* must provide value</span></td>
				<td class="data"><input type="text" value="Jane Doe" style="width: 85%;"></td>
			  </tr>
			  <tr>
				<td class="labelrc"><span class="questionnum">2</span> Preferred Contact Method (Enhanced Choices)</td>
				<td class="data">
				  <div class="enhancedchoice_wrapper">
					<div class="enhancedchoice"><label class="selectedradio"><span class="ec"><i class="fas fa-check-circle"></i> Email</span></label></div>
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
				<td colspan="2" class="header"><i class="fas fa-sliders-h"></i> Section 2: Matrix & Visual Analog Scale</td>
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
	  <style>${css}</style>
	</div>`

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

	const applyBackgroundToCss = (css, bgStyle, customBgUrl) => {
		if (bgPresets[bgStyle]) return css.replace(/(body\s*\{[\s\S]*?)background-image:[^;]+;/, `$1${bgPresets[bgStyle]}`)
		if (bgStyle === 'custom' && customBgUrl) return css.replace(/(body\s*\{[\s\S]*?)background-image:[^;]+;/, `$1background-image: url("${customBgUrl}") !important; background-repeat: no-repeat !important; background-size: cover !important; background-position: center !important; background-attachment: fixed !important;`)
		return css
	}

    // Helper: Detect active theme from #custom_css
    const detectCurrentTheme = () => {
        let css = $('#custom_css').val()
        let match = css.match(/\/\* Modern Survey Theme:\s*([a-zA-Z0-9_-]+)/)
        if (match && match[1] && themes[match[1]]) {
            activeThemeId = match[1]
            selectedThemeId = match[1]
        } else activeThemeId = null

        let bgMatch = css.match(/\/\* Modern Survey Background:\s*([a-zA-Z0-9_-]+)/)
        if (bgMatch && bgMatch[1] && $('#ms_bg_style').length) {
            $('#ms_bg_style').val(bgMatch[1])
            if (bgMatch[1] === 'custom') $('#ms_custom_bg_group').show()
            else $('#ms_custom_bg_group').hide()
        }
    }

    // Helper: Injects custom CSS into REDCap's native preview iframe
    const applyIframePreviewCSS = (css) => {
        try {
            let $iframe = $('#survey_theme_design')
            if (!$iframe.length) return

            let iframeDoc = $iframe[0].contentDocument || $iframe[0].contentWindow.document
            if (!iframeDoc || !iframeDoc.head) return

            let $head = $(iframeDoc.head)
            let $style = $head.find('#ms_preview_injected_css')

            if (!$style.length) {
                $style = $('<style id="ms_preview_injected_css" type="text/css"></style>')
                $head.append($style)
            }

            $style.html(css)
        } catch (err) {
            // Frame not accessible or cross-origin
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
    }

    const removeAllPillReminders = () => {
        $('.ms-pill-reminder').fadeOut(200, function() {
            $(this).remove()
        })
    }

    const showToast = (msg) => {
        $('.ms-toast').remove()
        let $toast = $(toastTemplate(msg))
        $('body').append($toast)
        setTimeout(() => {
            $toast.fadeOut(400, function() { $(this).remove() })
        }, 3500)
    }

    // Helper: Apply chosen theme
    const applyTheme = (themeId) => {
        let theme = themes[themeId]
        if (!theme) return

        let radius = $('#ms_corner_radius').val()
        let bgStyle = $('#ms_bg_style').val()
        let customBgUrl = (bgStyle === 'custom') ? $('#ms_custom_bg_url').val() : ''

        let css = theme.css
        if (radius !== theme.radius) css = css.replace(/--ms-radius:\s*[^;]+;/g, `--ms-radius: ${radius};`)
        css = applyBackgroundToCss(css, bgStyle, customBgUrl)
        if (bgStyle && bgStyle !== 'default') css = `/* Modern Survey Background: ${bgStyle} */\n` + css

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

        // 5. Hide native preview iframe row
        $('#survey_theme_design').closest('tr').hide()

        showToast(`"${theme.name}" applied! Display options updated with pill reminders.`)
    }

    // Helper: Clear theme
    const clearTheme = () => {
        if (!confirm('Are you sure you want to clear the modern theme custom CSS?')) return

        $('#custom_css').val('')
        activeThemeId = null
        removeAllPillReminders()

        $('#ms_status_wrapper').html(statusBadgeTemplate(null))
        $('.ms-card').removeClass('selected')
        $('.ms-card-btn').text('Select Theme')

        $('#survey_theme_design').closest('tr').hide()

        showToast('Theme cleared. Default settings restored.')
    }

    // Helper: Open preview modal
    const openPreviewModal = (themeId) => {
        let theme = themes[themeId]
        let radius = $('#ms_corner_radius').val()
        let bgStyle = $('#ms_bg_style').val()
        let customBgUrl = (bgStyle === 'custom') ? $('#ms_custom_bg_url').val() : ''

        let css = theme.css.replace(/--ms-radius:\s*[^;]+;/g, `--ms-radius: ${radius};`)
        css = applyBackgroundToCss(css, bgStyle, customBgUrl)

        let modalHtml = previewModalTemplate(theme, css)
        if (typeof simpleDialog === 'function') simpleDialog(modalHtml, `Theme Preview: ${theme.name}`, 'ms_preview_dialog', 820)
        else alert(`Preview for ${theme.name} ready.`)
    }

    // Initialize UI
    detectCurrentTheme()
    $('#survey_theme_design').closest('tr').hide()

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

    if (activeThemeId && themes[activeThemeId]) {
        placeAllPillReminders()
        $('#survey_theme_design').closest('tr').hide()
    }

    // Event Listeners
    $(document).on('click', '.ms-card', function() {
        let themeId = $(this).data('theme-id')
        selectedThemeId = themeId
        $('.ms-card').removeClass('selected')
        $(this).addClass('selected')

        $('.ms-card-btn').text('Select Theme')
        if (activeThemeId === themeId) $(this).find('.ms-card-btn').text('✓ Currently Active')
        else $(this).find('.ms-card-btn').text('✓ Selected')
    })

    $(document).on('change', '#ms_bg_style', function() {
        if ($(this).val() === 'custom') $('#ms_custom_bg_group').show()
        else $('#ms_custom_bg_group').hide()
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
    $(document).on('change keyup', watched.join(', '), function() {
        let id = $(this).attr('id')
        let $pill = $(`.ms-pill-reminder[data-setting="${id}"]`)
        if ($pill.length) {
            $pill.addClass('user-modified')
                 .html('<i class="fas fa-pen"></i> <span class="pill-label">User Adjusted</span>')
        }
    })

    // Ensure native preview iframe row stays hidden if reloaded
    $('#survey_theme_design').on('load', () => {
        $('#survey_theme_design').closest('tr').hide()
    })
})
