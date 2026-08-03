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
            {['image_swatch', 'color_swatch', 'product', 'radio', 'checkbox_group', 'segmented'].includes(props.field.type) ? (
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
    return <aside className="wof-builder-inspector"><div className="wof-builder-pane__heading"><div><span className="wof-eyebrow">{window.WooOptionsFicAdmin.fieldTypes[field.type]?.label ?? field.type}</span><h2>{field.label}</h2></div><div className="wof-inspector-heading-actions"><button type="button" onClick={props.onDuplicate}><WooOptionsFic.Components.Dashicon name="admin-page" /></button><button type="button" className="is-destructive" onClick={props.onDelete}><WooOptionsFic.Components.Dashicon name="trash" /></button></div></div><div className="wof-inspector-tabs-shell">{canLeft ? <button type="button" className="wof-inspector-tabs-arrow is-left" onClick={() => scrollerRef.current?.scrollBy({ left: -180, behavior: 'smooth' })}><WooOptionsFic.Components.Dashicon name="arrow-left-alt2" /></button> : null}<div className="wof-inspector-tabs" ref={scrollerRef}>{visibleTabs.map(([tab, label]) => <button type="button" key={tab} className={props.tab === tab ? 'is-active' : ''} onClick={(event: Event) => { props.onTabChange(tab); (event.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}>{label}</button>)}</div>{canRight ? <button type="button" className="wof-inspector-tabs-arrow is-right" onClick={() => scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' })}><WooOptionsFic.Components.Dashicon name="arrow-right-alt2" /></button> : null}</div><div className="wof-inspector-body"><section className="wof-inspector-section">{props.tab === 'content' ? <><TextControl label={__('Label', 'wooptionsfic')} value={field.label} onChange={(label: string) => update({ label })} /><TextareaControl label={__('Description', 'wooptionsfic')} value={field.description} onChange={(description: string) => update({ description })} />{'placeholder' in field ? <TextControl label={__('Placeholder', 'wooptionsfic')} value={field.placeholder ?? ''} onChange={(placeholder: string) => update({ placeholder })} /> : null}{field.type === 'color_picker' ? <ChoiceColorControl label={__('Default color', 'wooptionsfic')} color={String(field.default ?? '#5B4FF5')} onChange={(color: string) => update({ default: color })} /> : null}<TextareaControl label={__('Help text', 'wooptionsfic')} value={field.help} onChange={(help: string) => update({ help })} /><ToggleControl label={__('Required', 'wooptionsfic')} checked={field.required} onChange={(required: boolean) => update({ required })} /></> : props.tab === 'choices' ? <ChoiceEditor field={field} onChange={props.onFieldChange} /> : props.tab === 'pricing' ? <PricingPanel field={field} onChange={props.onFieldChange} /> : props.tab === 'logic' ? <LogicEditor field={field} allFields={props.document.fields} onChange={props.onFieldChange} /> : props.tab === 'style' ? <StyleStudio document={props.document} onChange={props.onDocumentChange} /> : <><ToggleControl label={__('Disable this field', 'wooptionsfic')} checked={field.disabled} onChange={(disabled: boolean) => update({ disabled })} />{field.type === 'file' ? <><TextControl label={__('Allowed extensions', 'wooptionsfic')} value={(field.allowedExtensions ?? []).join(', ')} onChange={(value: string) => update({ allowedExtensions: value.split(',').map((item) => item.trim().replace(/^\./, '')).filter(Boolean) })} /><TextControl label={__('Maximum files', 'wooptionsfic')} type="number" value={String(field.maxFiles ?? 1)} onChange={(value: string) => update({ maxFiles: Math.max(1, Number(value)) })} /><TextControl label={__('Maximum file size (MB)', 'wooptionsfic')} type="number" value={String(field.maxFileMb ?? 5)} onChange={(value: string) => update({ maxFileMb: Math.max(1, Number(value)) })} /></> : null}{['number', 'range', 'quantity', 'customer_defined_price'].includes(field.type) ? <><TextControl label={__('Minimum', 'wooptionsfic')} value={field.min ?? ''} onChange={(value: string) => update({ min: value || null })} /><TextControl label={__('Maximum', 'wooptionsfic')} value={field.max ?? ''} onChange={(value: string) => update({ max: value || null })} /><TextControl label={__('Step', 'wooptionsfic')} value={field.step ?? ''} onChange={(value: string) => update({ step: value || null })} /></> : null}<TextControl label={__('Field UUID', 'wooptionsfic')} value={field.uuid} disabled /></>}</section></div></aside>;
  }
}
