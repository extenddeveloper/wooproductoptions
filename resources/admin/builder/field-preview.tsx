namespace WooOptionsFic.Builder {
  const { __ } = wp.i18n;

  export function formatChoicePrice(pricing?: WooOptionsFic.PricingDefinition): string {
    if (!pricing || pricing.strategy === 'none') return '';
    const adminConfig = (window as any).WooOptionsFicAdmin;
    const symbol = adminConfig?.currencySymbol || adminConfig?.currency || '$';
    if (pricing.strategy === 'fixed') {
      const raw = String(pricing.amount ?? '0').trim();
      if (!raw || raw === '0') return '';
      const isNegative = raw.startsWith('-');
      const clean = isNegative ? raw.slice(1) : raw.startsWith('+') ? raw.slice(1) : raw;
      const prefix = isNegative ? '-' : '+';
      return `${prefix}${symbol}${clean}`;
    }
    if (pricing.strategy === 'percentage') {
      const raw = String(pricing.percent ?? '0').trim();
      if (!raw || raw === '0') return '';
      const isNegative = raw.startsWith('-');
      const clean = isNegative ? raw.slice(1) : raw.startsWith('+') ? raw.slice(1) : raw;
      const prefix = isNegative ? '-' : '+';
      return `${prefix}${clean}%`;
    }
    return '';
  }

  function choiceLabel(choice: WooOptionsFic.ChoiceDefinition): string {
    const priceText = formatChoicePrice(choice.pricing);
    const amount = priceText ? ` · ${priceText}` : '';
    return `${choice.label}${amount}`;
  }

  function previewColor(field: WooOptionsFic.FieldDefinition): string {
    const value = String(field.default ?? '#5B4FF5').toUpperCase();
    return /^#[0-9A-F]{6}$/.test(value) ? value : '#5B4FF5';
  }

  function renderCheckSvg(size = 11): any {
    return (
      <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" aria-hidden="true" style={{ display: 'block' }}>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }

  function renderFlagSvg(country: string): any {
    const c = (country || 'US').toUpperCase();
    const style: any = { borderRadius: '2px', overflow: 'hidden', flexShrink: 0, display: 'block', boxShadow: '0 0 1px rgba(0,0,0,0.3)' };

    if (c === 'BD') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#006A4E" /><circle cx="9" cy="7" r="4.2" fill="#F42A41" /></svg>;
    if (c === 'US') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#B22234" /><rect y="2.1" width="20" height="2" fill="#FFFFFF" /><rect y="6.3" width="20" height="2" fill="#FFFFFF" /><rect y="10.5" width="20" height="2" fill="#FFFFFF" /><rect width="8" height="7.2" fill="#3C3B6E" /><circle cx="4" cy="3.6" r="1.5" fill="#FFFFFF" /></svg>;
    if (c === 'GB') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#012169" /><path d="M0 0L20 14M20 0L0 14" stroke="#FFFFFF" strokeWidth="2.5" /><path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" /><path d="M10 0v14M0 7h20" stroke="#FFFFFF" strokeWidth="4" /><path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.2" /></svg>;
    if (c === 'CA') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#D80027" /><rect x="5" width="10" height="14" fill="#FFFFFF" /><polygon points="10,2.5 11,5.5 13.5,5 12,7 13.5,8.5 11,8 10.5,11 9.5,11 9,8 6.5,8.5 8,7 6.5,5 9,5.5" fill="#D80027" /></svg>;
    if (c === 'AU') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#00008B" /><circle cx="14" cy="4" r="1" fill="#FFFFFF" /><circle cx="16" cy="7" r="1" fill="#FFFFFF" /><circle cx="13" cy="10" r="1" fill="#FFFFFF" /></svg>;
    if (c === 'DE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#000000" /><rect y="4.66" width="20" height="4.66" fill="#DD0000" /><rect y="9.33" width="20" height="4.67" fill="#FFCE00" /></svg>;
    if (c === 'FR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#002654" /><rect x="6.6" width="6.8" height="14" fill="#FFFFFF" /><rect x="13.4" width="6.6" height="14" fill="#CE1126" /></svg>;
    if (c === 'IT') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#009246" /><rect x="6.6" width="6.8" height="14" fill="#FFFFFF" /><rect x="13.4" width="6.6" height="14" fill="#CE2B37" /></svg>;
    if (c === 'ES') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="3.5" fill="#AA151B" /><rect y="3.5" width="20" height="7" fill="#F1BF00" /><rect y="10.5" width="20" height="3.5" fill="#AA151B" /></svg>;
    if (c === 'NL') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#AE1C28" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#21468B" /></svg>;
    if (c === 'BR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#009C3B" /><polygon points="10,2 18,7 10,12 2,7" fill="#FEDF00" /><circle cx="10" cy="7" r="2.5" fill="#002776" /></svg>;
    if (c === 'IN') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#FF9933" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#138808" /><circle cx="10" cy="7" r="1.8" fill="#000080" /></svg>;
    if (c === 'CN') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#DE2910" /><polygon points="4,2.5 4.6,4.2 6.2,4.2 4.9,5.2 5.4,6.8 4,5.8 2.6,6.8 3.1,5.2 1.8,4.2 3.4,4.2" fill="#FFDE00" /></svg>;
    if (c === 'JP') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#FFFFFF" /><circle cx="10" cy="7" r="4" fill="#BC002D" /></svg>;
    if (c === 'KR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#FFFFFF" /><circle cx="10" cy="7" r="3.5" fill="#CD2E3A" /><path d="M10 7a3.5 3.5 0 0 1 0 3.5 3.5 3.5 0 0 0 0-7z" fill="#0047A0" /></svg>;
    if (c === 'MX') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#006847" /><rect x="6.6" width="6.8" height="14" fill="#FFFFFF" /><rect x="13.4" width="6.6" height="14" fill="#CE1126" /><circle cx="10" cy="7" r="1.5" fill="#8B5A2B" /></svg>;
    if (c === 'AE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect y="0" width="20" height="4.66" fill="#00732F" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#000000" /><rect width="5" height="14" fill="#FF0000" /></svg>;
    if (c === 'SA') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#006C35" /><rect x="4" y="6.2" width="12" height="1.6" fill="#FFFFFF" /></svg>;
    if (c === 'SG') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="7" fill="#ED2939" /><rect y="7" width="20" height="7" fill="#FFFFFF" /><circle cx="4.5" cy="3.5" r="2.2" fill="#FFFFFF" /><circle cx="5.2" cy="3.5" r="1.8" fill="#ED2939" /></svg>;
    if (c === 'PK') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="5" height="14" fill="#FFFFFF" /><rect x="5" width="15" height="14" fill="#01411C" /><circle cx="12" cy="7" r="3.2" fill="#FFFFFF" /><circle cx="13" cy="6.4" r="2.7" fill="#01411C" /></svg>;
    if (c === 'ZA') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="7" fill="#E03C31" /><rect y="7" width="20" height="7" fill="#001489" /><polygon points="0,0 8,7 0,14" fill="#000000" /><path d="M0 0l8.5 7-8.5 7h3l7-5.5v-3l-7-5.5z" fill="#FFB81C" /><path d="M8 5.5h12v3h-12z" fill="#007749" /></svg>;
    if (c === 'TR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#E30A17" /><circle cx="8" cy="7" r="3.5" fill="#FFFFFF" /><circle cx="9" cy="7" r="2.8" fill="#E30A17" /><polygon points="12.5,5.5 13.5,7 15,7 13.8,8 14.2,9.5 13,8.5 11.8,9.5 12.2,8 11,7 12.5,7" fill="#FFFFFF" /></svg>;
    if (c === 'SE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#005293" /><rect x="6" width="3" height="14" fill="#FECB00" /><rect y="5.5" width="20" height="3" fill="#FECB00" /></svg>;
    if (c === 'CH') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#D52B1E" /><rect x="8.5" y="3" width="3" height="8" fill="#FFFFFF" /><rect x="6" y="5.5" width="8" height="3" fill="#FFFFFF" /></svg>;
    if (c === 'PL') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="7" fill="#FFFFFF" /><rect y="7" width="20" height="7" fill="#DC143C" /></svg>;
    if (c === 'AR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#74ACDF" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#74ACDF" /><circle cx="10" cy="7" r="1.6" fill="#F6B40E" /></svg>;
    if (c === 'BE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#000000" /><rect x="6.6" width="6.8" height="14" fill="#FDDA24" /><rect x="13.4" width="6.6" height="14" fill="#EF3340" /></svg>;
    if (c === 'AT') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#ED2939" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#ED2939" /></svg>;
    if (c === 'NO') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#BA0C2F" /><rect x="5.5" width="4" height="14" fill="#FFFFFF" /><rect y="5" width="20" height="4" fill="#FFFFFF" /><rect x="6.5" width="2" height="14" fill="#00205B" /><rect y="6" width="20" height="2" fill="#00205B" /></svg>;
    if (c === 'DK') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#C60C30" /><rect x="6" width="2.5" height="14" fill="#FFFFFF" /><rect y="5.7" width="20" height="2.5" fill="#FFFFFF" /></svg>;
    if (c === 'FI') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#FFFFFF" /><rect x="6" width="3" height="14" fill="#002F6C" /><rect y="5.5" width="20" height="3" fill="#002F6C" /></svg>;
    if (c === 'IE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#169B62" /><rect x="6.6" width="6.8" height="14" fill="#FFFFFF" /><rect x="13.4" width="6.6" height="14" fill="#FF883E" /></svg>;
    if (c === 'NZ') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#00247D" /><circle cx="14" cy="4" r="1.1" fill="#CC142B" /><circle cx="16.5" cy="7" r="1.1" fill="#CC142B" /><circle cx="13" cy="10" r="1.1" fill="#CC142B" /></svg>;
    if (c === 'PT') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="8" height="14" fill="#046A38" /><rect x="8" width="12" height="14" fill="#DA291C" /><circle cx="8" cy="7" r="2.5" fill="#FFE900" /></svg>;
    if (c === 'GR') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#0D5EAF" /><rect y="1.5" width="20" height="1.5" fill="#FFFFFF" /><rect y="4.6" width="20" height="1.5" fill="#FFFFFF" /><rect y="7.7" width="20" height="1.5" fill="#FFFFFF" /><rect y="10.8" width="20" height="1.5" fill="#FFFFFF" /><rect width="7.5" height="7.7" fill="#0D5EAF" /><rect x="3" width="1.5" height="7.7" fill="#FFFFFF" /><rect y="3.1" width="7.5" height="1.5" fill="#FFFFFF" /></svg>;
    if (c === 'IL') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#FFFFFF" /><rect y="1.5" width="20" height="2" fill="#0038B8" /><rect y="10.5" width="20" height="2" fill="#0038B8" /><polygon points="10,4.5 12,8 8,8" stroke="#0038B8" strokeWidth="0.7" fill="none" /><polygon points="10,9 12,5.5 8,5.5" stroke="#0038B8" strokeWidth="0.7" fill="none" /></svg>;
    if (c === 'HK') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#C8102E" /><circle cx="10" cy="7" r="3" fill="#FFFFFF" /></svg>;
    if (c === 'MY') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#CC0000" /><rect y="2" width="20" height="2" fill="#FFFFFF" /><rect y="6" width="20" height="2" fill="#FFFFFF" /><rect y="10" width="20" height="2" fill="#FFFFFF" /><rect width="10" height="8" fill="#010066" /><circle cx="5" cy="4" r="2.5" fill="#FFCC00" /><circle cx="5.8" cy="4" r="2.1" fill="#010066" /></svg>;
    if (c === 'PH') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="7" fill="#0038A8" /><rect y="7" width="20" height="7" fill="#CE1126" /><polygon points="0,0 8,7 0,14" fill="#FFFFFF" /><circle cx="2.8" cy="7" r="1.3" fill="#FCD116" /></svg>;
    if (c === 'ID') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="7" fill="#CE1126" /><rect y="7" width="20" height="7" fill="#FFFFFF" /></svg>;
    if (c === 'TH') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#A51931" /><rect y="2.3" width="20" height="9.4" fill="#F4F5F8" /><rect y="4.6" width="20" height="4.8" fill="#2D2A4A" /></svg>;
    if (c === 'VN') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="14" fill="#DA251D" /><polygon points="10,3.5 11.2,7.2 14.8,7.2 11.9,9.4 13,13 10,10.8 7,13 8.1,9.4 5.2,7.2 8.8,7.2" fill="#FFFF00" /></svg>;
    if (c === 'EG') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4.66" fill="#CE1126" /><rect y="4.66" width="20" height="4.66" fill="#FFFFFF" /><rect y="9.33" width="20" height="4.67" fill="#000000" /><circle cx="10" cy="7" r="1.3" fill="#C09A3E" /></svg>;
    if (c === 'NG') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="6.6" height="14" fill="#008751" /><rect x="6.6" width="6.8" height="14" fill="#FFFFFF" /><rect x="13.4" width="6.6" height="14" fill="#008751" /></svg>;
    if (c === 'KE') return <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}><rect width="20" height="4" fill="#000000" /><rect y="4" width="20" height="1" fill="#FFFFFF" /><rect y="5" width="20" height="4" fill="#922529" /><rect y="9" width="20" height="1" fill="#FFFFFF" /><rect y="10" width="20" height="4" fill="#006600" /><ellipse cx="10" cy="7" rx="2" ry="3.5" fill="#922529" /><ellipse cx="10" cy="7" rx="0.5" ry="3.5" fill="#FFFFFF" /></svg>;

    return (
      <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" style={style}>
        <rect width="20" height="14" fill="#334155" />
        <text x="10" y="10" fontFamily="-apple-system,sans-serif" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">{c.slice(0, 2)}</text>
      </svg>
    );
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
      return (
        <div className="wof-preview-textarea-wrap">
          <textarea className="wof-preview-textarea" readOnly tabIndex={-1} placeholder={field.placeholder || __('Enter text…', 'wooptionsfic')} />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div className="wof-preview-select-control">
          <select aria-disabled="true" tabIndex={-1} value="" onChange={() => undefined}><option value="">{choices[0]?.label ?? __('Choose an option', 'wooptionsfic')}</option></select>
          <WooOptionsFic.Components.Dashicon name="arrow-down-alt2" />
        </div>
      );
    }

    if (field.type === 'color_picker') {
      const color = previewColor(field);
      return (
        <div className="wof-preview-color-picker">
          <span className="wof-preview-color-picker__swatch" style={{ background: color }} />
          <span><strong>{color}</strong><small>{__('Click to choose a color', 'wooptionsfic')}</small></span>
          <WooOptionsFic.Components.Dashicon name="admin-customizer" />
        </div>
      );
    }

    if (field.type === 'range') return <input disabled type="range" min={field.min ?? 0} max={field.max ?? 100} />;

    if (field.type === 'file') {
      const maxFiles = Math.max(1, Number(field.maxFiles ?? 1));
      const maxMb = Math.max(1, Number(field.maxFileMb ?? 5));
      return (
        <div className="wof-preview-upload">
          <div className="wof-preview-upload__picker">
            <button type="button" className="wof-preview-upload__button" tabIndex={-1} aria-disabled="true"><WooOptionsFic.Components.Dashicon name="upload" />{__('Upload', 'wooptionsfic')}</button>
            <span>{__('Click or drag and drop', 'wooptionsfic')}</span>
            <small>{maxFiles === 1 ? `${maxMb} MB max` : `Up to ${maxFiles} files, ${maxMb} MB each`}</small>
          </div>
        </div>
      );
    }

    if (field.type === 'date_range') return <div className="wof-preview-date-range"><input disabled type="date" /><span>to</span><input disabled type="date" /></div>;

    if (field.type === 'tel') {
      const flagStyle = field.flagStyle ?? 'number_only';
      const country = (field.defaultCountry ?? 'US').toUpperCase();
      const dialCodes: Record<string, string> = {
        US: '+1', GB: '+44', CA: '+1', AU: '+61', DE: '+49', FR: '+33', IT: '+39', ES: '+34',
        NL: '+31', BR: '+55', IN: '+91', CN: '+86', JP: '+81', KR: '+82', MX: '+52', AE: '+971',
        SA: '+966', SG: '+65', BD: '+880', PK: '+92', ZA: '+27', TR: '+90', SE: '+46', CH: '+41',
        PL: '+48', AR: '+54', BE: '+32', AT: '+43', NO: '+47', DK: '+45', FI: '+358', IE: '+353',
        NZ: '+64', PT: '+351', GR: '+30', IL: '+972', HK: '+852', MY: '+60', PH: '+63', ID: '+62',
        TH: '+66', VN: '+84', EG: '+20', NG: '+234', KE: '+254',
      };
      const dialCode = dialCodes[country] ?? '+1';

      if (flagStyle === 'number_only') {
        return <input disabled type="tel" placeholder={field.placeholder || __('Enter phone number…', 'wooptionsfic')} />;
      }

      return (
        <div className="wof-preview-tel-wrap">
          <div className="wof-preview-tel-flag">
            {renderFlagSvg(country)}
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{country}</span>
            {flagStyle === 'number_flag_dialcode' ? <span style={{ color: '#64748b', fontSize: '12px' }}>{dialCode}</span> : null}
            <svg viewBox="0 0 20 20" width="12" height="12" fill="#64748b" style={{ display: 'block' }}><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
          <input disabled type="tel" placeholder={field.placeholder || __('Enter phone number…', 'wooptionsfic')} />
        </div>
      );
    }

    if (field.type === 'radio') {
      const itemStyle: any = {};
      const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
      if (hasRadius) itemStyle.borderRadius = `${field.choiceBorderRadius}px`;
      return <div className="wof-preview-radio-list">{choices.slice(0, 4).map((choice, index) => <label className={`wof-preview-radio-item${index === 0 ? ' is-selected' : ''}`} key={choice.uuid} style={itemStyle}><span className="wof-preview-radio-item__indicator" /><div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}><span className="wof-preview-radio-item__label">{choice.label}</span>{formatChoicePrice(choice.pricing) ? <span className="wof-preview-radio-item__price">{formatChoicePrice(choice.pricing)}</span> : null}{field.enableQuantity ? <span className="wof-choice-qty-wrap" style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex' }}><input disabled type="number" className="wof-choice-qty-input" defaultValue={field.minQuantity ?? 1} style={{ width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' }} /></span> : null}</div></label>)}</div>;
    }

    if (field.type === 'checkbox_group') {
      const itemStyle: any = {};
      const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
      if (hasRadius) itemStyle.borderRadius = `${field.choiceBorderRadius}px`;
      return <div className="wof-preview-checkbox-list">{choices.slice(0, 4).map((choice, index) => <label className={`wof-preview-checkbox-item${index === 0 ? ' is-selected' : ''}`} key={choice.uuid} style={itemStyle}><span className="wof-preview-checkbox-item__indicator" /><div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}><span className="wof-preview-checkbox-item__label">{choice.label}</span>{formatChoicePrice(choice.pricing) ? <span className="wof-preview-checkbox-item__price">{formatChoicePrice(choice.pricing)}</span> : null}{field.enableQuantity ? <span className="wof-choice-qty-wrap" style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex' }}><input disabled type="number" className="wof-choice-qty-input" defaultValue={field.minQuantity ?? 1} style={{ width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' }} /></span> : null}</div></label>)}</div>;
    }

    if (['segmented', 'font'].includes(field.type)) {
      const isVertical = field.type === 'segmented' && field.displayDirection === 'vertical';
      const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
      const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
      const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';

      const btnStyle: any = {};
      if (hasWidth) btnStyle.minWidth = `${field.choiceWidth}px`;
      if (hasHeight) btnStyle.minHeight = `${field.choiceHeight}px`;
      if (hasRadius) btnStyle.borderRadius = `${field.choiceBorderRadius}px`;

      const wrapStyle: any = {
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        flexWrap: isVertical ? 'nowrap' : 'wrap',
        gap: '8px',
        alignItems: isVertical ? 'flex-start' : 'center',
      };

      return (
        <div style={wrapStyle}>
          {choices.slice(0, 4).map((choice, index) => {
            const priceText = formatChoicePrice(choice.pricing);
            const isSelected = Boolean(choice.default) || (index === 0 && !choices.some((c) => c.default));
            return (
              <span
                key={choice.uuid}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  minHeight: btnStyle.minHeight ?? '40px',
                  minWidth: btnStyle.minWidth,
                  borderRadius: hasRadius ? `${field.choiceBorderRadius}px` : undefined,
                  border: isSelected ? '1.5px solid var(--wof-preview-primary, #5b4ff5)' : '1px solid var(--wof-preview-border, #d8deea)',
                  background: isSelected ? 'color-mix(in srgb, var(--wof-preview-primary, #5b4ff5) 5%, var(--wof-preview-surface, #fff))' : 'var(--wof-preview-surface, #fff)',
                  color: 'var(--wof-preview-text, #172033)',
                  fontSize: '13px',
                  fontWeight: 550,
                  boxShadow: 'none',
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                {Boolean(choice.imageId || choice.imageUrl) ? (
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#f1f5f9',
                    }}
                  >
                    <WooOptionsFic.Components.MediaImage attachmentId={choice.imageId} src={choice.imageUrl} alt="" />
                  </span>
                ) : null}
                <span>{choice.label}</span>
                {priceText ? <span style={{ fontSize: '11px', opacity: 0.72 }}>{priceText}</span> : null}
              </span>
            );
          })}
        </div>
      );
    }

    if (field.type === 'color_swatch') {
      const swatchStyle: any = {};
      const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
      const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
      const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';

      if (hasWidth) swatchStyle.width = `${field.choiceWidth}px`;
      if (hasHeight) swatchStyle.height = `${field.choiceHeight}px`;
      if (hasRadius) swatchStyle.borderRadius = `${field.choiceBorderRadius}px`;

      return <div className="wof-preview-color-blocks">{choices.slice(0, 5).map((choice, index) => <div className={`wof-preview-color-block${index === 0 ? ' is-selected' : ''}`} key={choice.uuid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span className="wof-preview-color-block__swatch" style={{ background: choice.color || '#ddd', ...swatchStyle, position: 'relative' }}>{index === 0 ? <span className="wof-preview-color-block__check" style={{ position: 'absolute', top: '2px', right: '2px', background: '#172033', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', zIndex: 3 }}>{renderCheckSvg(10)}</span> : null}</span><small style={{ minHeight: '1.3em', marginTop: '4px' }}>{choice.label}</small><span className="wof-preview-color-block__price" style={{ minHeight: '1.3em' }}>{formatChoicePrice(choice.pricing)}</span>{field.enableQuantity ? <span className="wof-choice-qty-wrap" style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'center', width: '100%' }}><input disabled type="number" className="wof-choice-qty-input" defaultValue={field.minQuantity ?? 1} style={{ width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' }} /></span> : null}</div>)}</div>;
    }

    if (field.type === 'image_swatch' || field.type === 'product') {
      const thumbStyle: any = {};
      const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
      const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
      const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';

      if (hasWidth) thumbStyle.width = `${field.choiceWidth}px`;
      if (hasHeight) thumbStyle.height = `${field.choiceHeight}px`;
      if (hasRadius) thumbStyle.borderRadius = `${field.choiceBorderRadius}px`;

      return (
        <div className="wof-preview-image-tiles">
          {choices.slice(0, 4).map((choice, index) => (
            <div className={`wof-preview-image-tile${index === 0 ? ' is-selected' : ''}`} key={choice.uuid} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="wof-preview-image-tile__thumb" style={{ ...thumbStyle, position: 'relative' }}>
                {choice.imageId || choice.imageUrl ? <WooOptionsFic.Components.MediaImage attachmentId={choice.imageId} src={choice.imageUrl} alt="" /> : <WooOptionsFic.Components.Dashicon name="format-image" />}
                {index === 0 ? <span className="wof-preview-image-tile__check" style={{ position: 'absolute', top: '2px', right: '2px', background: '#172033', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', zIndex: 3 }}>{renderCheckSvg(10)}</span> : null}
              </span>
              <small style={{ minHeight: '1.3em', marginTop: '4px' }}>{choice.label}</small>
              <span className="wof-preview-image-tile__price" style={{ minHeight: '1.3em' }}>{formatChoicePrice(choice.pricing)}</span>
              {field.enableQuantity ? (
                <span className="wof-choice-qty-wrap" style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <input disabled type="number" className="wof-choice-qty-input" defaultValue={field.minQuantity ?? 1} style={{ width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' }} />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      );
    }

    if (field.type === 'repeater') return <div className="wof-preview-repeater"><div><strong>Item 1</strong><small>{field.children?.length ?? 0} fields</small></div><button type="button" disabled>+ Add item</button></div>;

    const inputType: Record<string, string> = {
      password: 'password', tel: 'tel', email: 'email', url: 'url', number: 'number', quantity: 'number', date: 'date', time: 'time', datetime: 'datetime-local', customer_defined_price: 'number',
    };
    return <input disabled type={inputType[field.type] ?? 'text'} placeholder={field.placeholder || __('Enter value…', 'wooptionsfic')} />;
  }
}
