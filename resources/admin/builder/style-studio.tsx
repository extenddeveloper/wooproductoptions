namespace WooOptionsFic.Builder {
  const { SelectControl, ToggleControl } = wp.components;
  const { __ } = wp.i18n;
  const { useState, useEffect } = wp.element;

  interface ColorFieldConfig {
    key: string;
    label: string;
    defaultColor: string;
  }

  const COLOR_FIELDS: ColorFieldConfig[] = [
    { key: 'text', label: __('Text Color', 'wooptionsfic'), defaultColor: '#1A1A1A' },
    { key: 'primary', label: __('Primary', 'wooptionsfic'), defaultColor: '#1A1A1A' },
    { key: 'border', label: __('Field Border', 'wooptionsfic'), defaultColor: '#8A8A8A' },
    { key: 'surface', label: __('Field Fill', 'wooptionsfic'), defaultColor: '#FFFFFF' },
    { key: 'onPrimary', label: __('Over Primary Color', 'wooptionsfic'), defaultColor: '#FFFFFF' },
    { key: 'danger', label: __('Required / Error Color', 'wooptionsfic'), defaultColor: '#DF1C41' },
  ];

  function ColorFieldItem(props: {
    label: string;
    tokenKey: string;
    value: string;
    onChange: (hex: string) => void;
  }) {
    const [localHex, setLocalHex] = useState(props.value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      setLocalHex(props.value);
    }, [props.value]);

    const handleInputChange = (e: any) => {
      const raw = e.target.value;
      setLocalHex(raw);
      let val = raw.trim();
      if (!val.startsWith('#') && val.length > 0) {
        val = '#' + val;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        props.onChange(val.toUpperCase());
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      let val = localHex.trim();
      if (!val.startsWith('#') && val.length > 0) {
        val = '#' + val;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        const formatted = val.toUpperCase();
        setLocalHex(formatted);
        props.onChange(formatted);
      } else {
        setLocalHex(props.value);
      }
    };

    const handlePickerChange = (e: any) => {
      const val = e.target.value.toUpperCase();
      setLocalHex(val);
      props.onChange(val);
    };

    const isLightColor = (hex: string) => {
      const clean = hex.replace('#', '');
      if (clean.length !== 6) return false;
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 215;
    };

    const safeHex = /^#[0-9A-Fa-f]{6}$/.test(props.value) ? props.value : '#000000';

    return (
      <div className="wof-color-field-item">
        <label className="wof-color-field-label" title={props.label}>{props.label}</label>
        <div className={`wof-color-field-control ${isFocused ? 'is-focused' : ''}`}>
          <div className="wof-color-swatch-box" title={__('Choose color', 'wooptionsfic')}>
            <span
              className={`wof-color-circle ${isLightColor(safeHex) ? 'has-border' : ''}`}
              style={{ backgroundColor: safeHex }}
            />
            <input
              type="color"
              className="wof-color-native-picker"
              value={safeHex}
              onChange={handlePickerChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label={props.label}
            />
          </div>
          <input
            type="text"
            className="wof-color-text-input"
            value={localHex}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            maxLength={7}
            spellCheck={false}
            aria-label={`${props.label} Hex Code`}
          />
        </div>
      </div>
    );
  }

  export function StyleStudio(props: { document: WooOptionsFic.OptionSetDefinition; onChange: (patch: Partial<WooOptionsFic.OptionSetDefinition>) => void }): any {
    const document = props.document;
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(true);

    const updateStyle = (patch: Partial<WooOptionsFic.OptionSetDefinition['style']>) => props.onChange({ style: { ...document.style, ...patch } });
    const updateTypography = (patch: Partial<WooOptionsFic.TypographyDefinition>) => updateStyle({ typography: { ...document.style.typography, ...patch } });
    const updateSettings = (patch: Partial<WooOptionsFic.OptionSetDefinition['settings']>) => props.onChange({ settings: { ...document.settings, ...patch } });
    const fonts = ['inherit', 'system-ui', 'Inter', 'Manrope', 'Poppins', 'Outfit', 'Plus Jakarta Sans', 'Roboto'];

    const handleSelectPalette = (key: string) => {
      const preset = window.WooOptionsFicAdmin.palettes[key];
      const newOverrides = preset?.tokens ? { ...preset.tokens } : {};
      updateStyle({
        palette: key,
        overrides: newOverrides,
      });
    };

    const handleColorChange = (tokenKey: string, hex: string) => {
      const presetTokens = window.WooOptionsFicAdmin.palettes[document.style.palette]?.tokens ?? {};
      const currentOverrides = document.style.overrides ?? {};
      const updated = {
        ...presetTokens,
        ...currentOverrides,
        [tokenKey]: hex.toUpperCase(),
      };
      updateStyle({
        overrides: updated,
      });
    };

    const getFieldColor = (tokenKey: string, fallback: string): string => {
      let color = '';
      if (document.style?.overrides && document.style.overrides[tokenKey]) {
        color = document.style.overrides[tokenKey];
      } else {
        const preset = window.WooOptionsFicAdmin.palettes?.[document.style?.palette];
        if (preset?.tokens && preset.tokens[tokenKey]) {
          color = preset.tokens[tokenKey];
        }
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return color.toUpperCase();
      }
      return fallback;
    };

    return <div className="wof-style-studio">
      <h3>{__('Color palette', 'wooptionsfic')}</h3>
      <div className="wof-palette-picker">
        {Object.entries(window.WooOptionsFicAdmin.palettes).map(([key, palette]) => (
          <button
            type="button"
            key={key}
            className={document.style.palette === key ? 'is-selected' : ''}
            onClick={() => handleSelectPalette(key)}
          >
            <span className="wof-palette-dots">
              {['primary', 'accent', 'background', 'surface'].map((token) => (
                <i key={token} style={{ background: palette.tokens[token] }} />
              ))}
            </span>
            <span>
              <strong>{palette.name}</strong>
              <small>{key}</small>
            </span>
            <b>✓</b>
          </button>
        ))}
      </div>

      <div className="wof-customize-colors-section">
        <button
          type="button"
          className="wof-customize-colors-header"
          onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
          aria-expanded={isCustomizeOpen}
        >
          <h4>{__('Customize Colors', 'wooptionsfic')}</h4>
          <span className={`wof-customize-colors-chevron ${isCustomizeOpen ? 'is-open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </span>
        </button>

        {isCustomizeOpen && (
          <div className="wof-customize-colors-grid">
            {COLOR_FIELDS.map((field) => (
              <ColorFieldItem
                key={field.key}
                label={field.label}
                tokenKey={field.key}
                value={getFieldColor(field.key, field.defaultColor)}
                onChange={(hex) => handleColorChange(field.key, hex)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="wof-style-divider" />
      <h3>{__('Typography', 'wooptionsfic')}</h3>
      <SelectControl label={__('Font family', 'wooptionsfic')} value={document.style.typography.family ?? 'inherit'} options={fonts.map((font) => ({ label: font === 'inherit' ? __('Inherit from theme', 'wooptionsfic') : font === 'system-ui' ? __('System UI', 'wooptionsfic') : font, value: font }))} onChange={(family: string) => updateTypography({ family })} />
      <SelectControl label={__('Label weight', 'wooptionsfic')} value={String(document.style.typography.labelWeight ?? 650)} options={[400, 500, 600, 650, 700, 800].map((value) => ({ label: String(value), value: String(value) }))} onChange={(value: string) => updateTypography({ labelWeight: Number(value) })} />
      <SelectControl label={__('Body weight', 'wooptionsfic')} value={String(document.style.typography.bodyWeight ?? 450)} options={[300, 400, 450, 500, 600, 700].map((value) => ({ label: String(value), value: String(value) }))} onChange={(value: string) => updateTypography({ bodyWeight: Number(value) })} />
      <div className="wof-style-divider" />
      <h3>{__('Layout & summary', 'wooptionsfic')}</h3>
      <ToggleControl label={__('Show itemized price breakdown', 'wooptionsfic')} checked={document.settings.showPriceBreakdown} onChange={(value: boolean) => updateSettings({ showPriceBreakdown: value })} />
      <ToggleControl label={__('Keep configuration summary visible', 'wooptionsfic')} checked={document.settings.stickySummary} onChange={(value: boolean) => updateSettings({ stickySummary: value })} />
      <ToggleControl label={__('Allow saved configurations', 'wooptionsfic')} checked={document.settings.saveEnabled} onChange={(value: boolean) => updateSettings({ saveEnabled: value })} />
      <ToggleControl label={__('Allow shareable links', 'wooptionsfic')} checked={document.settings.shareEnabled} onChange={(value: boolean) => updateSettings({ shareEnabled: value })} />
    </div>;
  }
}

