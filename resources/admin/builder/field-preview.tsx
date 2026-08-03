namespace WooOptionsFic.Builder {
  const { __ } = wp.i18n;
  function choiceLabel(choice: WooOptionsFic.ChoiceDefinition): string {
    const amount = choice.pricing?.strategy === 'fixed' && choice.pricing.amount !== '0' ? ` · ${choice.pricing.amount}` : '';
    return `${choice.label}${amount}`;
  }

  function previewColor(field: WooOptionsFic.FieldDefinition): string {
    const value = String(field.default ?? '#5B4FF5').toUpperCase();
    return /^#[0-9A-F]{6}$/.test(value) ? value : '#5B4FF5';
  }

  export function FieldPreview(props: { field: WooOptionsFic.FieldDefinition }): any {
    const field = props.field;
    const choices = field.choices ?? [];

    if (field.type === 'heading') return <h3 className="wof-preview-heading">{field.label}</h3>;
    if (field.type === 'paragraph') return <p className="wof-preview-paragraph">{field.description || field.label}</p>;
    if (field.type === 'help') return <div className="wof-preview-help">{field.description || field.help || field.label}</div>;
    if (field.type === 'separator') return <hr className="wof-preview-separator" />;
    if (field.type === 'spacer') return <div className="wof-preview-spacer" style={{ height: `${Number((field.style as any)?.height ?? 24)}px` }} />;
    if (field.type === 'formula' || field.type === 'calculated') return <output className="wof-preview-output">0.00</output>;
    if (field.type === 'checkbox' || field.type === 'toggle') return <label className="wof-preview-boolean"><input type="checkbox" disabled /><span /><strong>{field.label}</strong></label>;

    if (field.type === 'textarea') {
      return <div className="wof-preview-textarea-wrap">
        <textarea className="wof-preview-textarea" readOnly tabIndex={-1} placeholder={field.placeholder || 'Enter text…'} />
        <small>{__('Multi-line text', 'wooptionsfic')}</small>
      </div>;
    }

    if (field.type === 'select') {
      return <div className="wof-preview-select-control">
        <select aria-disabled="true" tabIndex={-1} value="" onChange={() => undefined}><option value="">{choices[0]?.label ?? __('Choose an option', 'wooptionsfic')}</option></select>
        <WooOptionsFic.Components.Dashicon name="arrow-down-alt2" />
      </div>;
    }

    if (field.type === 'color_picker') {
      const color = previewColor(field);
      return <div className="wof-preview-color-picker">
        <span className="wof-preview-color-picker__swatch" style={{ background: color }} />
        <span><strong>{color}</strong><small>{__('Click to choose a color', 'wooptionsfic')}</small></span>
        <WooOptionsFic.Components.Dashicon name="admin-customizer" />
      </div>;
    }

    if (field.type === 'range') return <input disabled type="range" min={field.min ?? 0} max={field.max ?? 100} />;

    if (field.type === 'file') {
      const maxFiles = Math.max(1, Number(field.maxFiles ?? 1));
      const maxMb = Math.max(1, Number(field.maxFileMb ?? 5));
      return <div className="wof-preview-upload">
        <div className="wof-preview-upload__picker">
          <button type="button" className="wof-preview-upload__button" tabIndex={-1} aria-disabled="true"><WooOptionsFic.Components.Dashicon name="upload" />{__('Upload', 'wooptionsfic')}</button>
          <span>{__('Click or drag and drop', 'wooptionsfic')}</span>
          <small>{maxFiles === 1 ? `${maxMb} MB max` : `Up to ${maxFiles} files, ${maxMb} MB each`}</small>
        </div>
        <div className="wof-preview-upload__item">
          <span className="wof-preview-upload__remove" aria-hidden="true">×</span>
          <span className="wof-preview-upload__file-icon"><WooOptionsFic.Components.Dashicon name="media-default" /></span>
          <span className="wof-preview-upload__copy"><strong>{__('Uploaded file preview', 'wooptionsfic')}</strong><span className="wof-preview-upload__progress"><i /></span></span>
          <small>0.20 MB</small>
        </div>
      </div>;
    }

    if (field.type === 'date_range') return <div className="wof-preview-date-range"><input disabled type="date" /><span>to</span><input disabled type="date" /></div>;
    if (['radio', 'checkbox_group', 'segmented', 'font'].includes(field.type)) {
      return <div className="wof-preview-choice-row">{choices.slice(0, 4).map((choice, index) => <span className={index === 0 ? 'is-selected' : ''} key={choice.uuid}>{choiceLabel(choice)}</span>)}</div>;
    }
    if (field.type === 'color_swatch') {
      return <div className="wof-preview-swatches">{choices.slice(0, 5).map((choice, index) => <span className={index === 0 ? 'is-selected' : ''} style={{ background: choice.color || '#ddd' }} key={choice.uuid} />)}</div>;
    }
    if (field.type === 'image_swatch' || field.type === 'product') {
      return <div className="wof-preview-images">{choices.slice(0, 4).map((choice, index) => <span className={index === 0 ? 'is-selected' : ''} key={choice.uuid}>{choice.imageId || choice.imageUrl ? <WooOptionsFic.Components.MediaImage attachmentId={choice.imageId} src={choice.imageUrl} alt="" /> : <WooOptionsFic.Components.Dashicon name="format-image" />}<small>{choice.label}</small></span>)}</div>;
    }
    if (field.type === 'repeater') return <div className="wof-preview-repeater"><div><strong>Item 1</strong><small>{field.children?.length ?? 0} fields</small></div><button type="button" disabled>+ Add item</button></div>;

    const inputType: Record<string, string> = {
      password: 'password', tel: 'tel', email: 'email', url: 'url', number: 'number', quantity: 'number', date: 'date', time: 'time', datetime: 'datetime-local', customer_defined_price: 'number',
    };
    return <input disabled type={inputType[field.type] ?? 'text'} placeholder={field.placeholder || 'Enter value…'} />;
  }
}
