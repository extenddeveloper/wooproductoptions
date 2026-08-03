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
      <Modal title={props.title} onRequestClose={() => !props.busy && props.onCancel()} className="wof-modal wof-confirm-modal">
        <p>{props.message}</p>
        <div className="wof-modal__actions">
          <Button variant="tertiary" disabled={props.busy} onClick={props.onCancel}>{props.cancelLabel ?? __('Cancel', 'wooptionsfic')}</Button>
          <Button variant="primary" isDestructive={props.destructive} isBusy={props.busy} onClick={props.onConfirm}>{props.confirmLabel}</Button>
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
