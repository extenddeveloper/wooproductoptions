namespace WooOptionsFic.Builder {
  const { Button, TextControl } = wp.components;
  const { __ } = wp.i18n;
  const { useCallback, useEffect, useRef, useState } = wp.element;

  export function BuilderPage(props: { uuid: string; navigate: (route: string) => void }): any {
    const state = wp.data.useSelect<WooOptionsFic.BuilderState>((select: any) => select(WooOptionsFic.BuilderStore.STORE_KEY).getState(), []);
    const actions = wp.data.useDispatch(WooOptionsFic.BuilderStore.STORE_KEY);
    const [loading, setLoading] = useState(true);
    const [fatal, setFatal] = useState('');
    const [notice, setNotice] = useState('');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [assignmentOpen, setAssignmentOpen] = useState(false);
    const [revisions, setRevisions] = useState<WooOptionsFic.RevisionRecord[]>([]);
    const [assignments, setAssignments] = useState<WooOptionsFic.AssignmentRecord[]>([]);
    const [modalBusy, setModalBusy] = useState(false);
    const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
    const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
    const [publishBusy, setPublishBusy] = useState(false);
    const savePromise = useRef<Promise<WooOptionsFic.OptionSetRecord> | null>(null);

    useEffect(() => {
      let active = true;
      setLoading(true);
      WooOptionsFic.Api.getOptionSet(props.uuid)
        .then((optionSet) => active && actions.loadSet(optionSet))
        .catch((reason) => active && setFatal(WooOptionsFic.Utils.errorMessage(reason)))
        .finally(() => active && setLoading(false));
      return () => { active = false; };
    }, [props.uuid]);

    const saveNow = useCallback(async (note = 'Manual save'): Promise<WooOptionsFic.OptionSetRecord> => {
      if (savePromise.current) return savePromise.current;
      if (!state.optionSet || !state.document) throw new Error(__('The builder is not ready.', 'wooptionsfic'));
      actions.setSaveStatus('saving');
      const expectedHash = state.optionSet.currentRevision?.contentHash ?? '';
      savePromise.current = WooOptionsFic.Api.saveRevision(state.optionSet.uuid, state.document, expectedHash, note);
      try {
        const result = await savePromise.current;
        actions.saved(result, result.currentRevision?.definition ?? state.document);
        return result;
      } catch (reason: any) {
        actions.setSaveStatus(reason?.code === 'wooptionsfic_revision_conflict' ? 'conflict' : 'error');
        setNotice(WooOptionsFic.Utils.errorMessage(reason));
        throw reason;
      } finally {
        savePromise.current = null;
      }
    }, [state.optionSet, state.document]);

    /* Autosave removed — saves are now manual via "Save draft" button */

    useEffect(() => {
      if (!state.document || !state.optionSet) return;
      const timeout = window.setTimeout(() => {
        WooOptionsFic.Api.validateDefinition(state.optionSet!.uuid, state.document!)
          .then((result) => actions.setValidation(result.errors, result.warnings))
          .catch(() => undefined);
      }, 500);
      return () => window.clearTimeout(timeout);
    }, [state.document, state.optionSet]);

    const publish = async () => {
      if (!state.optionSet || !state.document || state.errors.length) { setDiagnosticsOpen(true); return; }
      setNotice('');
      setPublishBusy(true);
      try {
        const saved = state.dirty ? await saveNow('Pre-publish save') : state.optionSet;
        actions.setSaveStatus('saving');
        const result = await WooOptionsFic.Api.publishOptionSet(saved.uuid, saved.currentRevision?.contentHash ?? '');
        actions.saved(result, result.currentRevision?.definition ?? state.document);
        setNotice(__('Published. This live revision is now immutable.', 'wooptionsfic'));
      } catch (reason) {
        setNotice(WooOptionsFic.Utils.errorMessage(reason));
      } finally {
        setPublishBusy(false);
      }
    };

    const openHistory = async () => {
      if (!state.optionSet) return;
      setHistoryOpen(true); setModalBusy(true);
      try { setRevisions(await WooOptionsFic.Api.listRevisions(state.optionSet.uuid)); }
      finally { setModalBusy(false); }
    };
    const openAssignments = async () => {
      if (!state.optionSet) return;
      setAssignmentOpen(true); setModalBusy(true);
      try { setAssignments((await WooOptionsFic.Api.getAssignments(state.optionSet.uuid)).items); }
      finally { setModalBusy(false); }
    };

    if (loading) return <WooOptionsFic.Components.Loading label={__('Opening the Precision Workshop…', 'wooptionsfic')} />;
    if (fatal || !state.optionSet || !state.document) return <div className="wof-fatal"><h1>{__('This option set could not be opened', 'wooptionsfic')}</h1><p>{fatal}</p><Button variant="primary" onClick={() => props.navigate('option-sets')}>{__('Back to option sets', 'wooptionsfic')}</Button></div>;

    const selectedField = WooOptionsFic.Utils.fieldByUuid(state.document, state.selectedUuid);
    const addField = (field: WooOptionsFic.FieldDefinition, index?: number) => { actions.addField(field, index); actions.selectField(field.uuid); actions.setInspectorTab('content'); };
    const duplicateSelected = () => selectedField && addField(WooOptionsFic.FieldFactory.duplicate(selectedField));

    return <div className="wof-builder">
      <header className="wof-builder-topbar"><div className="wof-builder-context"><button type="button" className="wof-builder-brand" onClick={() => props.navigate('dashboard')}><span className="wof-builder-brand-mark"><WooOptionsFic.Components.Dashicon name="screenoptions" /></span><strong>WooOptionsFic</strong></button><span className="wof-builder-divider" /><button type="button" className="wof-builder-back" onClick={() => props.navigate('option-sets')}><WooOptionsFic.Components.Dashicon name="arrow-left-alt2" /></button><div className="wof-builder-breadcrumb"><button type="button" onClick={() => props.navigate('option-sets')}>{__('Option Sets', 'wooptionsfic')}</button><span>/</span><div className="wof-builder-title-editor"><TextControl label={__('Option set title', 'wooptionsfic')} hideLabelFromVision value={state.document.title} onChange={(title: string) => actions.updateDocument({ title })} /><WooOptionsFic.Components.Dashicon name="edit" /></div></div></div><div className="wof-builder-tools"><div className="wof-tool-group wof-history-tools"><button type="button" disabled={!state.history.length} onClick={actions.undo}><WooOptionsFic.Components.Dashicon name="undo" /></button><button type="button" disabled={!state.future.length} onClick={actions.redo}><WooOptionsFic.Components.Dashicon name="redo" /></button></div><div className="wof-tool-group wof-device-switcher">{(['desktop', 'tablet', 'mobile'] as WooOptionsFic.PreviewDevice[]).map((device) => <button type="button" key={device} className={state.device === device ? 'is-active' : ''} onClick={() => actions.setDevice(device)}><WooOptionsFic.Components.Dashicon name={device === 'desktop' ? 'desktop' : device === 'tablet' ? 'tablet' : 'smartphone'} /></button>)}</div><Button variant="tertiary" className="wof-header-action" onClick={openHistory}><WooOptionsFic.Components.Dashicon name="backup" />{__('Version history', 'wooptionsfic')}</Button><Button variant="tertiary" className="wof-header-action" onClick={openAssignments}><WooOptionsFic.Components.Dashicon name="admin-links" />{__('Assignments', 'wooptionsfic')}</Button><Button variant="secondary" isBusy={state.saveStatus === 'saving'} onClick={() => saveNow('Manual save').catch(() => undefined)}>{state.saveStatus === 'saving' ? __('Saving…', 'wooptionsfic') : __('Save draft', 'wooptionsfic')}</Button><Button variant="primary" isBusy={publishBusy} disabled={state.errors.length > 0 || publishBusy} onClick={publish}>{publishBusy ? __('Publishing…', 'wooptionsfic') : __('Publish', 'wooptionsfic')}</Button></div></header>
      {notice ? <div className={WooOptionsFic.Utils.classNames('wof-builder-notice', state.saveStatus === 'error' || state.saveStatus === 'conflict' ? 'is-error' : 'is-success')}><span>{notice}</span><button type="button" onClick={() => setNotice('')}>×</button></div> : null}
      <div className="wof-builder-workspace"><ElementsPanel onAdd={addField} onOpenStyle={() => { actions.selectField(null); actions.setInspectorTab('style'); }} /><Canvas document={state.document} selectedUuid={state.selectedUuid} device={state.device} onSelect={(uuid) => { actions.selectField(uuid); actions.setInspectorTab('content'); }} onAdd={addField} onMove={actions.moveField} onDuplicate={(field) => addField(WooOptionsFic.FieldFactory.duplicate(field))} onDelete={setDeleteUuid} /><Inspector field={selectedField} document={state.document} tab={state.inspectorTab} onTabChange={actions.setInspectorTab} onFieldChange={(field) => actions.replaceField(field.uuid, field)} onDocumentChange={actions.updateDocument} onDuplicate={duplicateSelected} onDelete={() => selectedField && setDeleteUuid(selectedField.uuid)} /></div>
      <div className={WooOptionsFic.Utils.classNames('wof-diagnostics-drawer', diagnosticsOpen && 'is-open')}><button type="button" className="wof-diagnostics-toggle" onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}><span className={state.errors.length ? 'is-error' : 'is-good'}>{state.errors.length ? '!' : '✓'}</span><strong>{__('Preflight diagnostics', 'wooptionsfic')}</strong><small>{state.errors.length ? `${state.errors.length} ${__('errors', 'wooptionsfic')}` : __('Ready to publish', 'wooptionsfic')}{state.warnings.length ? ` · ${state.warnings.length} ${__('warnings', 'wooptionsfic')}` : ''}</small><b>{diagnosticsOpen ? '⌄' : '⌃'}</b></button>{diagnosticsOpen ? <div className="wof-diagnostics-content"><div><h3>{__('Errors', 'wooptionsfic')}</h3>{state.errors.length ? <ul>{state.errors.map((issue, index) => <li key={`${issue.code}-${index}`}><span>!</span><code>{issue.code}</code><small>{issue.path ?? issue.fieldUuid ?? ''}</small></li>)}</ul> : <p>✓ {__('No blocking errors.', 'wooptionsfic')}</p>}</div><div><h3>{__('Warnings', 'wooptionsfic')}</h3>{state.warnings.length ? <ul>{state.warnings.map((issue, index) => <li key={`${issue.code}-${index}`}><span>•</span><code>{issue.code}</code><small>{issue.path ?? issue.fieldUuid ?? ''}</small></li>)}</ul> : <p>✓ {__('No warnings.', 'wooptionsfic')}</p>}</div><div className="wof-config-size"><h3>{__('Configuration size', 'wooptionsfic')}</h3><strong>{new Blob([JSON.stringify(state.document)]).size.toLocaleString()} B</strong><small>{state.document.fields.length} {__('top-level fields', 'wooptionsfic')}</small></div></div> : null}</div>
      {historyOpen ? <HistoryModal revisions={revisions} busy={modalBusy} onClose={() => setHistoryOpen(false)} onRollback={async (revisionUuid) => { setModalBusy(true); try { const result = await WooOptionsFic.Api.rollback(state.optionSet!.uuid, revisionUuid); actions.loadSet(result); setHistoryOpen(false); setNotice(__('A new draft was created from that revision.', 'wooptionsfic')); } finally { setModalBusy(false); } }} /> : null}
      {assignmentOpen ? <AssignmentsModal assignments={assignments} busy={modalBusy} onClose={() => setAssignmentOpen(false)} onSave={async (nextAssignments) => { setModalBusy(true); try { const response = await WooOptionsFic.Api.saveAssignments(state.optionSet!.uuid, nextAssignments); setAssignments(response.items); setAssignmentOpen(false); setNotice(__('Product assignments saved.', 'wooptionsfic')); } finally { setModalBusy(false); } }} /> : null}
      {deleteUuid ? <WooOptionsFic.Components.ConfirmModal title={__('Delete field?', 'wooptionsfic')} message={__('Delete this field and its configuration? This can be undone until you leave the builder.', 'wooptionsfic')} confirmLabel={__('Delete field', 'wooptionsfic')} destructive onCancel={() => setDeleteUuid(null)} onConfirm={() => { actions.deleteField(deleteUuid); setDeleteUuid(null); }} /> : null}
    </div>;
  }
}
