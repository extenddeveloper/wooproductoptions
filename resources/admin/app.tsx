namespace WooOptionsFic {
  const { useEffect, useState } = wp.element;
  const { __ } = wp.i18n;

  function routeFromLocation(): string {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    return hash || window.WooOptionsFicAdmin.initialRoute || 'dashboard';
  }

  export function injectCustomFontsCss(customFonts: any[]): void {
    if (!Array.isArray(customFonts) || customFonts.length === 0) return;
    let css = '';
    for (const font of customFonts) {
      const files = font.files || {};
      const sources: string[] = [];
      if (files.woff2) sources.push(`url('${files.woff2}') format('woff2')`, `url('${files.woff2}')`);
      if (files.woff) sources.push(`url('${files.woff}') format('woff')`, `url('${files.woff}')`);
      if (files.ttf) sources.push(`url('${files.ttf}') format('truetype')`, `url('${files.ttf}') format('opentype')`, `url('${files.ttf}')`);
      if (files.otf) sources.push(`url('${files.otf}') format('opentype')`, `url('${files.otf}') format('truetype')`, `url('${files.otf}')`);
      if (sources.length === 0) continue;
      const cleanName = (font.family || font.name || '').split(',')[0].replace(/['"]/g, '').trim();
      css += `@font-face {\n  font-family: '${cleanName}';\n  src: ${sources.join(', ')};\n  font-weight: 100 900;\n  font-style: ${font.style || 'normal'};\n  font-display: swap;\n}\n`;
      if (cleanName.includes(' ')) {
        css += `@font-face {\n  font-family: ${cleanName};\n  src: ${sources.join(', ')};\n  font-weight: 100 900;\n  font-style: ${font.style || 'normal'};\n  font-display: swap;\n}\n`;
      }
    }
    let el = document.getElementById('wof-dynamic-custom-fonts');
    if (!el) {
      el = document.createElement('style');
      el.id = 'wof-dynamic-custom-fonts';
      document.head.appendChild(el);
    }
    el.textContent = css;
  }

  export function App(): any {
    const [route, setRoute] = useState(routeFromLocation());
    useEffect(() => {
      const update = () => setRoute(routeFromLocation());
      window.addEventListener('hashchange', update);
      injectCustomFontsCss(((window.WooOptionsFicAdmin?.settings as any)?.custom_fonts) || []);
      return () => window.removeEventListener('hashchange', update);
    }, []);

    const navigate = (nextRoute: string) => {
      const nextHash = `#/${nextRoute}`;
      if (window.location.hash === nextHash) setRoute(nextRoute);
      else window.location.hash = nextHash;
    };

    let page: any;
    if (route.startsWith('builder/')) {
      page = <WooOptionsFic.Builder.BuilderPage uuid={route.slice('builder/'.length)} navigate={navigate} />;
    } else {
      switch (route) {
        case 'dashboard': page = <WooOptionsFic.Pages.Dashboard navigate={navigate} />; break;
        case 'option-sets': page = <WooOptionsFic.Pages.OptionSets navigate={navigate} />; break;
        case 'templates': page = <WooOptionsFic.Pages.Templates navigate={navigate} />; break;
        case 'analytics': page = <WooOptionsFic.Pages.Analytics />; break;
        case 'settings': page = <WooOptionsFic.Pages.Settings />; break;
        default: page = <div className="wof-fatal"><h1>{__('Page not found', 'wooptionsfic')}</h1><p>{__('This WooOptionsFic route does not exist.', 'wooptionsfic')}</p><button type="button" onClick={() => navigate('dashboard')}>{__('Open dashboard', 'wooptionsfic')}</button></div>;
      }
    }
    return <WooOptionsFic.Components.AdminShell route={route} navigate={navigate}>{page}</WooOptionsFic.Components.AdminShell>;
  }
}
