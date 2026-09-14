namespace WooOptionsFic.Builder {
  const { Button, ColorPicker, SelectControl, TextControl, TextareaControl, ToggleControl } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useMemo, useRef, useState } = wp.element;

  const tabs: Array<[WooOptionsFic.InspectorTab, string]> = [
    ['content', __('Content', 'wooptionsfic')],
    ['choices', __('Choices', 'wooptionsfic')],
    ['pricing', __('Pricing', 'wooptionsfic')],
    ['logic', __('Logic', 'wooptionsfic')],
    ['style', __('Style', 'wooptionsfic')],
    ['advanced', __('Advanced', 'wooptionsfic')],
  ];

  const COUNTRY_OPTIONS = [
    { label: 'United States (+1)', value: 'US' },
    { label: 'United Kingdom (+44)', value: 'GB' },
    { label: 'Canada (+1)', value: 'CA' },
    { label: 'Australia (+61)', value: 'AU' },
    { label: 'Germany (+49)', value: 'DE' },
    { label: 'France (+33)', value: 'FR' },
    { label: 'Italy (+39)', value: 'IT' },
    { label: 'Spain (+34)', value: 'ES' },
    { label: 'Netherlands (+31)', value: 'NL' },
    { label: 'Brazil (+55)', value: 'BR' },
    { label: 'India (+91)', value: 'IN' },
    { label: 'China (+86)', value: 'CN' },
    { label: 'Japan (+81)', value: 'JP' },
    { label: 'South Korea (+82)', value: 'KR' },
    { label: 'Mexico (+52)', value: 'MX' },
    { label: 'United Arab Emirates (+971)', value: 'AE' },
    { label: 'Saudi Arabia (+966)', value: 'SA' },
    { label: 'Singapore (+65)', value: 'SG' },
    { label: 'Bangladesh (+880)', value: 'BD' },
    { label: 'Pakistan (+92)', value: 'PK' },
    { label: 'South Africa (+27)', value: 'ZA' },
    { label: 'Turkey (+90)', value: 'TR' },
    { label: 'Sweden (+46)', value: 'SE' },
    { label: 'Switzerland (+41)', value: 'CH' },
    { label: 'Poland (+48)', value: 'PL' },
    { label: 'Argentina (+54)', value: 'AR' },
    { label: 'Belgium (+32)', value: 'BE' },
    { label: 'Austria (+43)', value: 'AT' },
    { label: 'Norway (+47)', value: 'NO' },
    { label: 'Denmark (+45)', value: 'DK' },
    { label: 'Finland (+358)', value: 'FI' },
    { label: 'Ireland (+353)', value: 'IE' },
    { label: 'New Zealand (+64)', value: 'NZ' },
    { label: 'Portugal (+351)', value: 'PT' },
    { label: 'Greece (+30)', value: 'GR' },
    { label: 'Israel (+972)', value: 'IL' },
    { label: 'Hong Kong (+852)', value: 'HK' },
    { label: 'Malaysia (+60)', value: 'MY' },
    { label: 'Philippines (+63)', value: 'PH' },
    { label: 'Indonesia (+62)', value: 'ID' },
    { label: 'Thailand (+66)', value: 'TH' },
    { label: 'Vietnam (+84)', value: 'VN' },
    { label: 'Egypt (+20)', value: 'EG' },
    { label: 'Nigeria (+234)', value: 'NG' },
    { label: 'Kenya (+254)', value: 'KE' },
  ];

  const DATE_FORMAT_OPTIONS = [
    { label: 'MMM DD, YYYY ( Jul 30, 2025 )', value: 'MMM DD, YYYY' },
    { label: 'WordPress Default Date Format', value: 'wp_default' },
    { label: 'DD/MM/YYYY ( 30/07/2025 )', value: 'DD/MM/YYYY' },
    { label: 'MM/DD/YYYY ( 07/30/2025 )', value: 'MM/DD/YYYY' },
    { label: 'YYYY-MM-DD ( 2025-07-30 )', value: 'YYYY-MM-DD' },
    { label: 'DD MMMM, YYYY ( 30 July, 2025 )', value: 'DD MMMM, YYYY' },
    { label: 'D.MM.YYYY ( 30.07.2026 )', value: 'D.MM.YYYY' },
  ];

  const WEEKDAY_OPTIONS = [
    { label: __('Sunday', 'wooptionsfic'), value: 0 },
    { label: __('Monday', 'wooptionsfic'), value: 1 },
    { label: __('Tuesday', 'wooptionsfic'), value: 2 },
    { label: __('Wednesday', 'wooptionsfic'), value: 3 },
    { label: __('Thursday', 'wooptionsfic'), value: 4 },
    { label: __('Friday', 'wooptionsfic'), value: 5 },
    { label: __('Saturday', 'wooptionsfic'), value: 6 },
  ];

  const MONTHLY_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
    label: `${__('Day', 'wooptionsfic')} ${i + 1}`,
    value: i + 1,
  }));

  function DatePickerPopup(props: {
    value?: string;
    onSelect: (dateStr: string) => void;
    onClose: () => void;
  }): any {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const initialDate = useMemo(() => {
      if (props.value && /^\d{4}-\d{2}-\d{2}$/.test(props.value)) {
        const parts = props.value.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      return new Date();
    }, [props.value]);

    const [year, setYear] = useState(initialDate.getFullYear());
    const [month, setMonth] = useState(initialDate.getMonth());

    useEffect(() => {
      const handleDown = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          props.onClose();
        }
      };
      document.addEventListener('mousedown', handleDown);
      return () => document.removeEventListener('mousedown', handleDown);
    }, [props.onClose]);

    const prevMonth = (e: any) => {
      e.stopPropagation();
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    };

    const nextMonth = (e: any) => {
      e.stopPropagation();
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mStr = String(prevM + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, isCurrentMonth: false, dateStr: `${prevY}-${mStr}-${dStr}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, isCurrentMonth: true, dateStr: `${year}-${mStr}-${dStr}` });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const mStr = String(nextM + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        cells.push({ day: d, isCurrentMonth: false, dateStr: `${nextY}-${mStr}-${dStr}` });
      }
    }

    return (
      <div className="wof-datepicker-popover" ref={containerRef}>
        <div className="wof-cal-pop-header">
          <button type="button" className="wof-cal-nav-btn" onClick={prevMonth} aria-label={__('Previous month', 'wooptionsfic')}>
            ‹
          </button>
          <span className="wof-cal-pop-title">{monthNames[month]} {year}</span>
          <button type="button" className="wof-cal-nav-btn" onClick={nextMonth} aria-label={__('Next month', 'wooptionsfic')}>
            ›
          </button>
        </div>
        <div className="wof-cal-pop-weekdays">
          {weekDays.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>
        <div className="wof-cal-pop-days">
          {cells.map((cell, idx) => {
            const isSelected = props.value === cell.dateStr;
            return (
              <button
                type="button"
                key={idx}
                className={WooOptionsFic.Utils.classNames(
                  'wof-cal-pop-day',
                  !cell.isCurrentMonth && 'is-other-month',
                  isSelected && 'is-selected'
                )}
                onClick={(e: any) => {
                  e.stopPropagation();
                  props.onSelect(cell.dateStr);
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function DatePickerField(props: {
    value?: string;
    placeholder?: string;
    onChange: (val: string) => void;
  }): any {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="wof-datepicker-field-wrap">
        <button
          type="button"
          className={WooOptionsFic.Utils.classNames('wof-datepicker-field-trigger', isOpen && 'is-open')}
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={WooOptionsFic.Utils.classNames('wof-datepicker-field-val', !props.value && 'is-placeholder')}>
            {props.value || props.placeholder || __('Select date...', 'wooptionsfic')}
          </span>
          {props.value ? (
            <span
              role="button"
              tabIndex={0}
              className="wof-datepicker-field-clear"
              title={__('Clear date', 'wooptionsfic')}
              onClick={(e: any) => {
                e.stopPropagation();
                props.onChange('');
              }}
            >
              ×
            </span>
          ) : null}
        </button>
        {isOpen ? (
          <DatePickerPopup
            value={props.value}
            onSelect={(val) => {
              props.onChange(val);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  interface MultiSelectOption {
    label: string;
    value: string | number;
  }

  function MultiSelectDropdown(props: {
    placeholder: string;
    options: MultiSelectOption[];
    selectedValues: Array<string | number>;
    onChange: (newValues: any[]) => void;
  }): any {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const handleDown = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleDown);
      return () => document.removeEventListener('mousedown', handleDown);
    }, []);

    const selectedLabels = useMemo(() => {
      return props.options
        .filter((opt) => props.selectedValues.includes(opt.value))
        .map((opt) => opt.label);
    }, [props.options, props.selectedValues]);

    const displayText = useMemo(() => {
      if (selectedLabels.length === 0) return '';
      if (selectedLabels.length <= 3) return selectedLabels.join(', ');
      return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
    }, [selectedLabels]);

    const toggleOption = (optVal: string | number) => {
      if (props.selectedValues.includes(optVal)) {
        props.onChange(props.selectedValues.filter((v) => v !== optVal));
      } else {
        props.onChange([...props.selectedValues, optVal]);
      }
    };

    const selectAll = () => {
      props.onChange(props.options.map((o) => o.value));
    };

    const clearAll = () => {
      props.onChange([]);
    };

    return (
      <div className="wof-multiselect-container" ref={containerRef}>
        <button
          type="button"
          className={WooOptionsFic.Utils.classNames('wof-multiselect-trigger', isOpen && 'is-open')}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={WooOptionsFic.Utils.classNames('wof-multiselect-display', !displayText && 'is-placeholder')}>
            {displayText || props.placeholder}
          </span>
          <svg
            className={WooOptionsFic.Utils.classNames('wof-multiselect-chevron', isOpen && 'is-open')}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen ? (
          <div className="wof-multiselect-dropdown">
            <div className="wof-multiselect-header">
              <button type="button" className="wof-multiselect-link-btn" onClick={selectAll}>
                {__('Select All', 'wooptionsfic')}
              </button>
              <button type="button" className="wof-multiselect-link-btn" onClick={clearAll}>
                {__('Clear', 'wooptionsfic')}
              </button>
            </div>
            <div className="wof-multiselect-options" role="listbox">
              {props.options.map((opt) => {
                const isChecked = props.selectedValues.includes(opt.value);
                return (
                  <label key={opt.value} className={WooOptionsFic.Utils.classNames('wof-multiselect-item', isChecked && 'is-checked')}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function DateFieldInspector(props: {
    field: WooOptionsFic.FieldDefinition;
    update: (patch: Partial<WooOptionsFic.FieldDefinition>) => void;
  }): any {
    const { field, update } = props;
    const [showAddDatePicker, setShowAddDatePicker] = useState(false);

    return (
      <div className="wof-datetime-settings-wrap">
        {/* TYPE selector */}
        <div className="wof-field-width-setting wof-datetime-type-setting">
          <span className="wof-field-width-label">{__('Type', 'wooptionsfic')}</span>
          <div className="wof-field-width-group" role="radiogroup" aria-label={__('Type', 'wooptionsfic')}>
            {([
              { label: __('Date', 'wooptionsfic'), value: 'date' },
              { label: __('Date & Time', 'wooptionsfic'), value: 'datetime' },
              { label: __('Time', 'wooptionsfic'), value: 'time' },
            ] as const).map((t) => {
              const isSelected = (field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) === t.value;
              return (
                <button
                  type="button"
                  key={t.value}
                  role="radio"
                  aria-checked={isSelected}
                  className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                  onClick={() => update({ dateTimeType: t.value })}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Settings Box (visible for 'date' and 'datetime') */}
        {(field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) !== 'time' ? (
          <div className="wof-datetime-box">
            <SelectControl
              label={__('Date Format', 'wooptionsfic')}
              value={field.dateFormat ?? 'DD/MM/YYYY'}
              options={DATE_FORMAT_OPTIONS}
              onChange={(dateFormat: string) => update({ dateFormat })}
            />

            {/* Min Date (Stacked full width for comfortable spacing) */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label">{__('Min Date', 'wooptionsfic')}</span>
              <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
                <div className="wof-field-width-group" role="radiogroup" aria-label={__('Min Date', 'wooptionsfic')}>
                  {([
                    { label: __('None', 'wooptionsfic'), value: 'none' },
                    { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                    { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                  ] as const).map((m) => {
                    const isSelected = (field.minDateType || 'none') === m.value;
                    return (
                      <button
                        type="button"
                        key={m.value}
                        role="radio"
                        aria-checked={isSelected}
                        className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                        onClick={() => update({ minDateType: m.value })}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {field.minDateType === 'custom' ? (
                <div style={{ marginTop: '8px' }}>
                  <DatePickerField
                    value={field.minDateCustom ?? ''}
                    placeholder={__('Select min date...', 'wooptionsfic')}
                    onChange={(minDateCustom: string) => update({ minDateCustom })}
                  />
                </div>
              ) : null}
            </div>

            {/* Max Date (Stacked full width for comfortable spacing) */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label">{__('Max Date', 'wooptionsfic')}</span>
              <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
                <div className="wof-field-width-group" role="radiogroup" aria-label={__('Max Date', 'wooptionsfic')}>
                  {([
                    { label: __('None', 'wooptionsfic'), value: 'none' },
                    { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                    { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                  ] as const).map((m) => {
                    const isSelected = (field.maxDateType || 'none') === m.value;
                    return (
                      <button
                        type="button"
                        key={m.value}
                        role="radio"
                        aria-checked={isSelected}
                        className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                        onClick={() => update({ maxDateType: m.value })}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {field.maxDateType === 'custom' ? (
                <div style={{ marginTop: '8px' }}>
                  <DatePickerField
                    value={field.maxDateCustom ?? ''}
                    placeholder={__('Select max date...', 'wooptionsfic')}
                    onChange={(maxDateCustom: string) => update({ maxDateCustom })}
                  />
                </div>
              ) : null}
            </div>

            <ToggleControl
              label={__('Disable Today', 'wooptionsfic')}
              checked={Boolean(field.disableToday)}
              onChange={(disableToday: boolean) => update({ disableToday })}
            />

            <TextControl
              label={__('Disable Next N Days', 'wooptionsfic')}
              type="number"
              min={0}
              value={String(field.disableNextNDays ?? 0)}
              help={__('Disable N days after today (e.g. 3 disables tomorrow, day after tomorrow, and one more)', 'wooptionsfic')}
              onChange={(val: string) => update({ disableNextNDays: Math.max(0, parseInt(val, 10) || 0) })}
            />

            {/* Disable Specific Dates with Custom Datepicker Popover */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label" style={{ marginBottom: '8px' }}>{__('Disable Specific Dates', 'wooptionsfic')}</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  className="wof-btn-add-date"
                  onClick={() => setShowAddDatePicker(!showAddDatePicker)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  {__('Add Date', 'wooptionsfic')}
                </button>
                {showAddDatePicker ? (
                  <DatePickerPopup
                    onSelect={(dateStr) => {
                      const current = Array.isArray(field.disabledDates) ? [...field.disabledDates] : [];
                      if (!current.includes(dateStr)) {
                        update({ disabledDates: [...current, dateStr] });
                      }
                      setShowAddDatePicker(false);
                    }}
                    onClose={() => setShowAddDatePicker(false)}
                  />
                ) : null}
              </div>
              {Array.isArray(field.disabledDates) && field.disabledDates.length > 0 ? (
                <div className="wof-disabled-dates-list">
                  {field.disabledDates.map((dateVal, idx) => (
                    <div key={idx} className="wof-disabled-date-item">
                      <div className="wof-disabled-date-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>{dateVal}</span>
                      </div>
                      <button
                        type="button"
                        className="wof-disabled-date-delete-btn"
                        title={__('Remove date', 'wooptionsfic')}
                        onClick={() => {
                          const next = [...(field.disabledDates ?? [])];
                          next.splice(idx, 1);
                          update({ disabledDates: next });
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Disable Weekdays Multiselect */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label">{__('Disable Weekdays', 'wooptionsfic')}</span>
              <MultiSelectDropdown
                placeholder={__('Select weekdays to disable...', 'wooptionsfic')}
                options={WEEKDAY_OPTIONS}
                selectedValues={Array.isArray(field.disabledWeekdays) ? field.disabledWeekdays : []}
                onChange={(selected) => update({ disabledWeekdays: selected.map(Number) })}
              />
            </div>

            {/* Disable Monthly Days Multiselect */}
            <div style={{ marginBottom: '4px' }}>
              <span className="wof-datetime-label">{__('Disable Monthly Days', 'wooptionsfic')}</span>
              <MultiSelectDropdown
                placeholder={__('Select monthly days to disable...', 'wooptionsfic')}
                options={MONTHLY_DAY_OPTIONS}
                selectedValues={
                  String(field.disabledMonthlyDays || '')
                    .split(',')
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !isNaN(n))
                }
                onChange={(selected) => {
                  const sorted = [...selected].map(Number).sort((a, b) => a - b);
                  update({ disabledMonthlyDays: sorted.join(', ') });
                }}
              />
            </div>
          </div>
        ) : null}

        {/* Time Settings Box (visible for 'time' and 'datetime') */}
        {(field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) !== 'date' ? (
          <div className="wof-datetime-box">
            {/* Time Range Min */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label">{__('Time Range (Min)', 'wooptionsfic')}</span>
              {renderTimeInput(
                field.minTime || '12:00 AM',
                field.timeFormat || '12',
                (val: string) => update({ minTime: val })
              )}
            </div>

            {/* Time Range Max */}
            <div style={{ marginBottom: '14px' }}>
              <span className="wof-datetime-label">{__('Time Range (Max)', 'wooptionsfic')}</span>
              {renderTimeInput(
                field.maxTime || '12:00 PM',
                field.timeFormat || '12',
                (val: string) => update({ maxTime: val })
              )}
            </div>

            {/* Time Format */}
            <div>
              <span className="wof-datetime-label">{__('Time Format', 'wooptionsfic')}</span>
              <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
                <div className="wof-field-width-group" role="radiogroup" aria-label={__('Time Format', 'wooptionsfic')}>
                  {([
                    { label: __('12 Hours', 'wooptionsfic'), value: '12' },
                    { label: __('24 Hours', 'wooptionsfic'), value: '24' },
                  ] as const).map((fmt) => {
                    const isSelected = (field.timeFormat || '12') === fmt.value;
                    return (
                      <button
                        type="button"
                        key={fmt.value}
                        role="radio"
                        aria-checked={isSelected}
                        className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                        onClick={() => update({ timeFormat: fmt.value })}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderTimeInput(value: string, format: '12' | '24', onChange: (val: string) => void) {
    const is12 = format === '12';
    const match = (value || '').match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
    let hours = match ? match[1].padStart(2, '0') : '12';
    let minutes = match ? match[2].padStart(2, '0') : '00';
    let meridiem = (match && match[3] ? match[3].toUpperCase() : 'AM') as 'AM' | 'PM';

    const commit = (h: string, m: string, mer: 'AM' | 'PM') => {
      onChange(is12 ? `${h}:${m} ${mer}` : `${h}:${m}`);
    };

    return (
      <div className="wof-time-input-group">
        <div className="wof-time-spinner-box">
          <input
            type="text"
            maxLength={2}
            value={hours}
            aria-label={__('Hours', 'wooptionsfic')}
            onChange={(e: any) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
              commit(v.padStart(2, '0'), minutes, meridiem);
            }}
          />
          <span className="wof-time-colon">:</span>
          <input
            type="text"
            maxLength={2}
            value={minutes}
            aria-label={__('Minutes', 'wooptionsfic')}
            onChange={(e: any) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
              commit(hours, v.padStart(2, '0'), meridiem);
            }}
          />
        </div>
        {is12 ? (
          <div className="wof-meridiem-group">
            <button
              type="button"
              className={WooOptionsFic.Utils.classNames('wof-meridiem-btn', meridiem === 'AM' && 'is-active')}
              onClick={() => commit(hours, minutes, 'AM')}
            >
              AM
            </button>
            <button
              type="button"
              className={WooOptionsFic.Utils.classNames('wof-meridiem-btn', meridiem === 'PM' && 'is-active')}
              onClick={() => commit(hours, minutes, 'PM')}
            >
              PM
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  function normalizeHexColor(value: string, fallback = '#5B4FF5'): string {
    const color = String(value || '').trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(color) ? color : fallback;
  }

  function ChoiceColorControl(props: {
    color: string;
    label?: string;
    onChange: (color: string) => void;
  }): any {
    const [open, setOpen] = useState(false);
    const color = normalizeHexColor(props.color);
    return <div className={WooOptionsFic.Utils.classNames('wof-choice-color-control', open && 'is-open')}>
      <span className="wof-choice-color-control__label">{props.label ?? __('Swatch color', 'wooptionsfic')}</span>
      <div className="wof-choice-color-control__row">
        <button type="button" className="wof-choice-color-control__trigger" onClick={() => setOpen((value: boolean) => !value)} aria-expanded={open}>
          <span style={{ background: color }} aria-hidden="true" />
          <code>{color}</code>
          <WooOptionsFic.Components.Dashicon name="arrow-down-alt2" />
        </button>
        <TextControl
          label={__('Hex color', 'wooptionsfic')}
          hideLabelFromVision
          value={color}
          onChange={(next: string) => {
            if (/^#[0-9a-f]{6}$/i.test(next.trim())) props.onChange(next.trim().toUpperCase());
          }}
        />
      </div>
      {open ? <div className="wof-choice-color-control__picker">
        <ColorPicker
          color={color}
          enableAlpha={false}
          onChange={(next: string) => props.onChange(normalizeHexColor(next, color))}
        />
      </div> : null}
    </div>;
  }

  function ChoiceMediaControl(props: {
    choice: WooOptionsFic.ChoiceDefinition;
    required: boolean;
    onChange: (patch: Partial<WooOptionsFic.ChoiceDefinition>) => void;
  }): any {
    const [previewUrl, setPreviewUrl] = useState(props.choice.imageUrl ?? '');

    useEffect(() => {
      let active = true;
      setPreviewUrl(props.choice.imageUrl ?? '');
      const attachmentId = Number(props.choice.imageId ?? 0);
      if (!attachmentId || !wp.media?.attachment) return () => { active = false; };
      const attachment = wp.media.attachment(attachmentId);
      const update = () => {
        if (!active) return;
        const data = attachment.toJSON?.() ?? {};
        const source = data.sizes?.thumbnail?.url ?? data.sizes?.medium?.url ?? data.url ?? '';
        if (source) setPreviewUrl(String(source));
      };
      update();
      const request = attachment.fetch?.();
      if (request) Promise.resolve(request).then(update).catch(() => undefined);
      return () => { active = false; };
    }, [props.choice.imageId, props.choice.imageUrl]);

    const openPicker = () => {
      if (!wp.media) return;
      const frame = wp.media({
        title: __('Choose a choice image', 'wooptionsfic'),
        button: { text: __('Use this image', 'wooptionsfic') },
        library: { type: 'image' },
        multiple: false,
      });
      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON();
        const imageId = Math.max(0, Number(attachment.id ?? 0));
        const imageUrl = String(attachment.sizes?.thumbnail?.url ?? attachment.sizes?.medium?.url ?? attachment.url ?? '');
        if (!imageId) return;
        setPreviewUrl(imageUrl);
        props.onChange({ imageId, imageUrl });
      });
      frame.open();
    };

    const hasImage = Number(props.choice.imageId ?? 0) > 0 || Boolean(previewUrl);
    return (
      <div className="wof-media-control">
        <button type="button" className={`wof-media-control__preview ${hasImage ? 'has-image' : ''}`} onClick={openPicker}>
          {previewUrl ? <img src={previewUrl} alt="" /> : <span className="dashicons dashicons-format-image" aria-hidden="true" />}
        </button>
        <div>
          <strong>{props.required ? __('Swatch image', 'wooptionsfic') : __('Choice image (optional)', 'wooptionsfic')}</strong>
          <small>{props.choice.imageId ? `Media #${props.choice.imageId}` : __('No image selected', 'wooptionsfic')}</small>
          <div className="wof-media-control__actions">
            <Button variant="secondary" onClick={openPicker}>{hasImage ? __('Replace', 'wooptionsfic') : __('Choose image', 'wooptionsfic')}</Button>
            {hasImage ? (
              <Button
                variant="tertiary"
                isDestructive
                onClick={() => {
                  setPreviewUrl('');
                  props.onChange({ imageId: 0, imageUrl: '' });
                }}
              >
                {__('Remove', 'wooptionsfic')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function ChoiceEditor(props: { field: WooOptionsFic.FieldDefinition; onChange: (field: WooOptionsFic.FieldDefinition) => void }): any {
    const choices = props.field.choices ?? [];
    const updateChoice = (uuid: string, patch: Partial<WooOptionsFic.ChoiceDefinition>) => props.onChange({
      ...props.field,
      choices: choices.map((choice) => choice.uuid === uuid ? { ...choice, ...patch } : choice),
    });
    const removeChoice = (uuid: string) => props.onChange({
      ...props.field,
      choices: choices.filter((choice) => choice.uuid !== uuid),
    });
    const addChoice = () => props.onChange({
      ...props.field,
      choices: [...choices, WooOptionsFic.FieldFactory.choice(`Choice ${choices.length + 1}`, choices.length)],
    });

    if (!props.field.choices) return <p className="wof-muted-note">{__('This element has no choices.', 'wooptionsfic')}</p>;

    return (
      <div className="wof-choice-editor-list">
        {/* Display Direction option for Button Choices (segmented) */}
        {props.field.type === 'segmented' ? (
          <div className="wof-field-width-setting">
            <span className="wof-field-width-label">{__('Display Direction', 'wooptionsfic')}</span>
            <div className="wof-field-width-group" role="radiogroup" aria-label={__('Display Direction', 'wooptionsfic')}>
              {(['vertical', 'horizontal'] as const).map((dir) => {
                const isSelected = (props.field.displayDirection || 'horizontal') === dir;
                return (
                  <button
                    type="button"
                    key={dir}
                    role="radio"
                    aria-checked={isSelected}
                    className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                    onClick={() => props.onChange({ ...props.field, displayDirection: dir })}
                  >
                    {dir === 'horizontal' ? __('Horizontal', 'wooptionsfic') : __('Vertical', 'wooptionsfic')}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Columns and Image Style for Radio, Checkbox Group, and Dropdown */}
        {['radio', 'checkbox_group'].includes(props.field.type) ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
              <span className="wof-field-width-label">{__('Columns', 'wooptionsfic')}</span>
              <div className="wof-field-width-group" role="radiogroup" aria-label={__('Columns', 'wooptionsfic')}>
                {([
                  { label: __('One', 'wooptionsfic'), value: 'one' },
                  { label: __('Two', 'wooptionsfic'), value: 'two' },
                ] as const).map((col) => {
                  const isSelected = (props.field.columns || 'one') === col.value;
                  return (
                    <button
                      type="button"
                      key={col.value}
                      role="radio"
                      aria-checked={isSelected}
                      className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                      onClick={() => props.onChange({ ...props.field, columns: col.value })}
                    >
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
              <span className="wof-field-width-label">{__('Image Style', 'wooptionsfic')}</span>
              <div className="wof-field-width-group" role="radiogroup" aria-label={__('Image Style', 'wooptionsfic')}>
                {([
                  { label: __('Normal', 'wooptionsfic'), value: 'normal' },
                  { label: __('Circle', 'wooptionsfic'), value: 'circle' },
                ] as const).map((st) => {
                  const isSelected = (props.field.imageStyle || 'normal') === st.value;
                  return (
                    <button
                      type="button"
                      key={st.value}
                      role="radio"
                      aria-checked={isSelected}
                      className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                      onClick={() => props.onChange({ ...props.field, imageStyle: st.value })}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : props.field.type === 'select' ? (
          <div style={{ marginBottom: '18px' }}>
            <div className="wof-field-width-setting" style={{ marginBottom: 0 }}>
              <span className="wof-field-width-label">{__('Image Style', 'wooptionsfic')}</span>
              <div className="wof-field-width-group" role="radiogroup" aria-label={__('Image Style', 'wooptionsfic')}>
                {([
                  { label: __('Normal', 'wooptionsfic'), value: 'normal' },
                  { label: __('Circle', 'wooptionsfic'), value: 'circle' },
                ] as const).map((st) => {
                  const isSelected = (props.field.imageStyle || 'normal') === st.value;
                  return (
                    <button
                      type="button"
                      key={st.value}
                      role="radio"
                      aria-checked={isSelected}
                      className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                      onClick={() => props.onChange({ ...props.field, imageStyle: st.value })}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {props.field.type === 'image_swatch' ? <div className="wof-image-swatch-behavior">
          <ToggleControl
            label={__('Update product image on selection', 'wooptionsfic')}
            help={__('Replace the main WooCommerce product image with the selected swatch image.', 'wooptionsfic')}
            checked={Boolean(props.field.updateProductImage)}
            onChange={(updateProductImage: boolean) => props.onChange({ ...props.field, updateProductImage })}
          />
        </div> : null}
        {choices.map((choice, index) => (
          <article key={choice.uuid}>
            <header>
              <WooOptionsFic.Components.GripIcon />
              <strong>{__('Choice', 'wooptionsfic')} {index + 1}</strong>
              <button type="button" onClick={() => removeChoice(choice.uuid)}><WooOptionsFic.Components.Dashicon name="trash" /></button>
            </header>
            <TextControl label={__('Label', 'wooptionsfic')} value={choice.label} onChange={(label: string) => updateChoice(choice.uuid, { label })} />
            <TextControl label={__('Description', 'wooptionsfic')} value={choice.description} onChange={(description: string) => updateChoice(choice.uuid, { description })} />
            {props.field.type === 'color_swatch' ? (
              <ChoiceColorControl color={choice.color || '#5B4FF5'} onChange={(color: string) => updateChoice(choice.uuid, { color })} />
            ) : null}
            {/* Note: 'color_swatch' is excluded so 'Choice image (optional)' is removed from color swatches */}
            {['image_swatch', 'product', 'radio', 'checkbox_group', 'segmented', 'select'].includes(props.field.type) ? (
              <ChoiceMediaControl
                choice={choice}
                required={props.field.type === 'image_swatch'}
                onChange={(patch) => updateChoice(choice.uuid, patch)}
              />
            ) : null}
            <div className="wof-choice-pricing-row">
              <SelectControl
                label={__('Price type', 'wooptionsfic')}
                value={choice.pricing.strategy}
                options={[
                  { label: __('No adjustment', 'wooptionsfic'), value: 'none' },
                  { label: __('Fixed amount', 'wooptionsfic'), value: 'fixed' },
                  { label: __('Percentage', 'wooptionsfic'), value: 'percentage' },
                ]}
                onChange={(strategy: WooOptionsFic.PricingDefinition['strategy']) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, strategy } })}
              />
              {choice.pricing.strategy === 'percentage' ? (
                <TextControl label={__('Percent', 'wooptionsfic')} type="number" value={choice.pricing.percent} onChange={(percent: string) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, percent } })} />
              ) : choice.pricing.strategy !== 'none' ? (
                <TextControl label={__('Amount', 'wooptionsfic')} type="number" value={choice.pricing.amount} onChange={(amount: string) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, amount } })} />
              ) : null}
            </div>
            <ToggleControl label={__('Default choice', 'wooptionsfic')} checked={choice.default} onChange={(value: boolean) => updateChoice(choice.uuid, { default: value })} />
            <ToggleControl label={__('Disable choice', 'wooptionsfic')} checked={choice.disabled} onChange={(value: boolean) => updateChoice(choice.uuid, { disabled: value })} />
          </article>
        ))}
        <Button variant="secondary" onClick={addChoice}><WooOptionsFic.Components.Dashicon name="plus-alt2" />{__('Add choice', 'wooptionsfic')}</Button>
      </div>
    );
  }

  function PricingPanel(props: { field: WooOptionsFic.FieldDefinition; onChange: (field: WooOptionsFic.FieldDefinition) => void }): any {
    const pricing = props.field.pricing ?? WooOptionsFic.FieldFactory.emptyPricing();
    const update = (patch: Partial<WooOptionsFic.PricingDefinition>) => props.onChange({ ...props.field, pricing: { ...pricing, ...patch } });
    return <div><SelectControl label={__('Pricing strategy', 'wooptionsfic')} value={pricing.strategy} options={[{ label: __('No price change', 'wooptionsfic'), value: 'none' }, { label: __('Fixed amount', 'wooptionsfic'), value: 'fixed' }, { label: __('Percentage', 'wooptionsfic'), value: 'percentage' }, { label: __('Per character', 'wooptionsfic'), value: 'per_character' }, { label: __('Per unit', 'wooptionsfic'), value: 'per_unit' }, { label: __('Setup fee', 'wooptionsfic'), value: 'setup' }, { label: __('Formula', 'wooptionsfic'), value: 'formula' }]} onChange={(strategy: WooOptionsFic.PricingDefinition['strategy']) => update({ strategy })} /><SelectControl label={__('Price mode', 'wooptionsfic')} value={pricing.mode} options={[{ label: __('Add to product price', 'wooptionsfic'), value: 'adjustment' }, { label: __('Replace unit price', 'wooptionsfic'), value: 'unit_price' }]} onChange={(mode: WooOptionsFic.PricingDefinition['mode']) => update({ mode })} />{pricing.strategy === 'percentage' ? <TextControl label={__('Percentage', 'wooptionsfic')} type="number" value={pricing.percent} onChange={(percent: string) => update({ percent })} /> : pricing.strategy === 'formula' ? <TextareaControl label={__('Formula expression', 'wooptionsfic')} value={pricing.expression ?? '0'} onChange={(expression: string) => update({ expression })} help={__('Use server-supported FIELD("uuid") and arithmetic expressions.', 'wooptionsfic')} /> : pricing.strategy !== 'none' ? <TextControl label={__('Amount', 'wooptionsfic')} type="number" value={pricing.amount} onChange={(amount: string) => update({ amount })} /> : null}</div>;
  }

  export function Inspector(props: {
    field: WooOptionsFic.FieldDefinition | null;
    document: WooOptionsFic.OptionSetDefinition;
    tab: WooOptionsFic.InspectorTab;
    onTabChange: (tab: WooOptionsFic.InspectorTab) => void;
    onFieldChange: (field: WooOptionsFic.FieldDefinition) => void;
    onDocumentChange: (patch: Partial<WooOptionsFic.OptionSetDefinition>) => void;
    onDuplicate: () => void;
    onDelete: () => void;
  }): any {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);
    const updateScroll = () => {
      const element = scrollerRef.current;
      if (!element) return;
      setCanLeft(element.scrollLeft > 4);
      setCanRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
    };
    useEffect(() => {
      updateScroll();
      window.addEventListener('resize', updateScroll);
      const element = scrollerRef.current;
      element?.addEventListener('scroll', updateScroll, { passive: true });
      return () => { window.removeEventListener('resize', updateScroll); element?.removeEventListener('scroll', updateScroll); };
    }, [props.field]);

    if (!props.field) return <aside className="wof-builder-inspector"><div className="wof-builder-pane__heading"><div><span className="wof-eyebrow">{__('Style', 'wooptionsfic')}</span><h2>{__('Option set styling', 'wooptionsfic')}</h2></div></div><div className="wof-inspector-body"><section className="wof-inspector-section"><StyleStudio document={props.document} onChange={props.onDocumentChange} /></section></div></aside>;
    const field = props.field;
    const update = (patch: Partial<WooOptionsFic.FieldDefinition>) => props.onFieldChange({ ...field, ...patch });
    const visibleTabs = tabs.filter(([tab]) => tab !== 'choices' || Boolean(field.choices));

    return <aside className="wof-builder-inspector">
      <div className="wof-builder-pane__heading">
        <div>
          <span className="wof-eyebrow">{window.WooOptionsFicAdmin.fieldTypes[field.type]?.label ?? field.type}</span>
          <h2>{field.label}</h2>
        </div>
        <div className="wof-inspector-heading-actions">
          <button type="button" onClick={props.onDuplicate} aria-label={__('Duplicate field', 'wooptionsfic')} title={__('Duplicate', 'wooptionsfic')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>
          <button type="button" className="is-destructive" onClick={props.onDelete} aria-label={__('Delete field', 'wooptionsfic')} title={__('Delete', 'wooptionsfic')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
          </button>
        </div>
      </div>
      <div className="wof-inspector-tabs-shell">
        {canLeft ? <button type="button" className="wof-inspector-tabs-arrow is-left" onClick={() => scrollerRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}><WooOptionsFic.Components.Dashicon name="arrow-left-alt2" /></button> : null}
        <div className="wof-inspector-tabs" ref={scrollerRef}>
          {visibleTabs.map(([tab, label]) => (
            <button
              type="button"
              key={tab}
              className={props.tab === tab ? 'is-active' : ''}
              onClick={(event: Event) => {
                props.onTabChange(tab);
                (event.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {canRight ? <button type="button" className="wof-inspector-tabs-arrow is-right" onClick={() => scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}><WooOptionsFic.Components.Dashicon name="arrow-right-alt2" /></button> : null}
      </div>
      <div className="wof-inspector-body">
        <section className="wof-inspector-section">
          {props.tab === 'content' ? (
            <>
              <TextControl label={__('Label', 'wooptionsfic')} value={field.label} onChange={(label: string) => update({ label })} />
              <TextareaControl label={__('Description', 'wooptionsfic')} value={field.description} onChange={(description: string) => update({ description })} />

              {/* Block Width options for every block */}
              <div className="wof-field-width-setting">
                <span className="wof-field-width-label">{__('Width', 'wooptionsfic')}</span>
                <div className="wof-field-width-group" role="radiogroup" aria-label={__('Width', 'wooptionsfic')}>
                  {(['33%', '50%', '66%', '100%'] as const).map((w) => {
                    const isSelected = (field.width || '100%') === w;
                    return (
                      <button
                        type="button"
                        key={w}
                        role="radio"
                        aria-checked={isSelected}
                        className={WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active')}
                        onClick={() => update({ width: w })}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Choice Item Dimensions & Style */}
              {Boolean(field.choices) && !['radio', 'checkbox_group', 'select', 'font'].includes(field.type) ? (
                <div className="wof-choice-dimensions-box" style={{ padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)', marginBottom: '16px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>{__('Choice Item Dimensions & Style', 'wooptionsfic')}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <TextControl
                      label={__('Width (px)', 'wooptionsfic')}
                      type="number"
                      min={0}
                      value={String(field.choiceWidth ?? '')}
                      placeholder="Auto"
                      onChange={(choiceWidth: string) => update({ choiceWidth })}
                    />
                    <TextControl
                      label={__('Height (px)', 'wooptionsfic')}
                      type="number"
                      min={0}
                      value={String(field.choiceHeight ?? '')}
                      placeholder="Auto"
                      onChange={(choiceHeight: string) => update({ choiceHeight })}
                    />
                    <TextControl
                      label={__('Radius (px)', 'wooptionsfic')}
                      type="number"
                      min={0}
                      value={String(field.choiceBorderRadius ?? '')}
                      placeholder="Default"
                      onChange={(choiceBorderRadius: string) => update({ choiceBorderRadius })}
                    />
                  </div>
                </div>
              ) : null}

              {'placeholder' in field ? <TextControl label={__('Placeholder', 'wooptionsfic')} value={field.placeholder ?? ''} onChange={(placeholder: string) => update({ placeholder })} /> : null}

              {/* Phone / Telephone Flag Style & Default Country */}
              {field.type === 'tel' ? (
                <div className="wof-phone-settings" style={{ marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' }}>
                  <SelectControl
                    label={__('Flag Style', 'wooptionsfic')}
                    value={field.flagStyle ?? 'number_only'}
                    options={[
                      { label: __('Number Only', 'wooptionsfic'), value: 'number_only' },
                      { label: __('Number Only & Flag', 'wooptionsfic'), value: 'number_flag' },
                      { label: __('Number Only & Flag and Dial Code', 'wooptionsfic'), value: 'number_flag_dialcode' },
                    ]}
                    onChange={(flagStyle: 'number_only' | 'number_flag' | 'number_flag_dialcode') => update({ flagStyle })}
                  />
                  {(field.flagStyle === 'number_flag' || field.flagStyle === 'number_flag_dialcode') ? (
                    <SelectControl
                      label={__('Default Country', 'wooptionsfic')}
                      value={field.defaultCountry ?? 'US'}
                      options={COUNTRY_OPTIONS}
                      onChange={(defaultCountry: string) => update({ defaultCountry })}
                    />
                  ) : null}
                </div>
              ) : null}

              {/* Date and Time Settings */}
              {['datetime', 'date', 'time'].includes(field.type) ? (
                <DateFieldInspector field={field} update={update} />
              ) : null}

              {/* Allow Multiple Choices for color, image, and button choices */}
              {['color_swatch', 'image_swatch', 'segmented'].includes(field.type) ? (
                <div className="wof-multiple-choice-settings" style={{ marginBottom: '16px' }}>
                  <ToggleControl
                    label={__('Allow Multiple Choices', 'wooptionsfic')}
                    help={__('Allow customers to select more than one option.', 'wooptionsfic')}
                    checked={Boolean(field.multiple)}
                    onChange={(multiple: boolean) => update({ multiple })}
                  />
                  {field.multiple ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      <TextControl
                        label={__('Min Restriction', 'wooptionsfic')}
                        type="number"
                        min={0}
                        value={String(field.minChoices ?? '')}
                        placeholder={__('Min', 'wooptionsfic')}
                        onChange={(val: string) => update({ minChoices: val === '' ? 0 : Math.max(0, Number(val)) })}
                      />
                      <TextControl
                        label={__('Max Restriction', 'wooptionsfic')}
                        type="number"
                        min={0}
                        value={String(field.maxChoices ?? '')}
                        placeholder={__('Max', 'wooptionsfic')}
                        onChange={(val: string) => update({ maxChoices: val === '' ? 0 : Math.max(0, Number(val)) })}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Min/Max restriction for checkboxes */}
              {field.type === 'checkbox_group' ? (
                <div className="wof-checkbox-restrictions-box" style={{ padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)', marginBottom: '16px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>{__('Choice Selection Restrictions', 'wooptionsfic')}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <TextControl
                      label={__('Min Restriction', 'wooptionsfic')}
                      type="number"
                      min={0}
                      value={String(field.minChoices ?? '')}
                      placeholder={__('Min', 'wooptionsfic')}
                      onChange={(val: string) => update({ minChoices: val === '' ? 0 : Math.max(0, Number(val)) })}
                    />
                    <TextControl
                      label={__('Max Restriction', 'wooptionsfic')}
                      type="number"
                      min={0}
                      value={String(field.maxChoices ?? '')}
                      placeholder={__('Max', 'wooptionsfic')}
                      onChange={(val: string) => update({ maxChoices: val === '' ? 0 : Math.max(0, Number(val)) })}
                    />
                  </div>
                </div>
              ) : null}

              {/* Enable Quantity option for choice fields (excluding segmented, radio, checkbox_group, font, and select) */}
              {Boolean(field.choices) && !['segmented', 'radio', 'checkbox_group', 'font', 'select'].includes(field.type) ? (
                <div className="wof-quantity-setting" style={{ marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' }}>
                  <ToggleControl
                    label={__('Enable Quantity', 'wooptionsfic')}
                    help={__('Allow customers to specify quantity for each choice option.', 'wooptionsfic')}
                    checked={Boolean(field.enableQuantity)}
                    onChange={(enableQuantity: boolean) => update({ enableQuantity })}
                  />
                  {field.enableQuantity ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                      <TextControl
                        label={__('Minimum Quantity', 'wooptionsfic')}
                        type="number"
                        min={1}
                        value={String(field.minQuantity ?? 1)}
                        placeholder="1"
                        onChange={(val: string) => update({ minQuantity: val === '' ? 1 : Math.max(1, Number(val)) })}
                      />
                      <TextControl
                        label={__('Maximum Quantity', 'wooptionsfic')}
                        type="number"
                        min={1}
                        value={String(field.maxQuantity ?? 100)}
                        placeholder="100"
                        onChange={(val: string) => update({ maxQuantity: val === '' ? 0 : Math.max(1, Number(val)) })}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {field.type === 'color_picker' ? (
                <ChoiceColorControl label={__('Default color', 'wooptionsfic')} color={String(field.default ?? '#5B4FF5')} onChange={(color: string) => update({ default: color })} />
              ) : null}

              {['checkbox', 'toggle'].includes(field.type) ? (
                <ToggleControl
                  label={__('Checked by default', 'wooptionsfic')}
                  checked={Boolean(field.default)}
                  onChange={(defaultVal: boolean) => update({ default: defaultVal })}
                />
              ) : null}

              <TextareaControl label={__('Help text', 'wooptionsfic')} value={field.help} onChange={(help: string) => update({ help })} />
              <ToggleControl label={__('Required', 'wooptionsfic')} checked={field.required} onChange={(required: boolean) => update({ required })} />
            </>
          ) : props.tab === 'choices' ? (
            <ChoiceEditor field={field} onChange={props.onFieldChange} />
          ) : props.tab === 'pricing' ? (
            <PricingPanel field={field} onChange={props.onFieldChange} />
          ) : props.tab === 'logic' ? (
            <LogicEditor field={field} allFields={props.document.fields} onChange={props.onFieldChange} />
          ) : props.tab === 'style' ? (
            <StyleStudio document={props.document} onChange={props.onDocumentChange} />
          ) : (
            <>
              <ToggleControl label={__('Disable this field', 'wooptionsfic')} checked={field.disabled} onChange={(disabled: boolean) => update({ disabled })} />
              {field.type === 'file' ? (
                <>
                  <TextControl label={__('Allowed extensions', 'wooptionsfic')} value={(field.allowedExtensions ?? []).join(', ')} onChange={(value: string) => update({ allowedExtensions: value.split(',').map((item) => item.trim().replace(/^\./, '')).filter(Boolean) })} />
                  <TextControl label={__('Maximum files', 'wooptionsfic')} type="number" value={String(field.maxFiles ?? 1)} onChange={(value: string) => update({ maxFiles: Math.max(1, Number(value)) })} />
                  <TextControl label={__('Maximum file size (MB)', 'wooptionsfic')} type="number" value={String(field.maxFileMb ?? 5)} onChange={(value: string) => update({ maxFileMb: Math.max(1, Number(value)) })} />
                </>
              ) : null}
              {['number', 'range', 'quantity', 'customer_defined_price'].includes(field.type) ? (
                <>
                  <TextControl label={__('Minimum', 'wooptionsfic')} value={field.min ?? ''} onChange={(value: string) => update({ min: value || null })} />
                  <TextControl label={__('Maximum', 'wooptionsfic')} value={field.max ?? ''} onChange={(value: string) => update({ max: value || null })} />
                  <TextControl label={__('Step', 'wooptionsfic')} value={field.step ?? ''} onChange={(value: string) => update({ step: value || null })} />
                </>
              ) : null}
              <TextControl label={__('Field UUID', 'wooptionsfic')} value={field.uuid} disabled />
            </>
          )}
        </section>
      </div>
    </aside>;
  }
}
