namespace WooOptionsFic.Builder {
  const { __ } = wp.i18n;
  const { useEffect, useMemo, useState } = wp.element;
  const FIELD_TYPE_MIME = 'application/x-wooptionsfic-field-type';
  const FIELD_INDEX_MIME = 'application/x-wooptionsfic-field-index';

  function hasBuilderDrag(event: DragEvent): boolean {
    const types = Array.from(event.dataTransfer?.types ?? []);
    return types.includes(FIELD_TYPE_MIME) || types.includes(FIELD_INDEX_MIME);
  }

  function CanvasField(props: {
    field: WooOptionsFic.FieldDefinition;
    index: number;
    count: number;
    selected: boolean;
    onSelect: () => void;
    onAdd: (field: WooOptionsFic.FieldDefinition, index?: number) => void;
    onMove: (from: number, to: number) => void;
    onDuplicate: () => void;
    onDelete: () => void;
  }): any {
    const [dropEdge, setDropEdge] = useState<'before' | 'after' | null>(null);

    const dragStart = (event: DragEvent) => {
      event.stopPropagation();
      event.dataTransfer?.setData(FIELD_INDEX_MIME, String(props.index));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    };

    const dragOver = (event: DragEvent) => {
      if (!hasBuilderDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(FIELD_TYPE_MIME) ? 'copy' : 'move';
      const element = event.currentTarget as HTMLElement;
      const bounds = element.getBoundingClientRect();
      setDropEdge(event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after');
    };

    const dragLeave = (event: DragEvent) => {
      const element = event.currentTarget as HTMLElement;
      if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      setDropEdge(null);
    };

    const drop = (event: DragEvent) => {
      if (!hasBuilderDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      const type = event.dataTransfer?.getData(FIELD_TYPE_MIME) ?? '';
      const sourceText = event.dataTransfer?.getData(FIELD_INDEX_MIME) ?? '';
      const insertIndex = props.index + (dropEdge === 'after' ? 1 : 0);
      setDropEdge(null);

      if (type) {
        props.onAdd(WooOptionsFic.FieldFactory.create(type), insertIndex);
        return;
      }

      const source = Number(sourceText);
      if (!Number.isInteger(source)) return;
      let finalIndex = insertIndex;
      if (source < insertIndex) finalIndex -= 1;
      finalIndex = Math.max(0, Math.min(props.count - 1, finalIndex));
      if (finalIndex !== source) props.onMove(source, finalIndex);
    };

    const width = props.field.width || '100%';
    const widthStyle: any = {
      width: width === '33%' ? 'calc(33.333% - 8px)' : width === '50%' ? 'calc(50% - 8px)' : width === '66%' ? 'calc(66.666% - 8px)' : '100%',
      flex: width === '33%' ? '0 0 calc(33.333% - 8px)' : width === '50%' ? '0 0 calc(50% - 8px)' : width === '66%' ? '0 0 calc(66.666% - 8px)' : '0 0 100%',
      boxSizing: 'border-box',
    };

    const typeLabel = window.WooOptionsFicAdmin?.fieldTypes?.[props.field.type]?.label ?? props.field.type;

    return <article
      className={WooOptionsFic.Utils.classNames(
        'wof-canvas-field',
        props.selected && 'is-selected',
        props.field.disabled && 'is-disabled',
        dropEdge === 'before' && 'is-drop-before',
        dropEdge === 'after' && 'is-drop-after',
        `wof-canvas-field--width-${width.replace('%', '')}`
      )}
      style={widthStyle}
      onDragOver={dragOver}
      onDragLeave={dragLeave}
      onDrop={drop}
      onClick={props.onSelect}
      data-field-uuid={props.field.uuid}
    >
      {props.selected ? (
        <span className="wof-canvas-field__type-badge">
          {typeLabel}
        </span>
      ) : null}

      <div className="wof-canvas-field__toolbar" onClick={(event: Event) => event.stopPropagation()}>
        <button type="button" draggable className="wof-canvas-field__drag-handle" onDragStart={dragStart} onDragEnd={() => setDropEdge(null)} aria-label={__('Drag field', 'wooptionsfic')} title={__('Drag to reorder', 'wooptionsfic')}><WooOptionsFic.Components.GripIcon /></button>
        <button type="button" onClick={props.onSelect} aria-label={__('Field settings', 'wooptionsfic')} title={__('Settings', 'wooptionsfic')}><WooOptionsFic.Components.Dashicon name="admin-generic" /></button>
        <button type="button" onClick={props.onDuplicate} aria-label={__('Duplicate field', 'wooptionsfic')} title={__('Duplicate', 'wooptionsfic')}><WooOptionsFic.Components.Dashicon name="admin-page" /></button>
        <button type="button" className="is-destructive" onClick={props.onDelete} aria-label={__('Delete field', 'wooptionsfic')} title={__('Delete', 'wooptionsfic')}><WooOptionsFic.Components.Dashicon name="trash" /></button>
      </div>

      <div className="wof-canvas-field__copy">
        <strong className="wof-canvas-field__title">
          {props.field.label || __('Untitled field', 'wooptionsfic')}
          {props.field.help && props.field.helpTextPosition === 'tooltip' ? (
            <span
              className="wof-field__tooltip-preview"
              title={props.field.help}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
          ) : null}
        </strong>
        {props.field.required ? <span className="wof-canvas-field__required">{__('REQUIRED', 'wooptionsfic')}</span> : null}
        {props.field.help && (props.field.helpTextPosition === 'below_title' || !props.field.helpTextPosition) ? (
          <p className="wof-canvas-field__help-text wof-canvas-field__help-text--below-title">
            {props.field.help}
          </p>
        ) : null}
        {props.field.choices?.length ? (
          <small className="wof-canvas-field__meta">{props.field.choices.length} {__('Choices', 'wooptionsfic')}</small>
        ) : null}
      </div>

      <div className="wof-canvas-field__preview"><FieldPreview field={props.field} /></div>
      {props.field.help && props.field.helpTextPosition === 'below_field' ? (
        <p className="wof-canvas-field__help-text wof-canvas-field__help-text--below-field">
          {props.field.help}
        </p>
      ) : null}
    </article>;
  }

  export function Canvas(props: {
    document: WooOptionsFic.OptionSetDefinition;
    selectedUuid: string | null;
    device: WooOptionsFic.PreviewDevice;
    onSelect: (uuid: string) => void;
    onAdd: (field: WooOptionsFic.FieldDefinition, index?: number) => void;
    onMove: (from: number, to: number) => void;
    onDuplicate: (field: WooOptionsFic.FieldDefinition) => void;
    onDelete: (uuid: string) => void;
  }): any {
    const [zoom, setZoom] = useState(100);
    const [dragActive, setDragActive] = useState(false);
    const palette = window.WooOptionsFicAdmin.palettes[props.document.style.palette] ?? window.WooOptionsFicAdmin.palettes['iris-studio'];
    const tokens = { ...(palette?.tokens ?? {}), ...(props.document.style.overrides ?? {}) };
    const typography = props.document.style.typography ?? { family: 'inherit' };
    const fontStack: Record<string, string> = {
      inherit: 'inherit',
      'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      Inter: 'Inter, system-ui, sans-serif',
      Manrope: 'Manrope, system-ui, sans-serif',
      Poppins: 'Poppins, system-ui, sans-serif',
      Outfit: 'Outfit, system-ui, sans-serif',
      'Plus Jakarta Sans': '"Plus Jakarta Sans", system-ui, sans-serif',
      Roboto: 'Roboto, system-ui, sans-serif',
    };
    const style = useMemo(() => ({
      '--wof-preview-primary': tokens.primary ?? '#5B4FF5',
      '--wof-preview-background': tokens.background ?? '#F7F7FC',
      '--wof-preview-surface': tokens.surface ?? '#FFFFFF',
      '--wof-preview-text': tokens.text ?? '#172033',
      '--wof-preview-muted': tokens.muted ?? '#5E6A7D',
      '--wof-preview-border': tokens.border ?? '#D8DEEA',
      '--wof-preview-font': fontStack[typography.family] ?? typography.family ?? 'inherit',
      '--wof-preview-label-weight': String(typography.labelWeight ?? 650),
      zoom: zoom / 100,
    } as any), [props.document.style, zoom]);

    useEffect(() => {
      const reset = () => setDragActive(false);
      document.addEventListener('dragend', reset);
      document.addEventListener('drop', reset);
      return () => {
        document.removeEventListener('dragend', reset);
        document.removeEventListener('drop', reset);
      };
    }, []);

    const dropAtEnd = (event: DragEvent) => {
      if (!hasBuilderDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const type = event.dataTransfer?.getData(FIELD_TYPE_MIME) ?? '';
      const source = Number(event.dataTransfer?.getData(FIELD_INDEX_MIME));
      if (type) props.onAdd(WooOptionsFic.FieldFactory.create(type));
      else if (Number.isInteger(source)) props.onMove(source, props.document.fields.length - 1);
    };

    const canvasDragOver = (event: DragEvent) => {
      if (!hasBuilderDrag(event)) return;
      event.preventDefault();
      setDragActive(true);
      if (event.dataTransfer) event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(FIELD_TYPE_MIME) ? 'copy' : 'move';
    };

    const canvasDragLeave = (event: DragEvent) => {
      const element = event.currentTarget as HTMLElement;
      if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      setDragActive(false);
    };

    return <section className={WooOptionsFic.Utils.classNames('wof-builder-canvas', 'is-edit-mode', dragActive && 'is-drag-active')}>
      <div className="wof-canvas-toolbar"><div className="wof-canvas-toolbar__copy"><h2>{__('Live storefront canvas', 'wooptionsfic')}</h2><p>{__('The builder and product page use the same component stylesheet.', 'wooptionsfic')}</p></div><div className="wof-canvas-toolbar__controls"><div className="wof-zoom-control"><button type="button" disabled={zoom <= 75} onClick={() => setZoom(Math.max(75, zoom - 10))}><WooOptionsFic.Components.Dashicon name="minus" /></button><output>{zoom}%</output><button type="button" disabled={zoom >= 125} onClick={() => setZoom(Math.min(125, zoom + 10))}><WooOptionsFic.Components.Dashicon name="plus-alt2" /></button></div><span className="wof-interactive-status"><i />{__('Interactive', 'wooptionsfic')}</span></div></div>
      <div className={`wof-canvas-device is-${props.device}`} style={style}>
        <div className="wof-canvas-device__chrome"><span>{__('Live customer preview', 'wooptionsfic')}</span><small>{props.device} · {props.document.layout.type}</small></div>
        <div className="wof-canvas-frame"><div className={WooOptionsFic.Utils.classNames('wof-canvas-sheet', dragActive && 'is-drag-active')} onDragEnter={canvasDragOver} onDragOver={canvasDragOver} onDragLeave={canvasDragLeave} onDrop={dropAtEnd}><div className="wof-product-shell"><aside className="wof-product-shell__media"><div className="wof-product-gallery__hero"><WooOptionsFic.Components.Dashicon name="format-image" /></div><div className="wof-product-gallery__thumbs"><div className="wof-product-gallery__thumb"><WooOptionsFic.Components.Dashicon name="format-image" /></div><div className="wof-product-gallery__thumb"><WooOptionsFic.Components.Dashicon name="format-image" /></div><div className="wof-product-gallery__thumb"><WooOptionsFic.Components.Dashicon name="format-image" /></div></div></aside><div className="wof-product-shell__content"><div className="wof-product-preview-meta"><span className="wof-product-preview-meta__eyebrow">{__('Live product preview', 'wooptionsfic')}</span><h1>{__('WooOptionsFic Product (Preview)', 'wooptionsfic')}</h1><strong className="wof-product-preview-meta__price">{`20.00 ${(window as any).WooOptionsFicAdmin?.currency || 'USD'}`}</strong></div>{props.document.fields.length ? <div className={`wof-canvas-fields is-${props.document.layout.type}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>{props.document.fields.map((field, index) => <CanvasField key={field.uuid} field={field} index={index} count={props.document.fields.length} selected={field.uuid === props.selectedUuid} onSelect={() => props.onSelect(field.uuid)} onAdd={props.onAdd} onMove={props.onMove} onDuplicate={() => props.onDuplicate(field)} onDelete={() => props.onDelete(field.uuid)} />)}<div className={WooOptionsFic.Utils.classNames('wof-canvas-drop-end', dragActive && 'is-active')} onDragOver={canvasDragOver} onDrop={dropAtEnd}><WooOptionsFic.Components.Dashicon name="plus-alt2" />{__('Drop a field here', 'wooptionsfic')}</div></div> : <div className={WooOptionsFic.Utils.classNames('wof-canvas-empty', dragActive && 'is-active')} onDragOver={canvasDragOver} onDrop={dropAtEnd}><div><WooOptionsFic.Components.Dashicon name="layout" /></div><h3>{__('Your canvas is ready', 'wooptionsfic')}</h3><p>{__('Choose a field from the palette or drag one into this product page preview.', 'wooptionsfic')}</p></div>}</div></div></div></div>
      </div>
    </section>;
  }
}
