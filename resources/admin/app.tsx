namespace WooOptionsFic {
  const { useEffect, useState } = wp.element;
  const { __ } = wp.i18n;

  function routeFromLocation(): string {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    return hash || window.WooOptionsFicAdmin.initialRoute || 'dashboard';
  }

  export function App(): any {
    const [route, setRoute] = useState(routeFromLocation());
    useEffect(() => {
      const update = () => setRoute(routeFromLocation());
      window.addEventListener('hashchange', update);
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
