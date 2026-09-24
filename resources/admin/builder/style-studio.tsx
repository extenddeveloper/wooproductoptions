namespace WooOptionsFic.Builder {
  const { SelectControl, ToggleControl } = wp.components;
  const { __ } = wp.i18n;

  export function StyleStudio(props: { document: WooOptionsFic.OptionSetDefinition; onChange: (patch: Partial<WooOptionsFic.OptionSetDefinition>) => void }): any {
    const document = props.document;
    const updateStyle = (patch: Partial<WooOptionsFic.OptionSetDefinition['style']>) => props.onChange({ style: { ...document.style, ...patch } });
    const updateTypography = (patch: Partial<WooOptionsFic.TypographyDefinition>) => updateStyle({ typography: { ...document.style.typography, ...patch } });
    const updateSettings = (patch: Partial<WooOptionsFic.OptionSetDefinition['settings']>) => props.onChange({ settings: { ...document.settings, ...patch } });
    const fonts = ['inherit', 'system-ui', 'Inter', 'Manrope', 'Poppins', 'Outfit', 'Plus Jakarta Sans', 'Roboto'];
    return <div className="wof-style-studio">
      <h3>{__('Color palette', 'wooptionsfic')}</h3>
      <div className="wof-palette-picker">{Object.entries(window.WooOptionsFicAdmin.palettes).map(([key, palette]) => <button type="button" key={key} className={document.style.palette === key ? 'is-selected' : ''} onClick={() => updateStyle({ palette: key })}><span className="wof-palette-dots">{['primary', 'accent', 'background', 'surface'].map((token) => <i key={token} style={{ background: palette.tokens[token] }} />)}</span><span><strong>{palette.name}</strong><small>{key}</small></span><b>✓</b></button>)}</div>
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
