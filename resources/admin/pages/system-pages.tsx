namespace WooOptionsFic.Pages {
  const { Button, TextControl, ToggleControl } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useState } = wp.element;

  export function Settings(): any {
    const [settings, setSettings] = useState<Record<string, any> | null>(null);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    useEffect(() => { WooOptionsFic.Api.getSettings().then(setSettings); }, []);
    if (!settings) return <div className="wof-page"><WooOptionsFic.Components.Loading /></div>;
    const set = (key: string, value: unknown) => setSettings({ ...settings, [key]: value });
    const save = async () => { setSaving(true); try { setSettings(await WooOptionsFic.Api.saveSettings(settings)); setNotice(__('Settings saved.', 'wooptionsfic')); } finally { setSaving(false); } };
    return <div className="wof-page"><WooOptionsFic.Components.PageHeader eyebrow={__('Operational defaults', 'wooptionsfic')} title={__('Settings', 'wooptionsfic')} description={__('Control limits and product-option behavior without editing code.', 'wooptionsfic')} actions={<Button variant="primary" isBusy={saving} onClick={save}>{__('Save settings', 'wooptionsfic')}</Button>} />{notice ? <WooOptionsFic.Components.InlineNotice type="success" onClose={() => setNotice('')}>{notice}</WooOptionsFic.Components.InlineNotice> : null}<div className="wof-settings-grid"><section className="wof-settings-section"><h2>{__('Public API limits', 'wooptionsfic')}</h2><TextControl label={__('Quote requests per minute', 'wooptionsfic')} type="number" value={String(settings.quote_rate_limit_per_minute ?? 60)} onChange={(value: string) => set('quote_rate_limit_per_minute', Number(value))} /><TextControl label={__('Upload size limit (MB)', 'wooptionsfic')} type="number" value={String(settings.upload_max_mb ?? 10)} onChange={(value: string) => set('upload_max_mb', Number(value))} /></section><section className="wof-settings-section"><h2>{__('Features', 'wooptionsfic')}</h2>{Object.entries(settings).filter(([, value]) => typeof value === 'boolean').map(([key, value]) => <ToggleControl key={key} label={key.replace(/_/g, ' ')} checked={Boolean(value)} onChange={(checked: boolean) => set(key, checked)} />)}</section></div></div>;
  }

  export function Help(props: { navigate: (route: string) => void }): any {
    return <div className="wof-page"><WooOptionsFic.Components.PageHeader eyebrow={__('Learn the workshop', 'wooptionsfic')} title={__('Help & onboarding', 'wooptionsfic')} description={__('A practical route from your first element to a published product configurator.', 'wooptionsfic')} /><div className="wof-onboarding-grid"><article><span>1</span><h2>{__('Create or import', 'wooptionsfic')}</h2><p>{__('Start blank or choose one of the editable templates.', 'wooptionsfic')}</p><Button variant="secondary" onClick={() => props.navigate('templates')}>{__('Browse templates', 'wooptionsfic')}</Button></article><article><span>2</span><h2>{__('Build and style', 'wooptionsfic')}</h2><p>{__('Add elements, configure prices and logic, and preview the product page live.', 'wooptionsfic')}</p></article><article><span>3</span><h2>{__('Assign and publish', 'wooptionsfic')}</h2><p>{__('Target products or catalog groups, run preflight checks, then publish.', 'wooptionsfic')}</p><Button variant="primary" onClick={() => props.navigate('option-sets')}>{__('Open option sets', 'wooptionsfic')}</Button></article></div></div>;
  }
}
