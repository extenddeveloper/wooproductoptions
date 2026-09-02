namespace WooOptionsFic.Components {
  const { Button, Modal, Spinner } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useState } = wp.element;

  export function MediaImage(props: { attachmentId?: number; src?: string; alt?: string; className?: string }): any {
    const [resolvedSrc, setResolvedSrc] = useState(props.src ?? '');

    useEffect(() => {
      let active = true;
      setResolvedSrc(props.src ?? '');
      const attachmentId = Number(props.attachmentId ?? 0);
      if (!attachmentId || !wp.media?.attachment) return () => { active = false; };
      const attachment = wp.media.attachment(attachmentId);
      const update = () => {
        if (!active) return;
        const data = attachment.toJSON?.() ?? {};
        const source = data.sizes?.thumbnail?.url ?? data.sizes?.medium?.url ?? data.url ?? '';
        if (source) setResolvedSrc(String(source));
      };
      update();
      const request = attachment.fetch?.();
      if (request) Promise.resolve(request).then(update).catch(() => undefined);
      return () => { active = false; };
    }, [props.attachmentId, props.src]);

    return resolvedSrc ? <img src={resolvedSrc} alt={props.alt ?? ''} className={props.className} /> : null;
  }

  export function Loading(props: { label?: string; overlay?: boolean }): any {
    return (
      <div className={WooOptionsFic.Utils.classNames('wof-loading', props.overlay && 'is-overlay')} role="status">
        <span className="wof-loader" aria-hidden="true" />
        <span>{props.label ?? __('Loading…', 'wooptionsfic')}</span>
      </div>
    );
  }

  export function PageHeader(props: { eyebrow?: string; title: string; description?: string; actions?: any }): any {
    return (
      <header className="wof-page-header">
        <div>
          {props.eyebrow ? <span className="wof-eyebrow">{props.eyebrow}</span> : null}
          <h1>{props.title}</h1>
          {props.description ? <p>{props.description}</p> : null}
        </div>
        {props.actions ? <div className="wof-page-header__actions">{props.actions}</div> : null}
      </header>
    );
  }

  export function EmptyState(props: { icon: string; title: string; description: string; action?: any }): any {
    return (
      <div className="wof-empty">
        <div className="wof-empty__icon"><Dashicon name={props.icon} /></div>
        <h2>{props.title}</h2>
        <p>{props.description}</p>
        {props.action}
      </div>
    );
  }

  export function StatusPill(props: { status: string }): any {
    const normalized = props.status.toLowerCase().replace(/[^a-z-]/g, '');
    return <span className={`wof-status-pill is-${normalized}`}><span aria-hidden="true" />{props.status}</span>;
  }

  export function ConfirmModal(props: {
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    busy?: boolean;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }): any {
    return (
      <Modal
        title={props.title}
        onRequestClose={() => !props.busy && props.onCancel()}
        className={WooOptionsFic.Utils.classNames(
          'wof-modal',
          'wof-confirm-modal',
          props.destructive && 'is-destructive'
        )}
      >
        <div className="wof-confirm-modal__header-custom">
          <h3 className="wof-confirm-modal__title-custom">{props.title}</h3>
          <button
            type="button"
            className="wof-confirm-modal__close-custom"
            onClick={props.onCancel}
            aria-label={__('Close', 'wooptionsfic')}
          >
            ✕
          </button>
        </div>

        <div className="wof-confirm-modal__body">
          {props.destructive ? (
            <div className="wof-confirm-modal__icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          ) : null}
          <div className="wof-confirm-modal__text">
            <p className="wof-confirm-modal__message">{props.message}</p>
          </div>
        </div>

        <div className="wof-modal__actions wof-confirm-modal__actions">
          <button
            type="button"
            className="wof-btn-modal-cancel"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            {props.cancelLabel ?? __('Cancel', 'wooptionsfic')}
          </button>
          <button
            type="button"
            className={WooOptionsFic.Utils.classNames(
              'wof-btn-modal-confirm',
              props.destructive && 'is-destructive'
            )}
            disabled={props.busy}
            onClick={props.onConfirm}
          >
            {props.busy ? (
              <span className="wof-btn-busy-spinner">
                <Spinner />
                <span>{__('Deleting…', 'wooptionsfic')}</span>
              </span>
            ) : (
              props.confirmLabel
            )}
          </button>
        </div>
      </Modal>
    );
  }

  export function InlineNotice(props: { type?: 'error' | 'success' | 'warning'; children?: any; onClose?: () => void }): any {
    return (
      <div className={WooOptionsFic.Utils.classNames('wof-inline-notice', props.type && `is-${props.type}`)} role={props.type === 'error' ? 'alert' : 'status'}>
        <span aria-hidden="true">{props.type === 'error' ? '!' : props.type === 'warning' ? '•' : '✓'}</span>
        <div>{props.children}</div>
        {props.onClose ? <button type="button" onClick={props.onClose} aria-label={__('Dismiss', 'wooptionsfic')}>×</button> : null}
      </div>
    );
  }

  export function ModalLoading(props: { label?: string }): any {
    return <div className="wof-modal-loading"><Spinner /><span>{props.label ?? __('Loading…', 'wooptionsfic')}</span></div>;
  }
}
