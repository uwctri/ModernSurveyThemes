$(() => {
    // Only run on survey forms with #questiontable
    if (!$('#questiontable').length) return

    // Bail immediately if Modern Survey Theme is not applied to this survey
    let hasModernTheme = false
    $('style').each((i, el) => {
        let txt = $(el).text()
        if (txt && txt.includes('Modern Survey Theme:')) {
            hasModernTheme = true
            return false
        }
    })
    if (!hasModernTheme) return

    // Reveal container cleanly once theme is verified
    $('#pagecontainer').addClass('modern-survey-ready')
    $('body').addClass('modern-survey-ready')

    // Align visible right vertical radio buttons and checkboxes flush with other fields
    $('#questiontable .choicevert:not(.hidden)').css({ 'margin-left': '0', 'text-indent': '0' })
    $('#questiontable .choicevert.hidden, #questiontable .choicehoriz.hidden').hide()
    $('#questiontable div.enhancedchoice label').css({ 'margin': '0' })

    const DEFAULT_AUTOCOMPLETE_THRESHOLD = '5'
    const AUTOCOMPLETE_PLACEHOLDER = 'Select an option or type to search...'

    // Autocomplete Wrapper HTML Template
    const autocompleteWrapperTemplate = (name, aria = '', appPathImages = (window.app_path_images || '')) => `
        <div class="nowrap rc-autocomplete-wrapper ms-ac-container">
            <input role="combobox" type="text" class="x-form-text x-form-field rc-autocomplete" 
                   id="rc-ac-input_${name}" aria-labelledby="${aria}" 
                   placeholder="${AUTOCOMPLETE_PLACEHOLDER}" autocomplete="off">
            <button type="button" listopen="0" tabindex="-1" class="ui-button ui-widget ui-state-default ui-corner-right rc-autocomplete" aria-label="Toggle">
                <img class="rc-autocomplete" src="${appPathImages}arrow_state_grey_expanded.png" alt="Toggle">
            </button>
        </div>`

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

    // ─── Modern Date/Time Pickers ─────────────────────────────────────────────

    const DATE_FIELD_CONFIGS = {
        date_ymd:             { dateType: 'date',     dateOrder: 'ymd', hasTime: false, hasSeconds: false },
        date_mdy:             { dateType: 'date',     dateOrder: 'mdy', hasTime: false, hasSeconds: false },
        date_dmy:             { dateType: 'date',     dateOrder: 'dmy', hasTime: false, hasSeconds: false },
        datetime_ymd:         { dateType: 'datetime', dateOrder: 'ymd', hasTime: true,  hasSeconds: false },
        datetime_mdy:         { dateType: 'datetime', dateOrder: 'mdy', hasTime: true,  hasSeconds: false },
        datetime_dmy:         { dateType: 'datetime', dateOrder: 'dmy', hasTime: true,  hasSeconds: false },
        datetime_seconds_ymd: { dateType: 'datetime', dateOrder: 'ymd', hasTime: true,  hasSeconds: true  },
        datetime_seconds_mdy: { dateType: 'datetime', dateOrder: 'mdy', hasTime: true,  hasSeconds: true  },
        datetime_seconds_dmy: { dateType: 'datetime', dateOrder: 'dmy', hasTime: true,  hasSeconds: true  },
        time:                 { dateType: 'time',     dateOrder: null,   hasTime: true,  hasSeconds: false },
        time3:                { dateType: 'time',     dateOrder: null,   hasTime: true,  hasSeconds: true  },
        time_hh_mm_ss:        { dateType: 'time',     dateOrder: null,   hasTime: true,  hasSeconds: true  },
    }

    // Detect locale week start (0 = Sunday, 1 = Monday)
    const localeWeekStart = (() => {
        try {
            const loc = new Intl.Locale(navigator.language || 'en-US')
            const fw = loc.weekInfo?.firstDay ?? loc.getWeekInfo?.().firstDay ?? 0
            return fw === 1 ? 1 : 0
        } catch (e) { return 0 }
    })()

    const DOW_LABELS_SUN = ['Su','Mo','Tu','We','Th','Fr','Sa']
    const DOW_LABELS_MON = ['Mo','Tu','We','Th','Fr','Sa','Su']
    const MS_DOW_LABELS  = localeWeekStart === 1 ? DOW_LABELS_MON : DOW_LABELS_SUN
    const MS_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const MS_MONTH_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

    // Parse a REDCap-formatted field value → state object
    const parseREDCapValue = (val, cfg) => {
        if (!val || !val.trim()) return null
        val = val.trim()
        if (cfg.dateType === 'time') {
            const p = val.split(':')
            return { hour: parseInt(p[0])||0, minute: parseInt(p[1])||0, second: parseInt(p[2])||0 }
        }
        const [datePart, timePart] = val.split(' ')
        const dp = (datePart || '').split('-')
        if (dp.length < 3) return null
        let year, month, day
        if (cfg.dateOrder === 'ymd') { year=parseInt(dp[0]); month=parseInt(dp[1])-1; day=parseInt(dp[2]) }
        else if (cfg.dateOrder === 'mdy') { month=parseInt(dp[0])-1; day=parseInt(dp[1]); year=parseInt(dp[2]) }
        else { day=parseInt(dp[0]); month=parseInt(dp[1])-1; year=parseInt(dp[2]) }
        if (isNaN(year)||isNaN(month)||isNaN(day)) return null
        let hour=0, minute=0, second=0
        if (timePart) { const tp=timePart.split(':'); hour=parseInt(tp[0])||0; minute=parseInt(tp[1])||0; second=parseInt(tp[2])||0 }
        return { year, month, day, hour, minute, second }
    }

    // Format state object → REDCap string
    const formatREDCapValue = (st, cfg) => {
        if (cfg.dateType === 'time') {
            const hh=String(st.hour).padStart(2,'0'), mm=String(st.minute).padStart(2,'0')
            return cfg.hasSeconds ? `${hh}:${mm}:${String(st.second).padStart(2,'0')}` : `${hh}:${mm}`
        }
        const y=String(st.year).padStart(4,'0'), mo=String(st.month+1).padStart(2,'0'), d=String(st.day).padStart(2,'0')
        let datePart
        if (cfg.dateOrder==='ymd') datePart=`${y}-${mo}-${d}`
        else if (cfg.dateOrder==='mdy') datePart=`${mo}-${d}-${y}`
        else datePart=`${d}-${mo}-${y}`
        if (!cfg.hasTime) return datePart
        const hh=String(st.hour).padStart(2,'0'), mm=String(st.minute).padStart(2,'0')
        const timePart=cfg.hasSeconds?`${hh}:${mm}:${String(st.second).padStart(2,'0')}`:`${hh}:${mm}`
        return `${datePart} ${timePart}`
    }

    // Natural language parser — runs on blur of date/time inputs
    const parseNaturalInput = (text, cfg) => {
        if (!text||!text.trim()) return null
        text = text.trim().toLowerCase()
        const today = new Date()
        const mkState = (d, h=0, mi=0, s=0) => ({ year:d.getFullYear(), month:d.getMonth(), day:d.getDate(), hour:h, minute:mi, second:s })
        if (text==='today'||text==='now') {
            if (cfg.dateType==='time') return { hour:today.getHours(), minute:today.getMinutes(), second:today.getSeconds() }
            return mkState(today, today.getHours(), today.getMinutes(), 0)
        }
        if (text==='yesterday') { const d=new Date(today); d.setDate(d.getDate()-1); return mkState(d) }
        if (text==='tomorrow')  { const d=new Date(today); d.setDate(d.getDate()+1); return mkState(d) }
        if (cfg.dateType==='time') {
            const m=text.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/)
            if (!m) return null
            let h=parseInt(m[1]), mi=parseInt(m[2])||0, s=parseInt(m[3])||0
            if (m[4]==='pm'&&h<12) h+=12
            if (m[4]==='am'&&h===12) h=0
            return (h>=0&&h<24) ? { hour:h, minute:mi, second:s } : null
        }
        let parsed = null
        // ISO: YYYY-MM-DD or YYYY/MM/DD
        let m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
        if (m) parsed = { year:parseInt(m[1]), month:parseInt(m[2])-1, day:parseInt(m[3]) }
        // Ambiguous: M/D/Y or D/M/Y — use dateOrder to disambiguate
        if (!parsed) {
            m = text.match(/^(\d{1,2})[-/.:](\d{1,2})[-/.](\d{2,4})/)
            if (m) {
                let a=parseInt(m[1]), b=parseInt(m[2]), yr=parseInt(m[3])
                if (yr<100) yr += yr<50?2000:1900
                parsed = cfg.dateOrder==='dmy' ? { year:yr, month:b-1, day:a } : { year:yr, month:a-1, day:b }
            }
        }
        // "Mar 15" / "15 Mar" with optional year
        if (!parsed) {
            const monthIdx = s => MS_MONTH_SHORT.findIndex(mn => s.toLowerCase().startsWith(mn))
            m = text.match(/([a-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/)
            if (m&&monthIdx(m[1])>=0) parsed={ year:parseInt(m[3])||today.getFullYear(), month:monthIdx(m[1]), day:parseInt(m[2]) }
            if (!parsed) {
                m = text.match(/(\d{1,2})\s+([a-z]+)(?:[,\s]+(\d{4}))?/)
                if (m&&monthIdx(m[2])>=0) parsed={ year:parseInt(m[3])||today.getFullYear(), month:monthIdx(m[2]), day:parseInt(m[1]) }
            }
        }
        if (!parsed||parsed.month<0||parsed.month>11||parsed.day<1||parsed.day>31) return null
        let h=0, mi=0, s=0
        if (cfg.hasTime) {
            const tm = text.match(/\s+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/)
            if (tm) { h=parseInt(tm[1])||0; mi=parseInt(tm[2])||0; s=parseInt(tm[3])||0; if (tm[4]==='pm'&&h<12) h+=12; if (tm[4]==='am'&&h===12) h=0 }
        }
        return { ...parsed, hour:h, minute:mi, second:s }
    }

    // ─── Picker State ─────────────────────────────────────────────────────────

    let $msPicker = null
    let msPickerInput = null
    let msPickerCfg = null
    let msPickerSt = null   // {year,month,day,hour,minute,second}
    let msClockMode = 'hour' // 'hour'|'minute'|'second'

    // ─── Picker Open / Close ──────────────────────────────────────────────────

    const openMSPicker = ($input, cfg) => {
        msPickerInput = $input
        msPickerCfg = cfg
        msClockMode = 'hour'

        const existing = parseREDCapValue($input.val(), cfg)
        const now = new Date()
        msPickerSt = existing || { year:now.getFullYear(), month:now.getMonth(), day:now.getDate(), hour:now.getHours(), minute:now.getMinutes(), second:0 }

        $('#ms-picker-overlay').remove()

        const $overlay = $('<div class="ms-picker-overlay" id="ms-picker-overlay">')
        const $panel   = $('<div class="ms-picker-panel">')
        const $cols    = $('<div class="ms-picker-cols">')

        if (cfg.dateType !== 'time') $cols.append(buildCalSection())
        if (cfg.hasTime)             $cols.append(buildClockSection())

        // Action row
        const $arow   = $('<div class="ms-picker-action-row">')
        const $left   = $('<div>')
        const $right  = $('<div style="display:flex;gap:6px;">')
        const $cancel = $('<button class="ms-picker-btn ms-picker-btn-ghost" type="button">').text('Cancel')
        const $done   = $('<button class="ms-picker-btn ms-picker-btn-primary" type="button">').text('Done')
        $cancel.on('click', () => closeMSPicker(false))
        $done.on('click',   () => closeMSPicker(true))
        $right.append($cancel, $done)
        $arow.append($left, $right)

        $panel.append($cols, $arow)
        $overlay.append($panel)

        // Close on backdrop click
        $overlay.on('click', e => { if ($(e.target).is($overlay)) closeMSPicker(false) })

        $('body').append($overlay)
        $msPicker = $panel

        if (cfg.dateType !== 'time') renderCalGrid()
        if (cfg.hasTime) renderClock()
    }

    const closeMSPicker = (confirm) => {
        if (confirm && msPickerInput && msPickerCfg && msPickerSt) {
            const formatted = formatREDCapValue(msPickerSt, msPickerCfg)
            msPickerInput.val(formatted)
            fireDateEvents(msPickerInput)
        }
        $('#ms-picker-overlay').remove()
        $msPicker = null
        msPickerInput = null
    }

    const fireDateEvents = ($inp) => {
        const name = $inp.attr('name')
        $inp.trigger('change')
        try { if (typeof setDataEntryFormValuesChanged === 'function') setDataEntryFormValuesChanged(name) } catch(e){}
        try { if (typeof calculate   === 'function') calculate(name)   } catch(e){}
        try { if (typeof doBranching === 'function') doBranching(name) } catch(e){}
    }

    // ─── Calendar Section ─────────────────────────────────────────────────────

    const buildCalSection = () => {
        const $cal = $('<div class="ms-picker-cal">')

        const $nav  = $('<div class="ms-cal-nav">')
        const $prev = $('<button class="ms-cal-nav-btn" type="button">').html('&#8249;').on('click', () => shiftMonth(-1))
        const $lbl  = $('<span class="ms-cal-month-label">')
        const $next = $('<button class="ms-cal-nav-btn" type="button">').html('&#8250;').on('click', () => shiftMonth(1))
        $nav.append($prev, $lbl, $next)

        const $dows = $('<div class="ms-cal-dow-row">')
        MS_DOW_LABELS.forEach(l => $dows.append($('<div class="ms-cal-dow">').text(l)))

        const $grid = $('<div class="ms-cal-grid" id="ms-cal-grid">')

        const $todayBtn = $('<button class="ms-picker-btn ms-picker-btn-ghost" type="button" style="font-size:11px;padding:3px 10px;margin-top:6px;">').text('Today')
        $todayBtn.on('click', () => { const t=new Date(); msPickerSt.year=t.getFullYear(); msPickerSt.month=t.getMonth(); msPickerSt.day=t.getDate(); renderCalGrid() })

        return $cal.append($nav, $dows, $grid, $todayBtn)
    }

    const renderCalGrid = () => {
        if (!msPickerSt || !$msPicker) return
        const { year, month, day } = msPickerSt
        $msPicker.find('.ms-cal-month-label').text(`${MS_MONTH_NAMES[month]} ${year}`)
        const $grid = $msPicker.find('#ms-cal-grid').empty()
        const today = new Date()
        const firstDay = new Date(year, month, 1).getDay()
        const offset = (firstDay - localeWeekStart + 7) % 7
        const daysInMonth = new Date(year, month+1, 0).getDate()
        const daysInPrev  = new Date(year, month, 0).getDate()
        for (let i=0; i<42; i++) {
            let d, other = false
            if (i < offset)                    { d = daysInPrev - offset + i + 1; other = true }
            else if (i >= offset+daysInMonth)  { d = i - offset - daysInMonth + 1; other = true }
            else                               { d = i - offset + 1 }
            const isToday    = !other && d===today.getDate() && month===today.getMonth() && year===today.getFullYear()
            const isSelected = !other && d===day
            let cls = 'ms-cal-day'
            if (other)      cls += ' ms-day-other'
            if (isToday)    cls += ' ms-day-today'
            if (isSelected) cls += ' ms-day-selected'
            const $cell = $('<div>').addClass(cls).text(d)
            if (!other) $cell.on('click', () => {
                msPickerSt.day = d
                renderCalGrid()
                if (!msPickerCfg.hasTime) closeMSPicker(true) // date-only: auto-confirm
            })
            $grid.append($cell)
        }
    }

    const shiftMonth = (dir) => {
        msPickerSt.month += dir
        if (msPickerSt.month < 0)  { msPickerSt.month = 11; msPickerSt.year-- }
        if (msPickerSt.month > 11) { msPickerSt.month = 0;  msPickerSt.year++ }
        renderCalGrid()
    }

    // ─── Clock Section ────────────────────────────────────────────────────────

    const buildClockSection = () => {
        const $clk = $('<div class="ms-picker-clock">')

        const $tabs    = $('<div class="ms-clock-tabs" id="ms-clock-tabs">')
        const $digital = $('<div class="ms-clock-digital" id="ms-clock-digital">')
        const $ampm    = $('<div class="ms-ampm-row">')
        const $am = $('<button class="ms-ampm-btn" type="button">').text('AM').on('click', () => setPickerAMPM('AM'))
        const $pm = $('<button class="ms-ampm-btn" type="button">').text('PM').on('click', () => setPickerAMPM('PM'))
        $ampm.append($am, $pm)

        const $face = $('<div class="ms-clock-face" id="ms-clock-face">')
        $face.append($('<div class="ms-clock-center">'))
        const $hand = $('<div class="ms-clock-hand" id="ms-clock-hand">').append($('<div class="ms-clock-hand-dot">'))
        $face.append($hand, $('<div id="ms-clock-nums">'))

        $face.on('click', function(e) {
            if ($(e.target).closest('.ms-clock-num').length) return
            const r = this.getBoundingClientRect()
            const cx = r.width/2, cy = r.height/2
            let deg = Math.atan2(e.clientY - r.top - cy, e.clientX - r.left - cx) * (180/Math.PI) + 90
            if (deg < 0) deg += 360
            applyAngle(deg)
        })

        const $nowBtn = $('<button class="ms-picker-btn ms-picker-btn-ghost" type="button" style="font-size:11px;padding:3px 10px;">').text('Now')
        $nowBtn.on('click', () => { const t=new Date(); msPickerSt.hour=t.getHours(); msPickerSt.minute=t.getMinutes(); msPickerSt.second=t.getSeconds(); renderClock() })

        return $clk.append($tabs, $digital, $ampm, $face, $nowBtn)
    }

    const renderClock = () => {
        if (!msPickerSt || !$msPicker) return
        const { hour, minute, second } = msPickerSt
        const h12 = hour % 12 || 12
        const ampm = hour >= 12 ? 'PM' : 'AM'

        // Tabs
        const $tabs = $msPicker.find('#ms-clock-tabs').empty()
        const tabDefs = [['hour','Hr'],['minute','Min']]
        if (msPickerCfg.hasSeconds) tabDefs.push(['second','Sec'])
        tabDefs.forEach(([m, label]) => {
            const $t = $('<button class="ms-clock-tab" type="button">').text(label)
            if (m === msClockMode) $t.addClass('ms-tab-active')
            $t.on('click', () => { msClockMode = m; renderClock() })
            $tabs.append($t)
        })

        // Digital display
        const $dig = $msPicker.find('#ms-clock-digital').empty()
        const mkSeg = (val, mode, formatted) => {
            const $s = $('<span class="ms-clock-seg">').text(formatted)
            if (msClockMode === mode) $s.addClass('ms-seg-active')
            $s.on('click', () => { msClockMode = mode; renderClock() })
            return $s
        }
        const sep = () => $('<span class="ms-clock-sep">').text(':')
        $dig.append(mkSeg(h12, 'hour', String(h12).padStart(2,'0')), sep(), mkSeg(minute, 'minute', String(minute).padStart(2,'0')))
        if (msPickerCfg.hasSeconds) $dig.append(sep(), mkSeg(second, 'second', String(second).padStart(2,'0')))

        // AM/PM
        $msPicker.find('.ms-ampm-btn').eq(0).toggleClass('ms-ampm-active', ampm==='AM')
        $msPicker.find('.ms-ampm-btn').eq(1).toggleClass('ms-ampm-active', ampm==='PM')

        // Clock face
        const $nums = $msPicker.find('#ms-clock-nums').empty()
        const $hand = $msPicker.find('#ms-clock-hand')
        const cx = 96, cy = 96, r = 72
        let count=12, step=30, current, getValue, getLabel

        if (msClockMode === 'hour') {
            current = h12; getValue = i => i===0?12:i; getLabel = i => String(getValue(i)); $hand.css('height','60px')
        } else if (msClockMode === 'minute') {
            current = Math.round(minute/5)*5%60; getValue = i => i*5; getLabel = i => String(getValue(i)).padStart(2,'0'); $hand.css('height','70px')
        } else {
            current = Math.round(second/5)*5%60; getValue = i => i*5; getLabel = i => String(getValue(i)).padStart(2,'0'); $hand.css('height','70px')
        }

        for (let i=0; i<count; i++) {
            const rad = (i*step - 90) * Math.PI / 180
            const x = cx + r*Math.cos(rad), y = cy + r*Math.sin(rad)
            const val = getValue(i)
            const $n = $('<div class="ms-clock-num">').text(getLabel(i)).css({ left:x+'px', top:y+'px' })
            if (val === current) $n.addClass('ms-num-selected')
            $n.on('click', e => { e.stopPropagation(); applyClockVal(val) })
            $nums.append($n)
        }

        const selIdx = msClockMode==='hour' ? (current===12?0:current) : (current/5)
        $hand.css('transform', `translateX(-50%) rotate(${selIdx*step}deg)`)
    }

    const applyAngle = (deg) => {
        if (msClockMode==='hour') {
            const h = Math.round(deg/30) % 12
            const ampm = msPickerSt.hour >= 12 ? 'PM' : 'AM'
            const h12 = h===0?12:h
            msPickerSt.hour = ampm==='PM' ? (h12===12?12:h12+12) : (h12===12?0:h12)
            msPickerSt.hour %= 24
            setTimeout(() => { msClockMode='minute'; renderClock() }, 180)
        } else if (msClockMode==='minute') {
            msPickerSt.minute = Math.round(deg/6) % 60
        } else {
            msPickerSt.second = Math.round(deg/6) % 60
        }
        renderClock()
    }

    const applyClockVal = (val) => {
        if (msClockMode==='hour') {
            const ampm = msPickerSt.hour >= 12 ? 'PM' : 'AM'
            msPickerSt.hour = ampm==='PM' ? (val===12?12:val+12) : (val===12?0:val)
            msPickerSt.hour %= 24
            setTimeout(() => { msClockMode='minute'; renderClock() }, 180)
        } else if (msClockMode==='minute') {
            msPickerSt.minute = val
        } else {
            msPickerSt.second = val
        }
        renderClock()
    }

    const setPickerAMPM = (ap) => {
        const h12 = msPickerSt.hour % 12 || 12
        msPickerSt.hour = ap==='PM' ? (h12===12?12:h12+12) : (h12===12?0:h12)
        msPickerSt.hour %= 24
        renderClock()
    }

    // ─── Intercept REDCap Date Validation & Cleaning ────────────────────────
    const wrapREDCapValidation = () => {
        if (typeof window.redcap_validate === 'function' && !window.redcap_validate._ms_wrapped) {
            const orig_redcap_validate = window.redcap_validate
            window.redcap_validate = function (ob, min, max, returntype, texttype, regexVal, returnFocus, dateDelimiterReturned) {
                if (ob && ob.value && (DATE_FIELD_CONFIGS[texttype] || $(ob).hasClass('ms-date-input'))) {
                    const cfg = DATE_FIELD_CONFIGS[texttype] || getDateFieldConfig($(ob))
                    if (cfg) {
                        const parsed = parseNaturalInput(ob.value, cfg)
                        if (parsed) {
                            ob.value = formatREDCapValue(parsed, cfg)
                            $(ob).val(ob.value)
                        }
                    }
                }
                return orig_redcap_validate.apply(this, arguments)
            }
            window.redcap_validate._ms_wrapped = true
        }

        if (typeof window.clean_datetime === 'function' && !window.clean_datetime._ms_wrapped) {
            const orig_clean_datetime = window.clean_datetime
            window.clean_datetime = function (ob, texttype) {
                if (ob && ob.value && (DATE_FIELD_CONFIGS[texttype] || $(ob).hasClass('ms-date-input'))) {
                    const cfg = DATE_FIELD_CONFIGS[texttype] || getDateFieldConfig($(ob))
                    if (cfg) {
                        const parsed = parseNaturalInput(ob.value, cfg)
                        if (parsed) {
                            ob.value = formatREDCapValue(parsed, cfg)
                            $(ob).val(ob.value)
                            return
                        }
                    }
                }
                return orig_clean_datetime.apply(this, arguments)
            }
            window.clean_datetime._ms_wrapped = true
        }
    }
    wrapREDCapValidation()

    // ─── Field Setup ──────────────────────────────────────────────────────────

    const getDateFieldConfig = ($input) => {
        for (const cls in DATE_FIELD_CONFIGS) {
            if ($input.hasClass(cls)) return { ...DATE_FIELD_CONFIGS[cls], fieldClass: cls }
        }
        return null
    }

    const isTouchDevice = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches

    const initModernDatePickers = () => {
        wrapREDCapValidation()
        const selector = Object.keys(DATE_FIELD_CONFIGS).map(c => `#questiontable input.${c}`).join(', ')
        $(selector).each(function () {
            const $input = $(this)
            if ($input.data('ms-date-init')) return
            $input.data('ms-date-init', true)

            const cfg = getDateFieldConfig($input)
            if (!cfg) return

            // Destroy native jQuery UI widget
            try {
                if (cfg.dateType==='datetime'||cfg.hasSeconds) $input.datetimepicker('destroy')
                else if (cfg.dateType==='date')                $input.datepicker('destroy')
                else if (cfg.dateType==='time')                $input.timepicker('destroy')
            } catch(e) {}

            // Hide native trigger and today-now button
            const $tr = $input.closest('tr')
            $tr.find('.ui-datepicker-trigger').hide()
            $tr.find('.today-now-btn').hide()

            // Determine wrap class and min-width so the full formatted value is always visible
            let wrapClass = 'ms-wrap-date'
            let wrapMinWidth = '175px'
            if (cfg.dateType === 'time') {
                wrapClass = cfg.hasSeconds ? 'ms-wrap-time3' : 'ms-wrap-time'
                wrapMinWidth = cfg.hasSeconds ? '150px' : '125px'
            } else if (cfg.hasSeconds) {
                wrapClass = 'ms-wrap-datetime-seconds'
                wrapMinWidth = '280px'
            } else if (cfg.hasTime) {
                wrapClass = 'ms-wrap-datetime'
                wrapMinWidth = '240px'
            }

            const triggerIcon = (type) => type === 'time'
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

            // Wrap input + trigger button in a flex container so they join flush
            const $wrap = $('<span class="ms-date-wrap ' + wrapClass + '">')
            $wrap.css('minWidth', wrapMinWidth)
            if ($wrap[0] && $wrap[0].style) {
                $wrap[0].style.setProperty('min-width', wrapMinWidth, 'important')
            }
            $input.addClass('ms-date-input')
            if ($input[0] && $input[0].style) {
                $input[0].style.setProperty('border', 'none', 'important')
                $input[0].style.setProperty('border-radius', '0px', 'important')
                $input[0].style.setProperty('box-shadow', 'none', 'important')
                $input[0].style.setProperty('outline', 'none', 'important')
                $input[0].style.setProperty('background', 'transparent', 'important')
                $input[0].style.setProperty('background-color', 'transparent', 'important')
                $input[0].style.setProperty('max-width', 'none', 'important')
                $input[0].style.setProperty('width', '100%', 'important')
                $input[0].style.setProperty('flex', '1 1 auto', 'important')
                $input[0].style.setProperty('min-width', '0', 'important')
            }
            $input.wrap($wrap)

            // Natural language parser on blur and change
            $input.on('blur.mspicker change.mspicker', function() {
                const raw = $(this).val().trim()
                if (!raw) return
                const parsed = parseNaturalInput(raw, cfg)
                if (parsed) {
                    const formatted = formatREDCapValue(parsed, cfg)
                    if (formatted !== raw) {
                        $(this).val(formatted)
                        fireDateEvents($(this))
                    }
                }
            })

            if (isTouchDevice()) {
                // ── Mobile: swap to native OS picker on trigger click ──────────
                const nativeType = cfg.dateType==='time' ? 'time' : (cfg.hasTime ? 'datetime-local' : 'date')
                const $mTrig = $('<button type="button" class="ms-date-trigger" aria-label="Open date picker">').html(triggerIcon(cfg.dateType))
                $mTrig.on('click', () => {
                    const $native = $('<input type="' + nativeType + '">')
                    const st = parseREDCapValue($input.val(), cfg)
                    if (st) {
                        if (nativeType==='date') $native.val(`${String(st.year).padStart(4,'0')}-${String(st.month+1).padStart(2,'0')}-${String(st.day).padStart(2,'0')}`)
                        else if (nativeType==='time') $native.val(`${String(st.hour).padStart(2,'0')}:${String(st.minute).padStart(2,'0')}`)
                        else if (nativeType==='datetime-local') $native.val(`${String(st.year).padStart(4,'0')}-${String(st.month+1).padStart(2,'0')}-${String(st.day).padStart(2,'0')}T${String(st.hour).padStart(2,'0')}:${String(st.minute).padStart(2,'0')}`)
                    }
                    $native.css({ position:'fixed', opacity:'0', pointerEvents:'none', top:0, left:0 }).appendTo('body')
                    $native.on('change', function() {
                        const v = $(this).val()
                        if (!v) { $native.remove(); return }
                        let parsed = null
                        if (nativeType==='date') {
                            const [y,mo,d] = v.split('-')
                            parsed = { year:parseInt(y), month:parseInt(mo)-1, day:parseInt(d), hour:0, minute:0, second:0 }
                        } else if (nativeType==='time') {
                            const [h,mi,s='0'] = v.split(':')
                            parsed = { hour:parseInt(h), minute:parseInt(mi), second:parseInt(s)||0 }
                        } else {
                            const [datePart, tPart='00:00'] = v.split('T')
                            const [y,mo,d] = datePart.split('-')
                            const [h,mi,s='0'] = tPart.split(':')
                            parsed = { year:parseInt(y), month:parseInt(mo)-1, day:parseInt(d), hour:parseInt(h), minute:parseInt(mi), second:parseInt(s)||0 }
                        }
                        if (parsed) {
                            $input.val(formatREDCapValue(parsed, cfg))
                            fireDateEvents($input)
                        }
                        $native.remove()
                    })
                    $native[0].showPicker?.()
                    $native[0].focus?.()
                    setTimeout(() => $native.remove(), 60000)
                })
                $input.parent().append($mTrig)
            } else {
                // ── Desktop: modern custom picker ─────────────────────────────
                const $trig = $('<button type="button" class="ms-date-trigger" aria-label="Open date picker">').html(triggerIcon(cfg.dateType))
                $trig.on('click', () => openMSPicker($input, cfg))
                $input.parent().append($trig)
            }
        })
    }

    // Run after REDCap's initDatePickers() has finished
    setTimeout(initModernDatePickers, 150)

})
