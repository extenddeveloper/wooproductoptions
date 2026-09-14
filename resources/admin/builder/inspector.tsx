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
                      value={String(field.choiceWidth ?? '')}
                      placeholder="Auto"
                      onChange={(choiceWidth: string) => update({ choiceWidth })}
                    />
                    <TextControl
                      label={__('Height (px)', 'wooptionsfic')}
                      value={String(field.choiceHeight ?? '')}
                      placeholder="Auto"
                      onChange={(choiceHeight: string) => update({ choiceHeight })}
                    />
                    <TextControl
                      label={__('Radius (px)', 'wooptionsfic')}
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
