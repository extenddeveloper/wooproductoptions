namespace WooOptionsFic.Components {
  const { __ } = wp.i18n;

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
          <main className="wof-admin__content">{props.children}</main>
        </div>
      </div>
    );
  }
}
