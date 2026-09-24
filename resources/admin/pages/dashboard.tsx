namespace WooOptionsFic.Pages {
  const { Button } = wp.components;
  const { __, sprintf } = wp.i18n;
  const { useEffect, useState } = wp.element;

  export function Dashboard(props: { navigate: (route: string) => void }): any {
    const [items, setItems] = useState<WooOptionsFic.OptionSetRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      WooOptionsFic.Api.listOptionSets({ perPage: 5 }).then((response) => setItems(response.items)).finally(() => setLoading(false));
    }, []);

    const published = items.filter((item) => item.publishedRevisionId).length;
    return (
      <div className="wof-page">
        <WooOptionsFic.Components.PageHeader
          eyebrow={__('Your product experience studio', 'wooptionsfic')}
          title={sprintf(__('Good to see you, %s.', 'wooptionsfic'), window.WooOptionsFicAdmin.currentUser.name.split(' ')[0] ?? window.WooOptionsFicAdmin.currentUser.name)}
          description={__('Build thoughtful product choices, price them safely, and publish without touching theme code.', 'wooptionsfic')}
          actions={<Button variant="primary" onClick={() => props.navigate('option-sets')}>{__('Create an option set', 'wooptionsfic')}</Button>}
        />
        <section className="wof-hero-card">
          <div className="wof-hero-card__copy">
            <h2>{__('A polished configurator in three moves', 'wooptionsfic')}</h2>
            <div className="wof-steps">
              <div><b>1</b><span><strong>{__('Shape', 'wooptionsfic')}</strong><small>{__('Add fields and choices', 'wooptionsfic')}</small></span></div>
              <div><b>2</b><span><strong>{__('Assign', 'wooptionsfic')}</strong><small>{__('Choose matching products', 'wooptionsfic')}</small></span></div>
              <div><b>3</b><span><strong>{__('Publish', 'wooptionsfic')}</strong><small>{__('Run checks and go live', 'wooptionsfic')}</small></span></div>
            </div>
            <div className="wof-inline-actions">
              <Button variant="primary" onClick={() => props.navigate('templates')}>{__('Explore templates', 'wooptionsfic')}</Button>
            </div>
          </div>
          <div className="wof-hero-preview" aria-hidden="true">
            <div className="wof-preview-window"><div className="wof-preview-window__bar"><i/><i/><i/></div><div className="wof-preview-window__body"><div className="wof-preview-palette"><span/><span/><span/><span/></div><div className="wof-preview-canvas"><div className="wof-preview-field is-selected"><em/><span/></div><div className="wof-preview-field"><em/><span/></div><div className="wof-preview-field"><em/><span/></div></div><div className="wof-preview-inspector"><span/><span/><span/></div></div></div>
          </div>
        </section>
        <div className="wof-stat-grid">
          <div className="wof-stat"><span>{__('Active sets', 'wooptionsfic')}</span><strong>{items.length}</strong><small>{__('Loaded in this view', 'wooptionsfic')}</small></div>
          <div className="wof-stat"><span>{__('Published', 'wooptionsfic')}</span><strong>{published}</strong><small>{__('Immutable live revisions', 'wooptionsfic')}</small></div>
          <div className="wof-stat"><span>{__('Built-in templates', 'wooptionsfic')}</span><strong>10</strong><small>{__('Ready to customize', 'wooptionsfic')}</small></div>
          <div className="wof-stat is-accent"><span>{__('Commerce truth', 'wooptionsfic')}</span><strong>100%</strong><small>{__('Calculated on the server', 'wooptionsfic')}</small></div>
        </div>
        <section className="wof-panel">
          <div className="wof-panel__header"><div><h2>{__('Recently edited', 'wooptionsfic')}</h2><p>{__('Pick up exactly where you left off.', 'wooptionsfic')}</p></div><Button variant="tertiary" onClick={() => props.navigate('option-sets')}>{__('View all', 'wooptionsfic')}</Button></div>
          {loading ? <WooOptionsFic.Components.Loading label={__('Loading your workshop…', 'wooptionsfic')} /> : items.length ? <div className="wof-recent-list">{items.map((item) => <button type="button" key={item.uuid} onClick={() => props.navigate(`builder/${item.uuid}`)}><span className="wof-set-glyph"><WooOptionsFic.Components.Dashicon name="screenoptions" /></span><span><strong>{item.title}</strong><small>{WooOptionsFic.Utils.formatDate(item.updatedAtGmt)}</small></span><WooOptionsFic.Components.StatusPill status={item.publishedRevisionId ? __('Published', 'wooptionsfic') : __('Draft', 'wooptionsfic')} /><b aria-hidden="true">→</b></button>)}</div> : <div className="wof-panel__empty"><p>{__('Your workshop is clear. Import a template or create a blank option set.', 'wooptionsfic')}</p></div>}
        </section>
      </div>
    );
  }
}
