$(() => {
    // Only run on survey forms with #questiontable
    if (!$('#questiontable').length) return

    const DEFAULT_AUTOCOMPLETE_THRESHOLD = '5'
    const AUTOCOMPLETE_PLACEHOLDER = 'Select an option or type to search...'

    // Autocomplete Container Layout CSS
    const AUTOCOMPLETE_CSS = `
        #questiontable .rc-autocomplete-wrapper.ms-ac-container,
        #questiontable .rc-autocomplete-wrapper,
        #questiontable .nowrap.rc-autocomplete-wrapper {
            display: flex !important;
            width: 100% !important;
            max-width: 100% !important;
        }
    `

    // Autocomplete Wrapper HTML/CSS Template
    const autocompleteWrapperTemplate = (name, aria = '', appPathImages = (window.app_path_images || '')) => `
        <div class="nowrap rc-autocomplete-wrapper ms-ac-container">
            <input role="combobox" type="text" class="x-form-text x-form-field rc-autocomplete" 
                   id="rc-ac-input_${name}" aria-labelledby="${aria}" 
                   placeholder="${AUTOCOMPLETE_PLACEHOLDER}" autocomplete="off">
            <button type="button" listopen="0" tabindex="-1" class="ui-button ui-widget ui-state-default ui-corner-right rc-autocomplete" aria-label="Toggle">
                <img class="rc-autocomplete" src="${appPathImages}arrow_state_grey_expanded.png" alt="Toggle">
            </button>
        </div>`

    // Inject client-side autocomplete helper stylesheet if not already present
    const injectClientStyles = () => {
        if (!$('#ms-client-autocomplete-css').length) {
            $('<style id="ms-client-autocomplete-css" type="text/css">')
                .text(AUTOCOMPLETE_CSS)
                .appendTo('head')
        }
    }

    injectClientStyles()

    const getAutocompleteThreshold = () => {
        let threshold = DEFAULT_AUTOCOMPLETE_THRESHOLD
        $('style').each((i, el) => {
            let content = $(el).text()
            if (content && content.includes('Modern Survey Autocomplete:')) {
                let match = content.match(/\/\* Modern Survey Autocomplete:\s*min:\s*([a-zA-Z0-9_-]+)/)
                if (match && match[1]) {
                    threshold = match[1]
                    return false
                }
            }
        })
        return threshold
    }

    const enhanceNativeAutocomplete = ($select) => {
        let name = $select.attr('name')
        if (!name) return

        let $tr = $select.closest('tr')
        let $input = $tr.find(`#rc-ac-input_${name}`)
        if (!$input.length) return

        let $wrapper = $input.closest('.nowrap')
        if ($wrapper.length) {
            $wrapper.addClass('rc-autocomplete-wrapper')
        }

        // Clear inline pixel width set by REDCap JS so flexbox stretches cleanly to container
        $input.css('width', '')
        if (!$input.attr('placeholder')) {
            $input.attr('placeholder', AUTOCOMPLETE_PLACEHOLDER)
        }
    }

    // Flag native REDCap autocomplete fields on initial load so they are never converted to standard dropdowns
    $('#questiontable select').each(function () {
        let $select = $(this)
        let name = $select.attr('name')
        if (!name) return

        let $tr = $select.closest('tr')
        let isNative = $select.hasClass('rc-autocomplete') ||
            (!$tr.find('.ms-ac-container').length && $tr.find(`#rc-ac-input_${name}`).length > 0)

        if (isNative) {
            $select.addClass('ms-rc-native-autocomplete')
            enhanceNativeAutocomplete($select)
        }
    })

    const enableAutocompleteForSelect = ($select) => {
        let name = $select.attr('name')
        if (!name) return

        let $tr = $select.closest('tr')
        if ($tr.find(`#rc-ac-input_${name}`).length > 0) return

        let aria = $select.attr('aria-labelledby') || ''
        let currentVal = $select.val()
        let currentText = currentVal ? $select.find('option:selected').text() : ''

        $select.addClass('rc-autocomplete').hide()
        if ($select.parent('span').length) {
            $select.parent('span').hide()
        }

        let $wrapper = $(autocompleteWrapperTemplate(name, aria, window.app_path_images))

        if (currentText) {
            $wrapper.find('input').val(currentText).attr('value', currentText)
        }

        if ($select.parent('span').length) {
            $select.parent('span').after($wrapper)
        } else {
            $select.after($wrapper)
        }

        if (typeof enableDropdownAutocomplete === 'function') {
            enableDropdownAutocomplete()
            $wrapper.find('input').css('width', '')
        }
    }

    const disableAutocompleteForSelect = ($select) => {
        // Dropdowns setup in REDCap to use autocomplete should never be stripped of autocomplete
        if ($select.hasClass('ms-rc-native-autocomplete')) return

        let name = $select.attr('name')
        if (!name) return

        let $tr = $select.closest('tr')
        $tr.find('.ms-ac-container').remove()
        $select.removeClass('rc-autocomplete rc-autocomplete-enabled').show().css('display', '')
        if ($select.parent('span').length) {
            $select.parent('span').show().css('display', '')
        }
    }

    const syncSurveyDropdowns = () => {
        let threshold = getAutocompleteThreshold()

        $('#questiontable select').each(function () {
            let $select = $(this)
            let name = $select.attr('name')
            if (!name) return

            let $tr = $select.closest('tr')
            let isNative = $select.hasClass('ms-rc-native-autocomplete') ||
                (!$tr.find('.ms-ac-container').length && ($select.hasClass('rc-autocomplete') || $tr.find(`#rc-ac-input_${name}`).length > 0))

            // Dropdowns configured in REDCap to use autocomplete always retain autocomplete & modern styling
            if (isNative) {
                $select.addClass('ms-rc-native-autocomplete')
                enhanceNativeAutocomplete($select)
                return
            }

            // For standard dropdowns, evaluate threshold (5, 10, always, never)
            let optionCount = $select.find('option').filter(function () {
                return this.value !== ''
            }).length

            let shouldEnable = false
            if (threshold === 'always') {
                shouldEnable = true
            } else if (threshold === 'never') {
                shouldEnable = false
            } else {
                let minChoices = parseInt(threshold, 10)
                if (isNaN(minChoices)) minChoices = parseInt(DEFAULT_AUTOCOMPLETE_THRESHOLD, 10)
                shouldEnable = (optionCount >= minChoices)
            }

            let hasAc = $tr.find('.ms-ac-container').length > 0 ||
                $tr.find(`#rc-ac-input_${name}`).length > 0

            if (shouldEnable) {
                if (!hasAc) {
                    enableAutocompleteForSelect($select)
                }
            } else {
                if (hasAc) {
                    disableAutocompleteForSelect($select)
                }
            }
        })
    }

    // Run initial sync
    syncSurveyDropdowns()

    // Hook into REDCap branching logic evaluations if present
    if (typeof window.doBranching === 'function') {
        let origDoBranching = window.doBranching
        window.doBranching = function () {
            let r = origDoBranching.apply(this, arguments)
            syncSurveyDropdowns()
            return r
        }
    }
})
