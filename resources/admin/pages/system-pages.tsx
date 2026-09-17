namespace WooOptionsFic.Pages {
  const { Button, TextControl, ToggleControl } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useState } = wp.element;

  export function Settings(): any {
    const [settings, setSettings] = useState<Record<string, any> | null>(null);
    const [activeTab, setActiveTab] = useState<'cleanup' | 'other' | 'general'>('cleanup');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      WooOptionsFic.Api.getSettings().then(setSettings);
    }, []);

    if (!settings) {
      return (
        <div className="wof-page">
          <WooOptionsFic.Components.Loading />
        </div>
      );
    }

    const set = (key: string, value: unknown) => setSettings({ ...settings, [key]: value });

    const save = async () => {
      setSaving(true);
      try {
        setSettings(await WooOptionsFic.Api.saveSettings(settings));
        WooOptionsFic.Toast.success(__('Settings saved successfully.', 'wooptionsfic'));
      } catch (err: any) {
        WooOptionsFic.Toast.error(WooOptionsFic.Utils.errorMessage(err));
      } finally {
        setSaving(false);
      }
    };

    const tabs = [
      {
        id: 'cleanup' as const,
        label: __('Upload Cleanup', 'wooptionsfic'),
        subtitle: __('Storage & file purging', 'wooptionsfic'),
        icon: 'upload',
      },
      {
        id: 'other' as const,
        label: __('Other Settings', 'wooptionsfic'),
        subtitle: __('Labels & cart visibility', 'wooptionsfic'),
        icon: 'admin-appearance',
      },
      {
        id: 'general' as const,
        label: __('General & Limits', 'wooptionsfic'),
        subtitle: __('API limits & features', 'wooptionsfic'),
        icon: 'admin-settings',
      },
    ];

    return (
      <div className="wof-page">
        <WooOptionsFic.Components.PageHeader
          eyebrow={__('Operational defaults', 'wooptionsfic')}
          title={__('Settings', 'wooptionsfic')}
          description={__('Control limits, file retention, summary labels, and storefront visibility without editing code.', 'wooptionsfic')}
          actions={
            <Button
              variant="primary"
              isBusy={saving}
              disabled={saving}
              onClick={save}
            >
              {saving ? __('Saving…', 'wooptionsfic') : __('Save settings', 'wooptionsfic')}
            </Button>
          }
        />

        <div className="wof-settings-layout">
          {/* Sidebar Navigation */}
          <nav className="wof-settings-nav" aria-label={__('Settings navigation', 'wooptionsfic')}>
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={WooOptionsFic.Utils.classNames('wof-settings-nav-item', activeTab === tab.id && 'is-active')}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="wof-settings-nav-item__icon">
                  <WooOptionsFic.Components.Dashicon name={tab.icon} />
                </span>
                <span className="wof-settings-nav-item__text">
                  <span className="wof-settings-nav-item__title">{tab.label}</span>
                  <span className="wof-settings-nav-item__subtitle">{tab.subtitle}</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Settings Content Panel */}
          <main className="wof-settings-panel">
            {activeTab === 'cleanup' && (
              <section aria-labelledby="wof-cleanup-heading">
                <div className="wof-settings-panel__header">
                  <h2 id="wof-cleanup-heading" className="wof-settings-panel__title">
                    {__('Cleanup Upload Field Files', 'wooptionsfic')}
                  </h2>
                  <p className="wof-settings-panel__desc">
                    {__('Clean up all files uploaded through this field to free storage and remove unused data.', 'wooptionsfic')}
                  </p>
                </div>

                <div className="wof-settings-rows">
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Files uploaded but not in order', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Removes unplaced temporary uploads after a specified number of days (0 to disable).', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <div className="wof-setting-input-wrap">
                        <TextControl
                          hideLabelFromVision
                          label={__('Days to retain unplaced uploads', 'wooptionsfic')}
                          type="number"
                          min="0"
                          value={String(settings.cleanup_unplaced_upload_days ?? 0)}
                          onChange={(val: string) => set('cleanup_unplaced_upload_days', Math.max(0, parseInt(val, 10) || 0))}
                        />
                        <span className="wof-setting-input-unit">{__('days', 'wooptionsfic')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Files uploaded and placed in order', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Removes uploads attached to placed orders after a specified number of days (0 to disable).', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <div className="wof-setting-input-wrap">
                        <TextControl
                          hideLabelFromVision
                          label={__('Days to retain placed uploads', 'wooptionsfic')}
                          type="number"
                          min="0"
                          value={String(settings.cleanup_placed_upload_days ?? 0)}
                          onChange={(val: string) => set('cleanup_placed_upload_days', Math.max(0, parseInt(val, 10) || 0))}
                        />
                        <span className="wof-setting-input-unit">{__('days', 'wooptionsfic')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Files uploaded in completed orders', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Removes uploads once their corresponding order is marked Completed (0 to disable).', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <div className="wof-setting-input-wrap">
                        <TextControl
                          hideLabelFromVision
                          label={__('Days to retain completed uploads', 'wooptionsfic')}
                          type="number"
                          min="0"
                          value={String(settings.cleanup_completed_upload_days ?? 0)}
                          onChange={(val: string) => set('cleanup_completed_upload_days', Math.max(0, parseInt(val, 10) || 0))}
                        />
                        <span className="wof-setting-input-unit">{__('days', 'wooptionsfic')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'other' && (
              <section aria-labelledby="wof-other-heading">
                <div className="wof-settings-panel__header">
                  <h2 id="wof-other-heading" className="wof-settings-panel__title">
                    {__('Other Settings', 'wooptionsfic')}
                  </h2>
                  <p className="wof-settings-panel__desc">
                    {__('Configure summary labels, storefront display text, and cart/checkout visibility.', 'wooptionsfic')}
                  </p>
                </div>

                <div className="wof-settings-rows">
                  {/* Total Price Text */}
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Addons Total Price Label', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Customize the total price label shown in the storefront configurator summary.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <ToggleControl
                        label={__('Enable Addons Price Total Text In Product Page', 'wooptionsfic')}
                        checked={Boolean(settings.enable_addons_total_text)}
                        onChange={(checked: boolean) => set('enable_addons_total_text', checked)}
                      />
                      {settings.enable_addons_total_text ? (
                        <div className="wof-setting-row__subfield">
                          <TextControl
                            label={__('TOTAL PRICE TEXT', 'wooptionsfic')}
                            value={settings.addons_total_text ?? 'Total Price'}
                            placeholder="Total Price"
                            help={__('Change your Total Price / Configured price text here.', 'wooptionsfic')}
                            onChange={(val: string) => set('addons_total_text', val)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Summary Status Text */}
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Summary Status Prompt', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Customize the ready state prompt shown in the summary before selection changes.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <ToggleControl
                        label={__('Enable Summary Status Text In Product Page', 'wooptionsfic')}
                        checked={Boolean(settings.enable_summary_status_text)}
                        onChange={(checked: boolean) => set('enable_summary_status_text', checked)}
                      />
                      {settings.enable_summary_status_text ? (
                        <div className="wof-setting-row__subfield">
                          <TextControl
                            label={__('SUMMARY STATUS TEXT', 'wooptionsfic')}
                            value={settings.summary_status_text ?? 'Ready for your choices'}
                            placeholder="Ready for your choices"
                            help={__('Change your summary status prompt text here.', 'wooptionsfic')}
                            onChange={(val: string) => set('summary_status_text', val)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Summary Notice Text */}
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Summary Notice Message', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Customize the server-confirmed disclaimer text beneath the summary price.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <ToggleControl
                        label={__('Enable Summary Notice Text In Product Page', 'wooptionsfic')}
                        checked={Boolean(settings.enable_summary_notice_text)}
                        onChange={(checked: boolean) => set('enable_summary_notice_text', checked)}
                      />
                      {settings.enable_summary_notice_text ? (
                        <div className="wof-setting-row__subfield">
                          <TextControl
                            label={__('SUMMARY NOTICE TEXT', 'wooptionsfic')}
                            value={settings.summary_notice_text ?? 'Server-confirmed total, before shipping.'}
                            placeholder="Server-confirmed total, before shipping."
                            help={__('Change your summary disclaimer text here.', 'wooptionsfic')}
                            onChange={(val: string) => set('summary_notice_text', val)}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Cart Visibility */}
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Cart Page Display', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Control whether addon option details are shown under cart line items.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <ToggleControl
                        label={__('Hide addon fields in Cart Page', 'wooptionsfic')}
                        checked={Boolean(settings.hide_addon_in_cart)}
                        onChange={(checked: boolean) => set('hide_addon_in_cart', checked)}
                      />
                    </div>
                  </div>

                  {/* Checkout Visibility */}
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Checkout Page Display', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Control whether addon option details are shown on checkout and order review tables.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <ToggleControl
                        label={__('Hide addon fields in Checkout Page', 'wooptionsfic')}
                        checked={Boolean(settings.hide_addon_in_checkout)}
                        onChange={(checked: boolean) => set('hide_addon_in_checkout', checked)}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'general' && (
              <section aria-labelledby="wof-general-heading">
                <div className="wof-settings-panel__header">
                  <h2 id="wof-general-heading" className="wof-settings-panel__title">
                    {__('Operational Defaults & Limits', 'wooptionsfic')}
                  </h2>
                  <p className="wof-settings-panel__desc">
                    {__('Configure security limits and optional capabilities across your catalog.', 'wooptionsfic')}
                  </p>
                </div>

                <div className="wof-settings-rows">
                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Quote requests per minute', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Maximum pricing quote calculations allowed per visitor per minute.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <div className="wof-setting-input-wrap">
                        <TextControl
                          hideLabelFromVision
                          label={__('Quote requests per minute', 'wooptionsfic')}
                          type="number"
                          value={String(settings.quote_rate_limit_per_minute ?? 60)}
                          onChange={(value: string) => set('quote_rate_limit_per_minute', Number(value))}
                        />
                        <span className="wof-setting-input-unit">{__('requests / min', 'wooptionsfic')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Upload size limit', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Maximum allowed file size in megabytes for customer upload fields.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      <div className="wof-setting-input-wrap">
                        <TextControl
                          hideLabelFromVision
                          label={__('Upload size limit (MB)', 'wooptionsfic')}
                          type="number"
                          value={String(settings.upload_max_mb ?? 10)}
                          onChange={(value: string) => set('upload_max_mb', Number(value))}
                        />
                        <span className="wof-setting-input-unit">{__('MB', 'wooptionsfic')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="wof-setting-row">
                    <div className="wof-setting-row__info">
                      <strong className="wof-setting-row__title">
                        {__('Features & Telemetry', 'wooptionsfic')}
                      </strong>
                      <p className="wof-setting-row__desc">
                        {__('Enable or disable global behavior toggles and analytics.', 'wooptionsfic')}
                      </p>
                    </div>
                    <div className="wof-setting-row__control">
                      {Object.entries(settings)
                        .filter(([key, value]) => typeof value === 'boolean' && !['enable_addons_total_text', 'enable_summary_status_text', 'enable_summary_notice_text', 'hide_addon_in_cart', 'hide_addon_in_checkout'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '8px' }}>
                            <ToggleControl
                              label={key.replace(/_/g, ' ')}
                              checked={Boolean(value)}
                              onChange={(checked: boolean) => set(key, checked)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    );
  }
}
