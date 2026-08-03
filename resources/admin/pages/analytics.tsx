namespace WooOptionsFic.Pages {
  const { __ } = wp.i18n;
  const { useEffect, useState } = wp.element;
  export function Analytics(): any {
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState('');
    useEffect(() => { WooOptionsFic.Api.analytics().then(setData).catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason))); }, []);
    return <div className="wof-page"><WooOptionsFic.Components.PageHeader eyebrow={__('Storefront signals', 'wooptionsfic')} title={__('Analytics', 'wooptionsfic')} description={__('Understand interactions, validation friction, and configured-product conversions.', 'wooptionsfic')} />{error ? <WooOptionsFic.Components.InlineNotice type="error">{error}</WooOptionsFic.Components.InlineNotice> : !data ? <WooOptionsFic.Components.Loading /> : <><div className="wof-stat-grid">{Object.entries(data).slice(0, 4).map(([key, value]) => <div className="wof-stat" key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{typeof value === 'number' || typeof value === 'string' ? value : '—'}</strong><small>{__('Current reporting window', 'wooptionsfic')}</small></div>)}</div><section className="wof-panel"><div className="wof-panel__header"><div><h2>{__('Analytics payload', 'wooptionsfic')}</h2><p>{__('Raw server-authoritative summary for development and verification.', 'wooptionsfic')}</p></div></div><pre className="wof-code-panel">{JSON.stringify(data, null, 2)}</pre></section></>}</div>;
  }
}
