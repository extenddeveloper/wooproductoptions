namespace WooOptionsFic.Pages {
  const { Button, Modal, SearchControl, SelectControl } = wp.components;
  const { __, sprintf } = wp.i18n;
  const { useEffect, useMemo, useRef, useState } = wp.element;

  type TemplateSort = 'popular' | 'newest' | 'name';

  const categoryOrder = ['apparel', 'food', 'gift', 'electronics', 'windows-doors', 'print', 'services', 'furniture'];
  const categoryLabels: Record<string, string> = {
    apparel: __('Apparel', 'wooptionsfic'),
    food: __('Food', 'wooptionsfic'),
    gift: __('Gift', 'wooptionsfic'),
    electronics: __('Electronics', 'wooptionsfic'),
    'windows-doors': __('Windows & Doors', 'wooptionsfic'),
    print: __('Print', 'wooptionsfic'),
    services: __('Services', 'wooptionsfic'),
    furniture: __('Furniture', 'wooptionsfic'),
  };
  const categoryIcons: Record<string, string> = {
    apparel: 'admin-users',
    food: 'food',
    gift: 'heart',
    electronics: 'desktop',
    'windows-doors': 'admin-home',
    print: 'edit-page',
    services: 'calendar-alt',
    furniture: 'admin-home',
  };
  const featureLabels: Record<string, string> = {
    image_upload: __('Image upload', 'wooptionsfic'),
    live_preview: __('Live preview', 'wooptionsfic'),
    conditional_logic: __('Conditional logic', 'wooptionsfic'),
    price_calculation: __('Price calculation', 'wooptionsfic'),
    repeaters: __('Repeatable fields', 'wooptionsfic'),
  };

  function readFavorites(): string[] {
    try {
      const value = JSON.parse(window.localStorage.getItem('wooptionsfic-template-favorites') ?? '[]');
      return Array.isArray(value) ? value.map(String) : [];
    } catch {
      return [];
    }
  }

  function TemplatesBrand(props: { navigate: (route: string) => void }): any {
    return (
      <button type="button" className="wof-templates-brand" onClick={() => props.navigate('dashboard')}>
        <span className="wof-templates-brand__mark">W</span>
        <strong>Woo<span>OptionsFic</span></strong>
      </button>
    );
  }

  function TemplateCard(props: {
    item: WooOptionsFic.TemplateRecord;
    busy: boolean;
    favorite: boolean;
    onUse: () => void;
    onPreview: () => void;
    onFavorite: () => void;
  }): any {
    const { item } = props;
    return (
      <article className="wof-market-template-card">
        <div className="wof-market-template-card__media">
          <img src={item.previewImage} alt="" loading="lazy" />
          <button
            type="button"
            className={WooOptionsFic.Utils.classNames('wof-template-favorite', props.favorite && 'is-active')}
            onClick={props.onFavorite}
            aria-label={props.favorite ? __('Remove from favorites', 'wooptionsfic') : __('Add to favorites', 'wooptionsfic')}
          >
            <WooOptionsFic.Components.Dashicon name={props.favorite ? 'heart' : 'heart'} />
          </button>
        </div>
        <div className="wof-market-template-card__body">
          <h3>{item.name}</h3>
          <span className="wof-template-category-label">{item.categoryLabel ?? categoryLabels[item.category] ?? item.category}</span>
          <p>{item.description}</p>
          <div className="wof-market-template-card__footer">
            <span className="wof-template-usage"><WooOptionsFic.Components.Dashicon name="groups" />{WooOptionsFic.Utils.compactNumber(item.usage ?? 0)} {__('uses', 'wooptionsfic')}</span>
            <div>
              <button type="button" className="wof-template-preview-button" onClick={props.onPreview} aria-label={sprintf(__('Preview %s', 'wooptionsfic'), item.name)}>
                <WooOptionsFic.Components.Dashicon name="visibility" />
              </button>
              <Button variant="primary" isBusy={props.busy} onClick={props.onUse}>{__('Use template', 'wooptionsfic')}</Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  export function Templates(props: { navigate: (route: string) => void }): any {
    const [items, setItems] = useState<WooOptionsFic.TemplateRecord[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [features, setFeatures] = useState<string[]>([]);
    const [sort, setSort] = useState<TemplateSort>('popular');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [filterOpen, setFilterOpen] = useState(true);
    const [error, setError] = useState('');
    const [favorites, setFavorites] = useState<string[]>(readFavorites);
    const [preview, setPreview] = useState<WooOptionsFic.TemplateRecord | null>(null);
    const fileRef = useRef<any>(null);
    const perPage = 8;

    useEffect(() => {
      WooOptionsFic.Api.listTemplates()
        .then((response) => setItems(response.items))
        .catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason)))
        .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
      setPage(1);
    }, [search, category, features, sort]);

    const categoryCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      items.forEach((item) => { counts[item.category] = (counts[item.category] ?? 0) + 1; });
      return counts;
    }, [items]);

    const featureCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      items.forEach((item) => (item.features ?? []).forEach((feature) => { counts[feature] = (counts[feature] ?? 0) + 1; }));
      return counts;
    }, [items]);

    const filtered = useMemo(() => {
      const term = search.trim().toLowerCase();
      const next = items.filter((item) => {
        if (category !== 'all' && item.category !== category) return false;
        if (features.length && !features.every((feature) => (item.features ?? []).includes(feature))) return false;
        if (!term) return true;
        return `${item.name} ${item.description} ${item.categoryLabel ?? item.category} ${(item.features ?? []).join(' ')}`.toLowerCase().includes(term);
      });
      return next.sort((left, right) => {
        if (sort === 'name') return left.name.localeCompare(right.name);
        if (sort === 'newest') return (right.order ?? 0) - (left.order ?? 0);
        return (right.popularity ?? right.usage ?? 0) - (left.popularity ?? left.usage ?? 0);
      });
    }, [items, search, category, features, sort]);

    const pages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, pages);
    const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const importTemplate = async (slug: string) => {
      setBusy(slug);
      setError('');
      try {
        const result = await WooOptionsFic.Api.importTemplate(slug);
        props.navigate(`builder/${result.uuid}`);
      } catch (reason) {
        setError(WooOptionsFic.Utils.errorMessage(reason));
      } finally {
        setBusy(null);
      }
    };

    const createFromScratch = async () => {
      setCreating(true);
      setError('');
      try {
        const created = await WooOptionsFic.Api.createOptionSet(__('Untitled option set', 'wooptionsfic'));
        props.navigate(`builder/${created.uuid}`);
      } catch (reason) {
        setError(WooOptionsFic.Utils.errorMessage(reason));
      } finally {
        setCreating(false);
      }
    };

    const importFile = async (event: any) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      setImporting(true);
      setError('');
      try {
        const raw = await file.text();
        const payload = JSON.parse(raw);
        const result = await WooOptionsFic.Api.previewImport(payload);
        if (!result.valid) throw new Error(__('The selected template contains validation errors.', 'wooptionsfic'));
        const created = await WooOptionsFic.Api.commitImport(payload, result.title || file.name.replace(/\.json$/i, ''));
        props.navigate(`builder/${created.uuid}`);
      } catch (reason) {
        setError(reason instanceof SyntaxError ? __('Choose a valid WooOptionsFic JSON export.', 'wooptionsfic') : WooOptionsFic.Utils.errorMessage(reason));
      } finally {
        setImporting(false);
      }
    };

    const toggleFavorite = (slug: string) => {
      setFavorites((current) => {
        const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
        window.localStorage.setItem('wooptionsfic-template-favorites', JSON.stringify(next));
        return next;
      });
    };

    const toggleFeature = (feature: string) => {
      setFeatures((current) => current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]);
    };

    const heroItems = items.slice(0, 4);
    const start = filtered.length ? ((currentPage - 1) * perPage) + 1 : 0;
    const end = Math.min(currentPage * perPage, filtered.length);

    return (
      <div className="wof-templates-app">
        <header className="wof-templates-topbar">
          <TemplatesBrand navigate={props.navigate} />
          <div className="wof-templates-breadcrumb"><button type="button" onClick={() => props.navigate('option-sets')}>{__('Option Sets', 'wooptionsfic')}</button><span>/</span><strong>{__('Templates', 'wooptionsfic')}</strong></div>
          <div className="wof-templates-topbar__search"><SearchControl label={__('Search templates', 'wooptionsfic')} value={search} onChange={setSearch} placeholder={__('Search templates…', 'wooptionsfic')} /><kbd>⌘ K</kbd></div>
          <span className="wof-template-ready"><WooOptionsFic.Components.Dashicon name="yes-alt" />{__('Catalog ready', 'wooptionsfic')}</span>
          <button type="button" className="wof-templates-icon-button" onClick={() => props.navigate('help')} aria-label={__('Help', 'wooptionsfic')}><WooOptionsFic.Components.Dashicon name="editor-help" /></button>
          <button type="button" className="wof-templates-icon-button" aria-label={__('Notifications', 'wooptionsfic')}><WooOptionsFic.Components.Dashicon name="bell" /></button>
          <span className="wof-template-avatar">{window.WooOptionsFicAdmin.currentUser.name.trim().charAt(0).toUpperCase()}</span>
        </header>

        <div className="wof-templates-layout">
          <aside className="wof-templates-sidebar">
            <button type="button" className="wof-template-back" onClick={() => props.navigate('dashboard')}><WooOptionsFic.Components.Dashicon name="arrow-left-alt2" />{__('Back to dashboard', 'wooptionsfic')}</button>
            <nav>
              <button type="button" onClick={() => props.navigate('option-sets')}><WooOptionsFic.Components.Dashicon name="screenoptions" />{__('Option sets', 'wooptionsfic')}</button>
              <button type="button" className="is-active"><WooOptionsFic.Components.Dashicon name="star-filled" />{__('Templates', 'wooptionsfic')}</button>
              <button type="button" onClick={() => props.navigate('option-sets')}><WooOptionsFic.Components.Dashicon name="admin-links" />{__('Assignments', 'wooptionsfic')}</button>
              <button type="button" onClick={() => props.navigate('help')}><WooOptionsFic.Components.Dashicon name="randomize" />{__('Rules', 'wooptionsfic')}</button>
              <button type="button" onClick={() => props.navigate('settings')}><WooOptionsFic.Components.Dashicon name="admin-settings" />{__('Settings', 'wooptionsfic')}</button>
            </nav>
            <section className="wof-template-sidebar-card is-accent"><span><WooOptionsFic.Components.Dashicon name="star-filled" /></span><h3>{__('Need something unique?', 'wooptionsfic')}</h3><p>{__('Create a custom template that matches your exact requirements.', 'wooptionsfic')}</p><Button variant="secondary" isBusy={creating} onClick={createFromScratch}>{__('Create from scratch', 'wooptionsfic')}</Button></section>
            <section className="wof-template-sidebar-card"><h3>{__('Need help?', 'wooptionsfic')}</h3><p>{__('Visit our docs or contact support for assistance.', 'wooptionsfic')}</p><button type="button" onClick={() => props.navigate('help')}>{__('View documentation', 'wooptionsfic')} <WooOptionsFic.Components.Dashicon name="external" /></button><button type="button" onClick={() => props.navigate('help')}>{__('Contact support', 'wooptionsfic')} <WooOptionsFic.Components.Dashicon name="external" /></button></section>
          </aside>

          <main className="wof-templates-content">
            <div className="wof-templates-page-heading"><div><h1>{__('Templates', 'wooptionsfic')}</h1><p>{__('Choose a prebuilt template to get started quickly. Every template is fully customizable.', 'wooptionsfic')}</p></div><div><input ref={fileRef} type="file" hidden accept="application/json,.json" onChange={importFile} /><Button variant="secondary" isBusy={importing} onClick={() => fileRef.current?.click()}><WooOptionsFic.Components.Dashicon name="upload" />{__('Import template', 'wooptionsfic')}</Button><Button variant="primary" isBusy={creating} onClick={createFromScratch}><WooOptionsFic.Components.Dashicon name="plus-alt2" />{__('Create from scratch', 'wooptionsfic')}</Button></div></div>

            {error ? <WooOptionsFic.Components.InlineNotice type="error" onClose={() => setError('')}>{error}</WooOptionsFic.Components.InlineNotice> : null}

            <section className="wof-template-hero">
              <div className="wof-template-hero__copy"><span className="wof-template-spark"><WooOptionsFic.Components.Dashicon name="star-filled" /></span><h2>{__('Start with a beautiful template', 'wooptionsfic')}</h2><p>{__('Save time and launch faster with our professionally designed option set templates.', 'wooptionsfic')}</p><p>{__('Each template is fully customizable to fit your brand and business needs.', 'wooptionsfic')}</p></div>
              <div className="wof-template-hero__art" aria-hidden="true">{heroItems.map((item, index) => <figure key={item.slug} style={{ '--card-index': index } as any}><img src={item.previewImage} alt="" /></figure>)}</div>
            </section>

            <div className="wof-template-catalog-toolbar">
              <div className="wof-template-category-tabs"><button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>{__('All Templates', 'wooptionsfic')}</button>{categoryOrder.filter((item) => categoryCounts[item]).map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{categoryLabels[item]}</button>)}</div>
              <div className="wof-template-catalog-actions"><button type="button" className={filterOpen ? 'is-active' : ''} onClick={() => setFilterOpen(!filterOpen)}><WooOptionsFic.Components.Dashicon name="filter" />{__('Filters', 'wooptionsfic')}</button><SelectControl label={__('Sort templates', 'wooptionsfic')} hideLabelFromVision value={sort} onChange={(value: TemplateSort) => setSort(value)} options={[{ label: __('Most popular', 'wooptionsfic'), value: 'popular' }, { label: __('Newest first', 'wooptionsfic'), value: 'newest' }, { label: __('Name A–Z', 'wooptionsfic'), value: 'name' }]} /></div>
            </div>

            <div className={WooOptionsFic.Utils.classNames('wof-template-catalog', !filterOpen && 'is-filter-collapsed')}>
              {filterOpen ? <aside className="wof-template-filter-panel"><section><h3>{__('Categories', 'wooptionsfic')}</h3><button type="button" className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}><WooOptionsFic.Components.Dashicon name="star-filled" /><span>{__('All Categories', 'wooptionsfic')}</span><b>{items.length}</b></button>{categoryOrder.filter((item) => categoryCounts[item]).map((item) => <button type="button" key={item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}><WooOptionsFic.Components.Dashicon name={categoryIcons[item]} /><span>{categoryLabels[item]}</span><b>{categoryCounts[item]}</b></button>)}</section><section><h3>{__('Features', 'wooptionsfic')}</h3>{Object.entries(featureLabels).filter(([feature]) => featureCounts[feature]).map(([feature, label]) => <label key={feature}><input type="checkbox" checked={features.includes(feature)} onChange={() => toggleFeature(feature)} /><span>{label}</span><b>{featureCounts[feature]}</b></label>)}</section></aside> : null}

              <section className="wof-template-results">
                {loading ? <WooOptionsFic.Components.Loading label={__('Loading templates…', 'wooptionsfic')} /> : visible.length ? <div className="wof-market-template-grid">{visible.map((item) => <TemplateCard key={item.slug} item={item} busy={busy === item.slug} favorite={favorites.includes(item.slug)} onUse={() => importTemplate(item.slug)} onPreview={() => setPreview(item)} onFavorite={() => toggleFavorite(item.slug)} />)}</div> : <WooOptionsFic.Components.EmptyState icon="search" title={__('No templates found', 'wooptionsfic')} description={__('Try a different search, category, or feature filter.', 'wooptionsfic')} action={<Button variant="secondary" onClick={() => { setSearch(''); setCategory('all'); setFeatures([]); }}>{__('Clear filters', 'wooptionsfic')}</Button>} />}
                {!loading ? <footer className="wof-template-pagination"><span>{sprintf(__('Showing %1$d–%2$d of %3$d templates', 'wooptionsfic'), start, end, filtered.length)}</span><nav aria-label={__('Template pages', 'wooptionsfic')}><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><WooOptionsFic.Components.Dashicon name="arrow-left-alt2" /></button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={currentPage === number ? 'is-active' : ''} onClick={() => setPage(number)}>{number}</button>)}<button type="button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><WooOptionsFic.Components.Dashicon name="arrow-right-alt2" /></button></nav></footer> : null}
              </section>
            </div>
          </main>
        </div>

        {preview ? <Modal title={preview.name} className="wof-modal wof-template-preview-modal" onRequestClose={() => setPreview(null)}><div className="wof-template-preview-modal__image"><img src={preview.previewImage} alt="" /></div><span className="wof-template-category-label">{preview.categoryLabel ?? categoryLabels[preview.category]}</span><p>{preview.description}</p><div className="wof-template-preview-features">{(preview.features ?? []).map((feature) => <span key={feature}><WooOptionsFic.Components.Dashicon name="yes-alt" />{featureLabels[feature] ?? feature}</span>)}</div><div className="wof-modal__actions"><Button variant="tertiary" onClick={() => setPreview(null)}>{__('Close', 'wooptionsfic')}</Button><Button variant="primary" isBusy={busy === preview.slug} onClick={() => importTemplate(preview.slug)}>{__('Use this template', 'wooptionsfic')}</Button></div></Modal> : null}
      </div>
    );
  }
}
