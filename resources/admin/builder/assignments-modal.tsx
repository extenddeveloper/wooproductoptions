namespace WooOptionsFic.Builder {
  const { Button, Modal, SelectControl, TextControl } = wp.components;
  const { __ } = wp.i18n;
  const { useEffect, useMemo, useState } = wp.element;

  type SearchableAssignmentType = 'product' | 'variation' | 'category' | 'tag';
  type PickerAssignmentType = SearchableAssignmentType | 'global';

  interface AssignmentTargetDetails {
    id: number | null;
    type: PickerAssignmentType;
    label: string;
    meta: string;
    image: string;
  }

  const assignmentTypes: Array<{ type: PickerAssignmentType; label: string; icon: string }> = [
    { type: 'product', label: __('Products', 'wooptionsfic'), icon: 'dashicons-products' },
    { type: 'category', label: __('Categories', 'wooptionsfic'), icon: 'dashicons-category' },
    { type: 'tag', label: __('Tags', 'wooptionsfic'), icon: 'dashicons-tag' },
    { type: 'variation', label: __('Variations', 'wooptionsfic'), icon: 'dashicons-image-rotate' },
    { type: 'global', label: __('All products', 'wooptionsfic'), icon: 'dashicons-admin-site-alt3' },
  ];

  function assignmentTypeLabel(type: WooOptionsFic.AssignmentType): string {
    const labels: Record<WooOptionsFic.AssignmentType, string> = {
      global: __('All products', 'wooptionsfic'),
      product: __('Product', 'wooptionsfic'),
      category: __('Category', 'wooptionsfic'),
      tag: __('Tag', 'wooptionsfic'),
      variation: __('Variation', 'wooptionsfic'),
      product_type: __('Product type', 'wooptionsfic'),
    };
    return labels[type] ?? type;
  }

  function assignmentTypeIcon(type: WooOptionsFic.AssignmentType): string {
    const icons: Record<WooOptionsFic.AssignmentType, string> = {
      global: 'dashicons-admin-site-alt3',
      product: 'dashicons-products',
      category: 'dashicons-category',
      tag: 'dashicons-tag',
      variation: 'dashicons-image-rotate',
      product_type: 'dashicons-filter',
    };
    return icons[type] ?? 'dashicons-marker';
  }

  function TargetSearch(props: {
    type: PickerAssignmentType;
    assignments: WooOptionsFic.AssignmentRecord[];
    onAdd: (target: AssignmentTargetDetails) => void;
  }): any {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<WooOptionsFic.AssignmentTarget[]>([]);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const [error, setError] = useState('');

    const selectedIds = useMemo(
      () => new Set(
        props.assignments
          .filter((assignment) => assignment.targetType === props.type)
          .map((assignment) => String(assignment.targetId ?? 'global')),
      ),
      [props.assignments, props.type],
    );

    useEffect(() => {
      setQuery('');
      setResults([]);
      setError('');
    }, [props.type]);

    useEffect(() => {
      const targetType = props.type;
      if (!focused || targetType === 'global') return;
      let active = true;
      const timeout = window.setTimeout(() => {
        setLoading(true);
        setError('');
        WooOptionsFic.Api.searchAssignmentTargets(targetType, query)
          .then((response) => {
            if (active) setResults(Array.isArray(response.items) ? response.items : []);
          })
          .catch((reason) => {
            if (active) setError(WooOptionsFic.Utils.errorMessage(reason));
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }, 220);
      return () => {
        active = false;
        window.clearTimeout(timeout);
      };
    }, [query, props.type, focused]);

    if (props.type === 'global') {
      const selected = selectedIds.has('global');
      return (
        <button
          type="button"
          className={`wof-assignment-global ${selected ? 'is-selected' : ''}`}
          disabled={selected}
          onClick={() => props.onAdd({
            id: null,
            type: 'global',
            label: __('All WooCommerce products', 'wooptionsfic'),
            meta: __('Every product in the store', 'wooptionsfic'),
            image: '',
          })}
        >
          <span className="dashicons dashicons-admin-site-alt3" aria-hidden="true" />
          <span>
            <strong>{__('All products', 'wooptionsfic')}</strong>
            <small>{selected ? __('Already assigned', 'wooptionsfic') : __('Apply this option set store-wide', 'wooptionsfic')}</small>
          </span>
          <span className={`dashicons ${selected ? 'dashicons-yes-alt' : 'dashicons-plus-alt2'}`} aria-hidden="true" />
        </button>
      );
    }

    const placeholder = props.type === 'product'
      ? __('Search products by name, ID, or SKU…', 'wooptionsfic')
      : props.type === 'category'
        ? __('Search product categories…', 'wooptionsfic')
        : props.type === 'tag'
          ? __('Search product tags…', 'wooptionsfic')
          : __('Search variations by name, ID, or SKU…', 'wooptionsfic');

    return (
      <div className="wof-target-search">
        <div className="wof-target-search__input">
          <span className="dashicons dashicons-search" aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder={placeholder}
            onChange={(event: Event) => setQuery((event.target as HTMLInputElement).value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 160)}
            aria-label={__('Search assignment targets', 'wooptionsfic')}
          />
          {loading || query ? (
            <button
              type="button"
              className="wof-target-search__clear"
              onMouseDown={(event: Event) => event.preventDefault()}
              onClick={() => setQuery('')}
              aria-label={__('Clear search', 'wooptionsfic')}
            >
              {loading ? <span className="wof-mini-spinner" aria-hidden="true" /> : <span className="dashicons dashicons-no-alt" aria-hidden="true" />}
            </button>
          ) : null}
        </div>
        {focused ? (
          <div className="wof-target-results">
            {error ? <p className="wof-target-results__message is-error">{error}</p> : null}
            {!error && !loading && !results.length ? (
              <p className="wof-target-results__message">
                {query ? __('No matching items found.', 'wooptionsfic') : __('Start typing or choose from recent items.', 'wooptionsfic')}
              </p>
            ) : null}
            {results.map((target) => {
              const selected = selectedIds.has(String(target.id));
              return (
                <button
                  type="button"
                  key={`${props.type}-${target.id}`}
                  className={selected ? 'is-selected' : ''}
                  disabled={selected}
                  onMouseDown={(event: Event) => event.preventDefault()}
                  onClick={() => props.onAdd({ ...target, type: props.type })}
                >
                  {target.image ? <img src={target.image} alt="" /> : <span className={`wof-target-result__icon dashicons ${assignmentTypeIcon(props.type)}`} aria-hidden="true" />}
                  <span className="wof-target-result__copy">
                    <strong>{target.label}</strong>
                    <small>{target.meta || `${assignmentTypeLabel(props.type)} #${target.id}`}</small>
                  </span>
                  <span className={`dashicons ${selected ? 'dashicons-yes-alt' : 'dashicons-plus-alt2'}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  export function AssignmentsModal(props: {
    assignments: WooOptionsFic.AssignmentRecord[];
    busy: boolean;
    onClose: () => void;
    onSave: (assignments: WooOptionsFic.AssignmentRecord[]) => Promise<void>;
  }): any {
    const [type, setType] = useState<PickerAssignmentType>('product');
    const [draft, setDraft] = useState<WooOptionsFic.AssignmentRecord[]>(() => WooOptionsFic.Utils.clone(props.assignments));
    const [targetDetails, setTargetDetails] = useState<Record<string, WooOptionsFic.AssignmentTarget>>({});
    const [saving, setSaving] = useState(false);

    const assignmentKey = useMemo(
      () => draft.map((assignment) => `${assignment.targetType}:${assignment.targetId ?? 'global'}`).sort().join('|'),
      [draft],
    );

    useEffect(() => {
      let active = true;
      const grouped = new Map<SearchableAssignmentType, number[]>();
      draft.forEach((assignment) => {
        if (!['product', 'variation', 'category', 'tag'].includes(assignment.targetType) || assignment.targetId === null) return;
        const targetType = assignment.targetType as SearchableAssignmentType;
        grouped.set(targetType, [...(grouped.get(targetType) ?? []), Number(assignment.targetId)]);
      });

      Promise.all(Array.from(grouped.entries()).map(async ([targetType, ids]) => {
        try {
          const response = await WooOptionsFic.Api.searchAssignmentTargets(targetType, '', [...new Set(ids)]);
          return response.items.map((item) => [`${targetType}:${item.id}`, item] as const);
        } catch {
          return [] as Array<readonly [string, WooOptionsFic.AssignmentTarget]>;
        }
      })).then((groups) => {
        if (!active) return;
        const next: Record<string, WooOptionsFic.AssignmentTarget> = {};
        groups.flat().forEach(([key, item]) => { next[key] = item; });
        setTargetDetails(next);
      });

      return () => { active = false; };
    }, [assignmentKey]);

    const updateAssignment = (index: number, patch: Partial<WooOptionsFic.AssignmentRecord>) => {
      setDraft((current) => current.map((assignment, assignmentIndex) => assignmentIndex === index ? { ...assignment, ...patch } : assignment));
    };

    const addTarget = (target: AssignmentTargetDetails) => {
      const targetId = target.type === 'global' ? null : Number(target.id);
      if (draft.some((assignment) => assignment.targetType === target.type && assignment.targetId === targetId)) return;
      const assignment: WooOptionsFic.AssignmentRecord = {
        uuid: WooOptionsFic.Utils.uuid(),
        targetType: target.type,
        targetId,
        mode: 'include',
        priority: 10,
        context: {},
        targetLabel: target.label,
        targetMeta: target.meta,
        targetImage: target.image,
      };
      setDraft((current) => [...current, assignment]);
      if (target.type !== 'global' && target.id !== null) {
        setTargetDetails((current) => ({
          ...current,
          [`${target.type}:${target.id}`]: {
            id: Number(target.id),
            type: target.type as SearchableAssignmentType,
            label: target.label,
            meta: target.meta,
            image: target.image,
          },
        }));
      }
    };

    const save = async () => {
      setSaving(true);
      try {
        await props.onSave(draft);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Modal
        title={__('Product assignments', 'wooptionsfic')}
        onRequestClose={props.onClose}
        className="wof-modal wof-assignment-modal"
      >
        <div className="wof-assignment-hero">
          <span className="dashicons dashicons-admin-links" aria-hidden="true" />
          <div>
            <h3>{__('Choose exactly where this option set appears', 'wooptionsfic')}</h3>
            <p>{__('Search and select multiple products, categories, tags, or variations. Product-specific rules take priority over broader category rules.', 'wooptionsfic')}</p>
          </div>
        </div>

        <section className="wof-assignment-picker">
          <div className="wof-assignment-type-tabs" role="tablist">
            {assignmentTypes.map((assignmentType) => (
              <button
                type="button"
                role="tab"
                key={assignmentType.type}
                aria-selected={type === assignmentType.type}
                className={type === assignmentType.type ? 'is-active' : ''}
                onClick={() => setType(assignmentType.type)}
              >
                <span className={`dashicons ${assignmentType.icon}`} aria-hidden="true" />
                {assignmentType.label}
              </button>
            ))}
          </div>
          <TargetSearch type={type} assignments={draft} onAdd={addTarget} />
        </section>

        <div className="wof-assignment-section-head">
          <div>
            <h3>{__('Assigned targets', 'wooptionsfic')}</h3>
            <p>{__('Adjust inclusion mode or priority for each selected target.', 'wooptionsfic')}</p>
          </div>
          <span>{draft.length} {draft.length === 1 ? __('rule', 'wooptionsfic') : __('rules', 'wooptionsfic')}</span>
        </div>

        {draft.length ? (
          <div className="wof-assignment-cards">
            {draft.map((assignment, index) => {
              const key = `${assignment.targetType}:${assignment.targetId ?? 'global'}`;
              const target = targetDetails[key];
              const label = assignment.targetLabel
                || target?.label
                || (assignment.targetType === 'global'
                  ? __('All WooCommerce products', 'wooptionsfic')
                  : `${assignmentTypeLabel(assignment.targetType)} #${assignment.targetId}`);
              const meta = assignment.targetMeta
                || target?.meta
                || (assignment.targetType === 'global' ? __('Store-wide assignment', 'wooptionsfic') : `ID: ${assignment.targetId}`);
              const image = assignment.targetImage || target?.image || '';
              return (
                <article className="wof-assignment-card" key={assignment.uuid || key}>
                  <div className="wof-assignment-card__visual">
                    {image ? <img src={image} alt="" /> : <span className={`dashicons ${assignmentTypeIcon(assignment.targetType)}`} aria-hidden="true" />}
                  </div>
                  <div className="wof-assignment-card__identity">
                    <div><strong>{label}</strong><span>{assignmentTypeLabel(assignment.targetType)}</span></div>
                    <small>{meta}</small>
                  </div>
                  <SelectControl
                    label={__('Mode', 'wooptionsfic')}
                    value={assignment.mode}
                    options={[
                      { label: __('Include', 'wooptionsfic'), value: 'include' },
                      { label: __('Exclude', 'wooptionsfic'), value: 'exclude' },
                    ]}
                    onChange={(mode: 'include' | 'exclude') => updateAssignment(index, { mode })}
                  />
                  <TextControl
                    type="number"
                    label={__('Priority', 'wooptionsfic')}
                    value={String(assignment.priority)}
                    min={-1000}
                    max={1000}
                    onChange={(priority: string) => updateAssignment(index, { priority: Number(priority) })}
                  />
                  <button
                    type="button"
                    className="wof-assignment-card__remove"
                    onClick={() => setDraft((current) => current.filter((candidate) => candidate !== assignment))}
                    aria-label={__('Remove assignment', 'wooptionsfic')}
                  >
                    <span className="dashicons dashicons-trash" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wof-assignment-empty">
            <span className="dashicons dashicons-admin-links" aria-hidden="true" />
            <h3>{__('No products assigned yet', 'wooptionsfic')}</h3>
            <p>{__('Use the search above to select one or more targets.', 'wooptionsfic')}</p>
          </div>
        )}

        <div className="wof-modal__actions wof-assignment-actions">
          <Button variant="tertiary" onClick={props.onClose}>{__('Cancel', 'wooptionsfic')}</Button>
          <Button variant="primary" isBusy={saving || props.busy} onClick={save}>
            <span className="dashicons dashicons-saved" aria-hidden="true" />
            {__('Save assignments', 'wooptionsfic')}
          </Button>
        </div>
      </Modal>
    );
  }
}
