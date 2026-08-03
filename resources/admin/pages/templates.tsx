namespace WooOptionsFic.Pages {
  const { Button, SearchControl } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useMemo, useState } = wp.element;

  export function Templates(props: { navigate: (route: string) => void }): any {
    const [items, setItems] = useState<WooOptionsFic.TemplateRecord[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');
    useEffect(() => { WooOptionsFic.Api.listTemplates().then((response) => setItems(response.items)).catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason))).finally(() => setLoading(false)); }, []);
    const filtered = useMemo(() => {
      const term = search.trim().toLowerCase();
      return term ? items.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term)) : items;
    }, [items, search]);
    const importTemplate = async (slug: string) => {
      setBusy(slug);
      try { const result = await WooOptionsFic.Api.importTemplate(slug); props.navigate(`builder/${result.uuid}`); }
      catch (reason) { setError(WooOptionsFic.Utils.errorMessage(reason)); }
      finally { setBusy(null); }
    };
    return <div className="wof-page"><WooOptionsFic.Components.PageHeader eyebrow={__('Fast, practical starting points', 'wooptionsfic')} title={__('Template gallery', 'wooptionsfic')} description={__('Every template is an editable option set—not a locked demo.', 'wooptionsfic')} />{error ? <WooOptionsFic.Components.InlineNotice type="error">{error}</WooOptionsFic.Components.InlineNotice> : null}<div className="wof-template-toolbar"><div><strong>{__('Original templates', 'wooptionsfic')}</strong><span>{__('Schema-tested and ready to adapt', 'wooptionsfic')}</span></div><SearchControl label={__('Search templates', 'wooptionsfic')} value={search} onChange={setSearch} placeholder={__('Search use cases…', 'wooptionsfic')} /></div>{loading ? <WooOptionsFic.Components.Loading label={__('Loading templates…', 'wooptionsfic')} /> : <div className="wof-template-grid">{filtered.map((item) => <article className="wof-template-card" key={item.slug}><div className="wof-template-art"><span><WooOptionsFic.Components.Dashicon name="star-filled" /></span></div><div className="wof-template-card__body"><span className="wof-eyebrow">{item.category}</span><h2>{item.name}</h2><p>{item.description}</p><div className="wof-template-card__meta"><span>{item.fieldCount ?? '—'} {__('fields', 'wooptionsfic')}</span></div><Button variant="primary" isBusy={busy === item.slug} onClick={() => importTemplate(item.slug)}>{__('Use this template', 'wooptionsfic')}</Button></div></article>)}</div>}</div>;
  }
}
