namespace WooOptionsFic.Components {
  const { __ } = wp.i18n;

  const navigation = [
    { route: 'dashboard', label: __('Dashboard', 'wooptionsfic'), icon: 'dashboard' },
    { route: 'option-sets', label: __('Option Sets', 'wooptionsfic'), icon: 'screenoptions' },
    { route: 'templates', label: __('Templates', 'wooptionsfic'), icon: 'star-filled' },
    { route: 'analytics', label: __('Analytics', 'wooptionsfic'), icon: 'chart-area' },
    { route: 'integrations', label: __('Integrations', 'wooptionsfic'), icon: 'admin-links' },
    { route: 'diagnostics', label: __('Diagnostics', 'wooptionsfic'), icon: 'yes-alt' },
    { route: 'settings', label: __('Settings', 'wooptionsfic'), icon: 'admin-settings' },
    { route: 'help', label: __('Help', 'wooptionsfic'), icon: 'editor-help' },
  ];

  export function AdminShell(props: { route: string; navigate: (route: string) => void; children?: any }): any {
    const isBuilder = props.route.startsWith('builder/');
    const isTemplateStudio = props.route === 'templates';
    if (isBuilder || isTemplateStudio) {
      return <div className={isBuilder ? "wof-admin is-builder" : "wof-admin is-template-studio"}><main className="wof-admin__content">{props.children}</main></div>;
    }
    return (
      <div className="wof-admin">
        <header className="wof-admin__masthead">
          <button type="button" className="wof-brand" onClick={() => props.navigate('dashboard')}>
            <span className="wof-brand-mark"><Dashicon name="screenoptions" /></span>
            <span className="wof-brand-copy"><strong>WooOptionsFic</strong><small>{__('Precision Workshop', 'wooptionsfic')}</small></span>
          </button>
          <div className="wof-masthead__meta">
            <span className="wof-beta-pill">{window.WooOptionsFicAdmin.version}</span>
            <span className="wof-user-chip">{window.WooOptionsFicAdmin.currentUser.name}</span>
          </div>
        </header>
        <div className="wof-admin__body">
          <nav className="wof-admin__nav" aria-label={__('WooOptionsFic sections', 'wooptionsfic')}>
            {navigation.map((item) => (
              <button
                type="button"
                key={item.route}
                className={props.route === item.route ? 'is-active' : ''}
                aria-current={props.route === item.route ? 'page' : undefined}
                onClick={() => props.navigate(item.route)}
              >
                <Dashicon name={item.icon} />
                {item.label}
              </button>
            ))}
            <div className="wof-nav__signal">
              <span className={window.WooOptionsFicAdmin.wooAvailable ? 'is-connected' : 'is-paused'} aria-hidden="true" />
              <div><strong>WooCommerce</strong><small>{window.WooOptionsFicAdmin.wooAvailable ? __('Connected', 'wooptionsfic') : __('Needs attention', 'wooptionsfic')}</small></div>
            </div>
          </nav>
          <main className="wof-admin__content">{props.children}</main>
        </div>
      </div>
    );
  }
}
