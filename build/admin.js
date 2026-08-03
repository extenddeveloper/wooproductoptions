"use strict";
var WooOptionsFic;
(function (WooOptionsFic) {
    var Utils;
    (function (Utils) {
        Utils.i18n = wp.i18n;
        function clone(value) {
            if (typeof structuredClone === 'function') {
                return structuredClone(value);
            }
            return JSON.parse(JSON.stringify(value));
        }
        Utils.clone = clone;
        function uuid() {
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                return crypto.randomUUID();
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
                const random = Math.floor(Math.random() * 16);
                const value = character === 'x' ? random : (random & 0x3) | 0x8;
                return value.toString(16);
            });
        }
        Utils.uuid = uuid;
        function errorMessage(error) {
            if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
                return error.message;
            }
            return Utils.i18n.__('Something went wrong. Please try again.', 'wooptionsfic');
        }
        Utils.errorMessage = errorMessage;
        function formatDate(value) {
            if (!value)
                return '—';
            const normalized = /Z$/.test(value) ? value : `${value}Z`;
            const date = new Date(normalized);
            if (Number.isNaN(date.getTime()))
                return value;
            return new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(date);
        }
        Utils.formatDate = formatDate;
        function downloadJson(filename, payload) {
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.append(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        }
        Utils.downloadJson = downloadJson;
        function slug(value) {
            return value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
        Utils.slug = slug;
        function fieldByUuid(document, uuidValue) {
            if (!document || !uuidValue)
                return null;
            const walk = (fields) => {
                for (const field of fields) {
                    if (field.uuid === uuidValue)
                        return field;
                    if (field.children?.length) {
                        const child = walk(field.children);
                        if (child)
                            return child;
                    }
                }
                return null;
            };
            return walk(document.fields);
        }
        Utils.fieldByUuid = fieldByUuid;
        function updateFieldTree(fields, uuidValue, updater) {
            return fields.map((field) => {
                if (field.uuid === uuidValue)
                    return updater(field);
                if (field.children?.length) {
                    return { ...field, children: updateFieldTree(field.children, uuidValue, updater) };
                }
                return field;
            });
        }
        Utils.updateFieldTree = updateFieldTree;
        function removeFieldTree(fields, uuidValue) {
            return fields
                .filter((field) => field.uuid !== uuidValue)
                .map((field) => ({
                ...field,
                children: field.children ? removeFieldTree(field.children, uuidValue) : field.children,
            }));
        }
        Utils.removeFieldTree = removeFieldTree;
        function allFields(fields) {
            const result = [];
            const walk = (items) => {
                items.forEach((field) => {
                    result.push(field);
                    if (field.children?.length)
                        walk(field.children);
                });
            };
            walk(fields);
            return result;
        }
        Utils.allFields = allFields;
        function countChoices(fields) {
            return allFields(fields).reduce((count, field) => count + (field.choices?.length ?? 0), 0);
        }
        Utils.countChoices = countChoices;
        function classNames(...values) {
            return values.filter(Boolean).join(' ');
        }
        Utils.classNames = classNames;
    })(Utils = WooOptionsFic.Utils || (WooOptionsFic.Utils = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Api;
    (function (Api) {
        const apiFetch = wp.apiFetch;
        apiFetch.use(apiFetch.createNonceMiddleware(window.WooOptionsFicAdmin.nonce));
        async function request(path, options = {}) {
            return apiFetch({
                path: `/wooptionsfic/v1${path}`,
                method: options.method ?? 'GET',
                data: options.data,
            });
        }
        Api.request = request;
        function listOptionSets(params = {}) {
            const query = new URLSearchParams({
                page: String(params.page ?? 1),
                perPage: String(params.perPage ?? 10),
                status: params.status ?? 'active',
                search: params.search ?? '',
                orderBy: params.orderBy ?? 'updated_at_gmt',
                order: params.order ?? 'DESC',
            });
            return request(`/option-sets?${query.toString()}`);
        }
        Api.listOptionSets = listOptionSets;
        function createOptionSet(title) {
            return request('/option-sets', { method: 'POST', data: { title } });
        }
        Api.createOptionSet = createOptionSet;
        function getOptionSet(uuid) {
            return request(`/option-sets/${uuid}`);
        }
        Api.getOptionSet = getOptionSet;
        function updateOptionSet(uuid, data) {
            return request(`/option-sets/${uuid}`, { method: 'PUT', data });
        }
        Api.updateOptionSet = updateOptionSet;
        function duplicateOptionSet(uuid) {
            return request(`/option-sets/${uuid}/duplicate`, { method: 'POST' });
        }
        Api.duplicateOptionSet = duplicateOptionSet;
        function deleteOptionSet(uuid) {
            return request(`/option-sets/${uuid}/delete-permanently`, { method: 'POST' });
        }
        Api.deleteOptionSet = deleteOptionSet;
        function saveRevision(uuid, definition, expectedHash, versionNote) {
            return request(`/option-sets/${uuid}/revisions`, {
                method: 'POST',
                data: { definition, expectedHash, versionNote },
            });
        }
        Api.saveRevision = saveRevision;
        function validateDefinition(uuid, definition) {
            return request(`/option-sets/${uuid}/validate`, { method: 'POST', data: { definition } });
        }
        Api.validateDefinition = validateDefinition;
        function publishOptionSet(uuid, expectedHash) {
            return request(`/option-sets/${uuid}/publish`, {
                method: 'POST',
                data: { expectedHash, versionNote: 'Published from the TypeScript builder' },
            });
        }
        Api.publishOptionSet = publishOptionSet;
        function listRevisions(uuid) {
            return request(`/option-sets/${uuid}/revisions`);
        }
        Api.listRevisions = listRevisions;
        function rollback(uuid, revisionUuid) {
            return request(`/option-sets/${uuid}/rollback`, { method: 'POST', data: { revisionUuid } });
        }
        Api.rollback = rollback;
        function getAssignments(uuid) {
            return request(`/option-sets/${uuid}/assignments`);
        }
        Api.getAssignments = getAssignments;
        function saveAssignments(uuid, assignments) {
            return request(`/option-sets/${uuid}/assignments`, { method: 'PUT', data: { assignments } });
        }
        Api.saveAssignments = saveAssignments;
        function searchAssignmentTargets(type, search, include = []) {
            const query = new URLSearchParams({ type, search, include: include.join(','), perPage: '25' });
            return request(`/assignment-targets?${query.toString()}`);
        }
        Api.searchAssignmentTargets = searchAssignmentTargets;
        function listTemplates() {
            return request('/templates');
        }
        Api.listTemplates = listTemplates;
        function importTemplate(slug) {
            return request('/templates', { method: 'POST', data: { slug } });
        }
        Api.importTemplate = importTemplate;
        function exportOptionSet(uuid) {
            return request(`/exports/${uuid}`);
        }
        Api.exportOptionSet = exportOptionSet;
        function analytics() {
            return request('/analytics');
        }
        Api.analytics = analytics;
        function integrations() {
            return request('/integrations');
        }
        Api.integrations = integrations;
        function diagnostics() {
            return request('/diagnostics');
        }
        Api.diagnostics = diagnostics;
        function getSettings() {
            return request('/settings');
        }
        Api.getSettings = getSettings;
        function saveSettings(settings) {
            return request('/settings', { method: 'PUT', data: settings });
        }
        Api.saveSettings = saveSettings;
    })(Api = WooOptionsFic.Api || (WooOptionsFic.Api = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var BuilderStore;
    (function (BuilderStore) {
        BuilderStore.STORE_KEY = 'wooptionsfic/builder';
        const initialState = {
            optionSet: null,
            document: null,
            selectedUuid: null,
            inspectorTab: 'content',
            device: 'desktop',
            saveStatus: 'idle',
            dirty: false,
            history: [],
            future: [],
            errors: [],
            warnings: [],
        };
        function pushHistory(state) {
            if (!state.document)
                return state;
            const history = [...state.history, WooOptionsFic.Utils.clone(state.document)].slice(-60);
            return { ...state, history, future: [] };
        }
        const actions = {
            loadSet(optionSet) {
                return { type: 'LOAD_SET', optionSet };
            },
            replaceDocument(document) {
                return { type: 'REPLACE_DOCUMENT', document };
            },
            updateDocument(patch) {
                return { type: 'UPDATE_DOCUMENT', patch };
            },
            addField(field, index) {
                return { type: 'ADD_FIELD', field, index };
            },
            updateField(uuid, patch) {
                return { type: 'UPDATE_FIELD', uuid, patch };
            },
            replaceField(uuid, field) {
                return { type: 'REPLACE_FIELD', uuid, field };
            },
            deleteField(uuid) {
                return { type: 'DELETE_FIELD', uuid };
            },
            moveField(from, to) {
                return { type: 'MOVE_FIELD', from, to };
            },
            selectField(uuid) {
                return { type: 'SELECT_FIELD', uuid };
            },
            setInspectorTab(tab) {
                return { type: 'SET_INSPECTOR_TAB', tab };
            },
            setDevice(device) {
                return { type: 'SET_DEVICE', device };
            },
            setSaveStatus(status) {
                return { type: 'SET_SAVE_STATUS', status };
            },
            setValidation(errors, warnings) {
                return { type: 'SET_VALIDATION', errors, warnings };
            },
            saved(optionSet, document) {
                return { type: 'SAVED', optionSet, document };
            },
            undo() {
                return { type: 'UNDO' };
            },
            redo() {
                return { type: 'REDO' };
            },
        };
        function reducer(state = initialState, action) {
            switch (action.type) {
                case 'LOAD_SET': {
                    const optionSet = action.optionSet;
                    const document = optionSet.currentRevision?.definition ?? null;
                    return {
                        ...initialState,
                        optionSet,
                        document: document ? WooOptionsFic.Utils.clone(document) : null,
                        saveStatus: 'saved',
                    };
                }
                case 'REPLACE_DOCUMENT': {
                    return {
                        ...pushHistory(state),
                        document: WooOptionsFic.Utils.clone(action.document),
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                case 'UPDATE_DOCUMENT': {
                    if (!state.document)
                        return state;
                    const next = pushHistory(state);
                    return {
                        ...next,
                        document: { ...state.document, ...action.patch },
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                case 'ADD_FIELD': {
                    if (!state.document)
                        return state;
                    const next = pushHistory(state);
                    const fields = [...state.document.fields];
                    const index = typeof action.index === 'number' ? Math.max(0, Math.min(fields.length, action.index)) : fields.length;
                    fields.splice(index, 0, action.field);
                    return {
                        ...next,
                        document: { ...state.document, fields },
                        selectedUuid: action.field.uuid,
                        inspectorTab: 'content',
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                case 'UPDATE_FIELD': {
                    if (!state.document)
                        return state;
                    const next = pushHistory(state);
                    const fields = WooOptionsFic.Utils.updateFieldTree(state.document.fields, action.uuid, (field) => ({ ...field, ...action.patch }));
                    return { ...next, document: { ...state.document, fields }, dirty: true, saveStatus: 'dirty' };
                }
                case 'REPLACE_FIELD': {
                    if (!state.document)
                        return state;
                    const next = pushHistory(state);
                    const fields = WooOptionsFic.Utils.updateFieldTree(state.document.fields, action.uuid, () => action.field);
                    return { ...next, document: { ...state.document, fields }, dirty: true, saveStatus: 'dirty' };
                }
                case 'DELETE_FIELD': {
                    if (!state.document)
                        return state;
                    const next = pushHistory(state);
                    const fields = WooOptionsFic.Utils.removeFieldTree(state.document.fields, action.uuid);
                    const rules = state.document.rules.filter((rule) => !rule.actions.some((item) => item.target === action.uuid));
                    return {
                        ...next,
                        document: { ...state.document, fields, rules },
                        selectedUuid: state.selectedUuid === action.uuid ? null : state.selectedUuid,
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                case 'MOVE_FIELD': {
                    if (!state.document || action.from === action.to)
                        return state;
                    const next = pushHistory(state);
                    const fields = [...state.document.fields];
                    const from = Math.max(0, Math.min(fields.length - 1, action.from));
                    const to = Math.max(0, Math.min(fields.length - 1, action.to));
                    const [field] = fields.splice(from, 1);
                    fields.splice(to, 0, field);
                    return { ...next, document: { ...state.document, fields }, dirty: true, saveStatus: 'dirty' };
                }
                case 'SELECT_FIELD':
                    return { ...state, selectedUuid: action.uuid };
                case 'SET_INSPECTOR_TAB':
                    return { ...state, inspectorTab: action.tab };
                case 'SET_DEVICE':
                    return { ...state, device: action.device };
                case 'SET_SAVE_STATUS':
                    return { ...state, saveStatus: action.status };
                case 'SET_VALIDATION':
                    return { ...state, errors: action.errors, warnings: action.warnings };
                case 'SAVED': {
                    const optionSet = action.optionSet;
                    return {
                        ...state,
                        optionSet,
                        document: action.document ?? state.document,
                        dirty: false,
                        saveStatus: 'saved',
                    };
                }
                case 'UNDO': {
                    if (!state.document || !state.history.length)
                        return state;
                    const history = [...state.history];
                    const previous = history.pop();
                    return {
                        ...state,
                        document: previous,
                        history,
                        future: [WooOptionsFic.Utils.clone(state.document), ...state.future].slice(0, 60),
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                case 'REDO': {
                    if (!state.document || !state.future.length)
                        return state;
                    const [nextDocument, ...future] = state.future;
                    return {
                        ...state,
                        document: nextDocument,
                        history: [...state.history, WooOptionsFic.Utils.clone(state.document)].slice(-60),
                        future,
                        dirty: true,
                        saveStatus: 'dirty',
                    };
                }
                default:
                    return state;
            }
        }
        const selectors = {
            getState(state) {
                return state;
            },
            getDocument(state) {
                return state.document;
            },
            getSelectedField(state) {
                return WooOptionsFic.Utils.fieldByUuid(state.document, state.selectedUuid);
            },
        };
        wp.data.registerStore(BuilderStore.STORE_KEY, { reducer, actions, selectors });
    })(BuilderStore = WooOptionsFic.BuilderStore || (WooOptionsFic.BuilderStore = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var FieldFactory;
    (function (FieldFactory) {
        const choiceTypes = new Set(['select', 'radio', 'checkbox_group', 'segmented', 'color_swatch', 'image_swatch', 'product', 'font']);
        function emptyPricing() {
            return { strategy: 'none', amount: '0', percent: '0', mode: 'adjustment' };
        }
        FieldFactory.emptyPricing = emptyPricing;
        function choice(label, index = 0) {
            return {
                uuid: WooOptionsFic.Utils.uuid(),
                label,
                description: '',
                adminLabel: '',
                color: index === 0 ? '#5B4FF5' : index === 1 ? '#0F766E' : '#64748B',
                imageId: 0,
                imageUrl: '',
                disabled: false,
                default: index === 0,
                pricing: emptyPricing(),
                quantityEnabled: false,
                linkedProductId: 0,
                linkedVariationId: 0,
                linkedQuantity: 1,
                preview: {},
            };
        }
        FieldFactory.choice = choice;
        function create(type) {
            const manifest = window.WooOptionsFicAdmin.fieldTypes[type];
            const label = manifest?.label ?? 'Field';
            const field = {
                uuid: WooOptionsFic.Utils.uuid(),
                type,
                label,
                description: '',
                required: false,
                disabled: false,
                default: null,
                validation: {},
                pricing: emptyPricing(),
                conditions: {},
                style: {},
                preview: {},
                help: '',
            };
            if (choiceTypes.has(type)) {
                field.choices = [choice('Choice 1', 0), choice('Choice 2', 1), choice('Choice 3', 2)];
                field.multiple = Boolean(manifest?.multiple);
                field.minChoices = 0;
                field.maxChoices = 0;
                if (type === 'image_swatch')
                    field.updateProductImage = false;
            }
            if (['text', 'textarea', 'password', 'tel', 'email', 'url', 'number', 'range', 'quantity', 'date', 'date_range', 'time', 'datetime', 'customer_defined_price', 'color_picker'].includes(type)) {
                field.placeholder = '';
                field.min = null;
                field.max = null;
                field.step = ['number', 'range', 'customer_defined_price'].includes(type) ? '1' : null;
                field.maxLength = 0;
            }
            if (type === 'file') {
                field.allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
                field.maxFiles = 1;
                field.maxFileMb = 5;
            }
            if (type === 'formula' || type === 'calculated') {
                field.expression = '0';
                field.displayMode = 'number';
            }
            if (type === 'repeater') {
                field.children = [create('text')];
                field.minRows = 0;
                field.maxRows = 10;
            }
            if (type === 'heading') {
                field.label = 'Section heading';
            }
            if (type === 'paragraph') {
                field.description = 'Add supporting product-option content here.';
            }
            if (type === 'help') {
                field.description = 'Helpful information for customers.';
            }
            if (type === 'spacer') {
                field.style = { height: 24 };
            }
            return field;
        }
        FieldFactory.create = create;
        function duplicate(field) {
            const copy = WooOptionsFic.Utils.clone(field);
            const remap = (item) => ({
                ...item,
                uuid: WooOptionsFic.Utils.uuid(),
                label: item === copy ? `${item.label} copy` : item.label,
                choices: item.choices?.map((choiceItem) => ({ ...choiceItem, uuid: WooOptionsFic.Utils.uuid() })),
                children: item.children?.map(remap),
            });
            return remap(copy);
        }
        FieldFactory.duplicate = duplicate;
    })(FieldFactory = WooOptionsFic.FieldFactory || (WooOptionsFic.FieldFactory = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Components;
    (function (Components) {
        const iconMap = {
            select: 'list-view',
            radio: 'marker',
            checkbox_group: 'yes-alt',
            checkbox: 'yes',
            toggle: 'image-flip-horizontal',
            segmented: 'grid-view',
            color_swatch: 'art',
            image_swatch: 'format-image',
            product: 'products',
            font: 'editor-textcolor',
            text: 'editor-textcolor',
            textarea: 'text-page',
            password: 'lock',
            tel: 'phone',
            email: 'email',
            url: 'admin-links',
            number: 'editor-ol',
            range: 'leftright',
            quantity: 'plus-alt2',
            date: 'calendar-alt',
            date_range: 'calendar',
            time: 'clock',
            datetime: 'schedule',
            customer_defined_price: 'money-alt',
            color_picker: 'admin-customizer',
            file: 'upload',
            formula: 'calculator',
            calculated: 'chart-line',
            repeater: 'screenoptions',
            heading: 'heading',
            paragraph: 'editor-paragraph',
            help: 'editor-help',
            separator: 'minus',
            spacer: 'editor-contract',
        };
        function Dashicon(props) {
            return wp.element.createElement("span", { className: WooOptionsFic.Utils.classNames('dashicons', `dashicons-${props.name}`, props.className), "aria-hidden": "true" });
        }
        Components.Dashicon = Dashicon;
        function FieldIcon(props) {
            return wp.element.createElement(Dashicon, { name: iconMap[props.type] ?? 'admin-generic' });
        }
        Components.FieldIcon = FieldIcon;
        function GripIcon() {
            return wp.element.createElement("span", { className: "wof-grip-dots", "aria-hidden": "true" },
                wp.element.createElement("i", null),
                wp.element.createElement("i", null),
                wp.element.createElement("i", null),
                wp.element.createElement("i", null),
                wp.element.createElement("i", null),
                wp.element.createElement("i", null));
        }
        Components.GripIcon = GripIcon;
    })(Components = WooOptionsFic.Components || (WooOptionsFic.Components = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Components;
    (function (Components) {
        const { Button, Modal, Spinner } = wp.components;
        const { __ } = wp.i18n;
        const { useEffect, useState } = wp.element;
        function MediaImage(props) {
            const [resolvedSrc, setResolvedSrc] = useState(props.src ?? '');
            useEffect(() => {
                let active = true;
                setResolvedSrc(props.src ?? '');
                const attachmentId = Number(props.attachmentId ?? 0);
                if (!attachmentId || !wp.media?.attachment)
                    return () => { active = false; };
                const attachment = wp.media.attachment(attachmentId);
                const update = () => {
                    if (!active)
                        return;
                    const data = attachment.toJSON?.() ?? {};
                    const source = data.sizes?.thumbnail?.url ?? data.sizes?.medium?.url ?? data.url ?? '';
                    if (source)
                        setResolvedSrc(String(source));
                };
                update();
                const request = attachment.fetch?.();
                if (request)
                    Promise.resolve(request).then(update).catch(() => undefined);
                return () => { active = false; };
            }, [props.attachmentId, props.src]);
            return resolvedSrc ? wp.element.createElement("img", { src: resolvedSrc, alt: props.alt ?? '', className: props.className }) : null;
        }
        Components.MediaImage = MediaImage;
        function Loading(props) {
            return (wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-loading', props.overlay && 'is-overlay'), role: "status" },
                wp.element.createElement("span", { className: "wof-loader", "aria-hidden": "true" }),
                wp.element.createElement("span", null, props.label ?? __('Loading…', 'wooptionsfic'))));
        }
        Components.Loading = Loading;
        function PageHeader(props) {
            return (wp.element.createElement("header", { className: "wof-page-header" },
                wp.element.createElement("div", null,
                    props.eyebrow ? wp.element.createElement("span", { className: "wof-eyebrow" }, props.eyebrow) : null,
                    wp.element.createElement("h1", null, props.title),
                    props.description ? wp.element.createElement("p", null, props.description) : null),
                props.actions ? wp.element.createElement("div", { className: "wof-page-header__actions" }, props.actions) : null));
        }
        Components.PageHeader = PageHeader;
        function EmptyState(props) {
            return (wp.element.createElement("div", { className: "wof-empty" },
                wp.element.createElement("div", { className: "wof-empty__icon" },
                    wp.element.createElement(Components.Dashicon, { name: props.icon })),
                wp.element.createElement("h2", null, props.title),
                wp.element.createElement("p", null, props.description),
                props.action));
        }
        Components.EmptyState = EmptyState;
        function StatusPill(props) {
            const normalized = props.status.toLowerCase().replace(/[^a-z-]/g, '');
            return wp.element.createElement("span", { className: `wof-status-pill is-${normalized}` },
                wp.element.createElement("span", { "aria-hidden": "true" }),
                props.status);
        }
        Components.StatusPill = StatusPill;
        function ConfirmModal(props) {
            return (wp.element.createElement(Modal, { title: props.title, onRequestClose: () => !props.busy && props.onCancel(), className: "wof-modal wof-confirm-modal" },
                wp.element.createElement("p", null, props.message),
                wp.element.createElement("div", { className: "wof-modal__actions" },
                    wp.element.createElement(Button, { variant: "tertiary", disabled: props.busy, onClick: props.onCancel }, props.cancelLabel ?? __('Cancel', 'wooptionsfic')),
                    wp.element.createElement(Button, { variant: "primary", isDestructive: props.destructive, isBusy: props.busy, onClick: props.onConfirm }, props.confirmLabel))));
        }
        Components.ConfirmModal = ConfirmModal;
        function InlineNotice(props) {
            return (wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-inline-notice', props.type && `is-${props.type}`), role: props.type === 'error' ? 'alert' : 'status' },
                wp.element.createElement("span", { "aria-hidden": "true" }, props.type === 'error' ? '!' : props.type === 'warning' ? '•' : '✓'),
                wp.element.createElement("div", null, props.children),
                props.onClose ? wp.element.createElement("button", { type: "button", onClick: props.onClose, "aria-label": __('Dismiss', 'wooptionsfic') }, "\u00D7") : null));
        }
        Components.InlineNotice = InlineNotice;
        function ModalLoading(props) {
            return wp.element.createElement("div", { className: "wof-modal-loading" },
                wp.element.createElement(Spinner, null),
                wp.element.createElement("span", null, props.label ?? __('Loading…', 'wooptionsfic')));
        }
        Components.ModalLoading = ModalLoading;
    })(Components = WooOptionsFic.Components || (WooOptionsFic.Components = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Components;
    (function (Components) {
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
        function AdminShell(props) {
            const isBuilder = props.route.startsWith('builder/');
            if (isBuilder) {
                return wp.element.createElement("div", { className: "wof-admin is-builder" },
                    wp.element.createElement("main", { className: "wof-admin__content" }, props.children));
            }
            return (wp.element.createElement("div", { className: "wof-admin" },
                wp.element.createElement("header", { className: "wof-admin__masthead" },
                    wp.element.createElement("button", { type: "button", className: "wof-brand", onClick: () => props.navigate('dashboard') },
                        wp.element.createElement("span", { className: "wof-brand-mark" },
                            wp.element.createElement(Components.Dashicon, { name: "screenoptions" })),
                        wp.element.createElement("span", { className: "wof-brand-copy" },
                            wp.element.createElement("strong", null, "WooOptionsFic"),
                            wp.element.createElement("small", null, __('Precision Workshop', 'wooptionsfic')))),
                    wp.element.createElement("div", { className: "wof-masthead__meta" },
                        wp.element.createElement("span", { className: "wof-beta-pill" }, window.WooOptionsFicAdmin.version),
                        wp.element.createElement("span", { className: "wof-user-chip" }, window.WooOptionsFicAdmin.currentUser.name))),
                wp.element.createElement("div", { className: "wof-admin__body" },
                    wp.element.createElement("nav", { className: "wof-admin__nav", "aria-label": __('WooOptionsFic sections', 'wooptionsfic') },
                        navigation.map((item) => (wp.element.createElement("button", { type: "button", key: item.route, className: props.route === item.route ? 'is-active' : '', "aria-current": props.route === item.route ? 'page' : undefined, onClick: () => props.navigate(item.route) },
                            wp.element.createElement(Components.Dashicon, { name: item.icon }),
                            item.label))),
                        wp.element.createElement("div", { className: "wof-nav__signal" },
                            wp.element.createElement("span", { className: window.WooOptionsFicAdmin.wooAvailable ? 'is-connected' : 'is-paused', "aria-hidden": "true" }),
                            wp.element.createElement("div", null,
                                wp.element.createElement("strong", null, "WooCommerce"),
                                wp.element.createElement("small", null, window.WooOptionsFicAdmin.wooAvailable ? __('Connected', 'wooptionsfic') : __('Needs attention', 'wooptionsfic'))))),
                    wp.element.createElement("main", { className: "wof-admin__content" }, props.children))));
        }
        Components.AdminShell = AdminShell;
    })(Components = WooOptionsFic.Components || (WooOptionsFic.Components = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Pages;
    (function (Pages) {
        const { Button } = wp.components;
        const { __, sprintf } = wp.i18n;
        const { useEffect, useState } = wp.element;
        function Dashboard(props) {
            const [items, setItems] = useState([]);
            const [loading, setLoading] = useState(true);
            useEffect(() => {
                WooOptionsFic.Api.listOptionSets({ perPage: 5 }).then((response) => setItems(response.items)).finally(() => setLoading(false));
            }, []);
            const published = items.filter((item) => item.publishedRevisionId).length;
            return (wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Your product experience studio', 'wooptionsfic'), title: sprintf(__('Good to see you, %s.', 'wooptionsfic'), window.WooOptionsFicAdmin.currentUser.name.split(' ')[0] ?? window.WooOptionsFicAdmin.currentUser.name), description: __('Build thoughtful product choices, price them safely, and publish without touching theme code.', 'wooptionsfic'), actions: wp.element.createElement(Button, { variant: "primary", onClick: () => props.navigate('option-sets') }, __('Create an option set', 'wooptionsfic')) }),
                wp.element.createElement("section", { className: "wof-hero-card" },
                    wp.element.createElement("div", { className: "wof-hero-card__copy" },
                        wp.element.createElement("span", { className: "wof-eyebrow" }, __('Start with confidence', 'wooptionsfic')),
                        wp.element.createElement("h2", null, __('A polished configurator in three moves', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-steps" },
                            wp.element.createElement("div", null,
                                wp.element.createElement("b", null, "1"),
                                wp.element.createElement("span", null,
                                    wp.element.createElement("strong", null, __('Shape', 'wooptionsfic')),
                                    wp.element.createElement("small", null, __('Add fields and choices', 'wooptionsfic')))),
                            wp.element.createElement("div", null,
                                wp.element.createElement("b", null, "2"),
                                wp.element.createElement("span", null,
                                    wp.element.createElement("strong", null, __('Assign', 'wooptionsfic')),
                                    wp.element.createElement("small", null, __('Choose matching products', 'wooptionsfic')))),
                            wp.element.createElement("div", null,
                                wp.element.createElement("b", null, "3"),
                                wp.element.createElement("span", null,
                                    wp.element.createElement("strong", null, __('Publish', 'wooptionsfic')),
                                    wp.element.createElement("small", null, __('Run checks and go live', 'wooptionsfic'))))),
                        wp.element.createElement("div", { className: "wof-inline-actions" },
                            wp.element.createElement(Button, { variant: "primary", onClick: () => props.navigate('templates') }, __('Explore templates', 'wooptionsfic')),
                            wp.element.createElement(Button, { variant: "tertiary", onClick: () => props.navigate('help') }, __('Take the quick tour', 'wooptionsfic')))),
                    wp.element.createElement("div", { className: "wof-hero-preview", "aria-hidden": "true" },
                        wp.element.createElement("div", { className: "wof-preview-window" },
                            wp.element.createElement("div", { className: "wof-preview-window__bar" },
                                wp.element.createElement("i", null),
                                wp.element.createElement("i", null),
                                wp.element.createElement("i", null)),
                            wp.element.createElement("div", { className: "wof-preview-window__body" },
                                wp.element.createElement("div", { className: "wof-preview-palette" },
                                    wp.element.createElement("span", null),
                                    wp.element.createElement("span", null),
                                    wp.element.createElement("span", null),
                                    wp.element.createElement("span", null)),
                                wp.element.createElement("div", { className: "wof-preview-canvas" },
                                    wp.element.createElement("div", { className: "wof-preview-field is-selected" },
                                        wp.element.createElement("em", null),
                                        wp.element.createElement("span", null)),
                                    wp.element.createElement("div", { className: "wof-preview-field" },
                                        wp.element.createElement("em", null),
                                        wp.element.createElement("span", null)),
                                    wp.element.createElement("div", { className: "wof-preview-field" },
                                        wp.element.createElement("em", null),
                                        wp.element.createElement("span", null))),
                                wp.element.createElement("div", { className: "wof-preview-inspector" },
                                    wp.element.createElement("span", null),
                                    wp.element.createElement("span", null),
                                    wp.element.createElement("span", null)))))),
                wp.element.createElement("div", { className: "wof-stat-grid" },
                    wp.element.createElement("div", { className: "wof-stat" },
                        wp.element.createElement("span", null, __('Active sets', 'wooptionsfic')),
                        wp.element.createElement("strong", null, items.length),
                        wp.element.createElement("small", null, __('Loaded in this view', 'wooptionsfic'))),
                    wp.element.createElement("div", { className: "wof-stat" },
                        wp.element.createElement("span", null, __('Published', 'wooptionsfic')),
                        wp.element.createElement("strong", null, published),
                        wp.element.createElement("small", null, __('Immutable live revisions', 'wooptionsfic'))),
                    wp.element.createElement("div", { className: "wof-stat" },
                        wp.element.createElement("span", null, __('Built-in templates', 'wooptionsfic')),
                        wp.element.createElement("strong", null, "10"),
                        wp.element.createElement("small", null, __('Ready to customize', 'wooptionsfic'))),
                    wp.element.createElement("div", { className: "wof-stat is-accent" },
                        wp.element.createElement("span", null, __('Commerce truth', 'wooptionsfic')),
                        wp.element.createElement("strong", null, "100%"),
                        wp.element.createElement("small", null, __('Calculated on the server', 'wooptionsfic')))),
                wp.element.createElement("section", { className: "wof-panel" },
                    wp.element.createElement("div", { className: "wof-panel__header" },
                        wp.element.createElement("div", null,
                            wp.element.createElement("h2", null, __('Recently edited', 'wooptionsfic')),
                            wp.element.createElement("p", null, __('Pick up exactly where you left off.', 'wooptionsfic'))),
                        wp.element.createElement(Button, { variant: "tertiary", onClick: () => props.navigate('option-sets') }, __('View all', 'wooptionsfic'))),
                    loading ? wp.element.createElement(WooOptionsFic.Components.Loading, { label: __('Loading your workshop…', 'wooptionsfic') }) : items.length ? wp.element.createElement("div", { className: "wof-recent-list" }, items.map((item) => wp.element.createElement("button", { type: "button", key: item.uuid, onClick: () => props.navigate(`builder/${item.uuid}`) },
                        wp.element.createElement("span", { className: "wof-set-glyph" },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "screenoptions" })),
                        wp.element.createElement("span", null,
                            wp.element.createElement("strong", null, item.title),
                            wp.element.createElement("small", null, WooOptionsFic.Utils.formatDate(item.updatedAtGmt))),
                        wp.element.createElement(WooOptionsFic.Components.StatusPill, { status: item.publishedRevisionId ? __('Published', 'wooptionsfic') : __('Draft', 'wooptionsfic') }),
                        wp.element.createElement("b", { "aria-hidden": "true" }, "\u2192")))) : wp.element.createElement("div", { className: "wof-panel__empty" },
                        wp.element.createElement("p", null, __('Your workshop is clear. Import a template or create a blank option set.', 'wooptionsfic'))))));
        }
        Pages.Dashboard = Dashboard;
    })(Pages = WooOptionsFic.Pages || (WooOptionsFic.Pages = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Pages;
    (function (Pages) {
        const { Button, Modal, SearchControl, SelectControl, TextControl } = wp.components;
        const { __ } = wp.i18n;
        const { useCallback, useEffect, useMemo, useState } = wp.element;
        function ActionMenu(props) {
            const [open, setOpen] = useState(false);
            useEffect(() => {
                if (!open)
                    return;
                const close = () => setOpen(false);
                document.addEventListener('click', close);
                return () => document.removeEventListener('click', close);
            }, [open]);
            return wp.element.createElement("div", { className: "wof-row-menu", onClick: (event) => event.stopPropagation() },
                wp.element.createElement("button", { type: "button", className: "wof-row-menu__toggle", "aria-expanded": open, onClick: () => setOpen(!open) },
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "ellipsis" })),
                open ? wp.element.createElement("div", { className: "wof-row-menu__popover" },
                    wp.element.createElement("button", { type: "button", onClick: () => props.onAction('edit') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "edit" }),
                        __('Edit', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", onClick: () => props.onAction('export') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "download" }),
                        __('Export', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", onClick: () => props.onAction('duplicate') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-page" }),
                        __('Duplicate', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", onClick: () => props.onAction(props.item.status === 'inactive' ? 'activate' : 'deactivate') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: props.item.status === 'inactive' ? 'yes' : 'hidden' }),
                        props.item.status === 'inactive' ? __('Activate', 'wooptionsfic') : __('Deactivate', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", onClick: () => props.onAction(props.item.status === 'archived' ? 'restore' : 'archive') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: props.item.status === 'archived' ? 'undo' : 'archive' }),
                        props.item.status === 'archived' ? __('Restore', 'wooptionsfic') : __('Archive', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", className: "is-destructive", onClick: () => props.onAction('delete') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" }),
                        __('Delete permanently', 'wooptionsfic'))) : null);
        }
        function OptionSets(props) {
            const [collection, setCollection] = useState({ items: [], total: 0, page: 1, perPage: 10 });
            const [status, setStatus] = useState('active');
            const [search, setSearch] = useState('');
            const [sort, setSort] = useState('updated_at_gmt');
            const [page, setPage] = useState(1);
            const [perPage, setPerPage] = useState(10);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState('');
            const [selected, setSelected] = useState([]);
            const [createOpen, setCreateOpen] = useState(false);
            const [createTitle, setCreateTitle] = useState('');
            const [busy, setBusy] = useState(false);
            const [deleteTarget, setDeleteTarget] = useState(null);
            const load = useCallback(() => {
                setLoading(true);
                setError('');
                WooOptionsFic.Api.listOptionSets({ page, perPage, status, search, orderBy: sort, order: sort === 'title' ? 'ASC' : 'DESC' })
                    .then((response) => setCollection(response))
                    .catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason)))
                    .finally(() => setLoading(false));
            }, [page, perPage, status, search, sort]);
            useEffect(() => {
                const timeout = window.setTimeout(load, 180);
                return () => window.clearTimeout(timeout);
            }, [load]);
            useEffect(() => { setSelected([]); setPage(1); }, [status, search, perPage, sort]);
            const totalPages = Math.max(1, Math.ceil(collection.total / perPage));
            const start = collection.total ? (collection.page - 1) * collection.perPage + 1 : 0;
            const end = collection.total ? Math.min(collection.total, start + collection.items.length - 1) : 0;
            const allSelected = collection.items.length > 0 && collection.items.every((item) => selected.includes(item.uuid));
            const create = async () => {
                if (!createTitle.trim())
                    return;
                setBusy(true);
                try {
                    const result = await WooOptionsFic.Api.createOptionSet(createTitle);
                    setCreateOpen(false);
                    setCreateTitle('');
                    props.navigate(`builder/${result.uuid}`);
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setBusy(false);
                }
            };
            const exportItems = async (uuids) => {
                const exports = await Promise.all(uuids.map((uuid) => WooOptionsFic.Api.exportOptionSet(uuid)));
                WooOptionsFic.Utils.downloadJson(uuids.length === 1 ? `wooptionsfic-${uuids[0]}.json` : `wooptionsfic-option-sets-${Date.now()}.json`, uuids.length === 1 ? exports[0] : { exportSchemaVersion: 1, exportedAtGmt: new Date().toISOString(), optionSets: exports });
            };
            const updateStatus = async (uuid, nextStatus) => {
                await WooOptionsFic.Api.updateOptionSet(uuid, { status: nextStatus });
            };
            const rowAction = async (item, action) => {
                setBusy(true);
                try {
                    if (action === 'edit')
                        props.navigate(`builder/${item.uuid}`);
                    if (action === 'export')
                        await exportItems([item.uuid]);
                    if (action === 'duplicate')
                        await WooOptionsFic.Api.duplicateOptionSet(item.uuid);
                    if (action === 'activate' || action === 'restore')
                        await updateStatus(item.uuid, 'active');
                    if (action === 'deactivate')
                        await updateStatus(item.uuid, 'inactive');
                    if (action === 'archive')
                        await updateStatus(item.uuid, 'archived');
                    if (action === 'delete') {
                        setDeleteTarget(item);
                        return;
                    }
                    load();
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setBusy(false);
                }
            };
            const bulk = async (action) => {
                if (!selected.length)
                    return;
                if (action === 'delete') {
                    const target = collection.items.find((item) => item.uuid === selected[0]);
                    if (target)
                        setDeleteTarget({ ...target, title: selected.length > 1 ? `${selected.length} selected option sets` : target.title });
                    return;
                }
                setBusy(true);
                try {
                    if (action === 'export')
                        await exportItems(selected);
                    else
                        await Promise.all(selected.map((uuid) => updateStatus(uuid, action === 'activate' || action === 'restore' ? 'active' : action === 'deactivate' ? 'inactive' : 'archived')));
                    setSelected([]);
                    load();
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setBusy(false);
                }
            };
            const confirmDelete = async () => {
                if (!deleteTarget)
                    return;
                setBusy(true);
                try {
                    const targets = deleteTarget.title.includes('selected option sets') ? selected : [deleteTarget.uuid];
                    await Promise.all(targets.map((uuid) => WooOptionsFic.Api.deleteOptionSet(uuid)));
                    setDeleteTarget(null);
                    setSelected([]);
                    load();
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setBusy(false);
                }
            };
            const pages = useMemo(() => {
                const values = [];
                const min = Math.max(1, Math.min(page - 2, totalPages - 4));
                const max = Math.min(totalPages, min + 4);
                for (let value = min; value <= max; value += 1)
                    values.push(value);
                return values;
            }, [page, totalPages]);
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Configuration library', 'wooptionsfic'), title: __('Option Sets', 'wooptionsfic'), description: __('Design once, assign precisely, and preserve every published revision.', 'wooptionsfic'), actions: wp.element.createElement(wp.element.Fragment, null,
                        wp.element.createElement(Button, { variant: "secondary", onClick: () => props.navigate('templates') }, __('Browse templates', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", onClick: () => setCreateOpen(true) },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }),
                            __('New option set', 'wooptionsfic'))) }),
                error ? wp.element.createElement(WooOptionsFic.Components.InlineNotice, { type: "error", onClose: () => setError('') }, error) : null,
                wp.element.createElement("section", { className: "wof-panel wof-library-panel" },
                    wp.element.createElement("div", { className: "wof-library-toolbar" },
                        wp.element.createElement("div", { className: "wof-segmented-tabs", role: "tablist" }, ['active', 'inactive', 'archived'].map((value) => wp.element.createElement("button", { type: "button", role: "tab", "aria-selected": status === value, className: status === value ? 'is-active' : '', onClick: () => setStatus(value), key: value }, value === 'active' ? __('Active', 'wooptionsfic') : value === 'inactive' ? __('Deactivated', 'wooptionsfic') : __('Archived', 'wooptionsfic')))),
                        wp.element.createElement("div", { className: "wof-toolbar-controls" },
                            wp.element.createElement(SearchControl, { label: __('Search option sets', 'wooptionsfic'), value: search, onChange: setSearch, placeholder: __('Search name or UUID…', 'wooptionsfic') }),
                            wp.element.createElement(SelectControl, { label: __('Sort option sets', 'wooptionsfic'), hideLabelFromVision: true, value: sort, onChange: setSort, options: [{ label: __('Recently updated', 'wooptionsfic'), value: 'updated_at_gmt' }, { label: __('Recently created', 'wooptionsfic'), value: 'created_at_gmt' }, { label: __('Title A–Z', 'wooptionsfic'), value: 'title' }] }))),
                    selected.length ? wp.element.createElement("div", { className: "wof-bulk-bar wof-bulk-bar--modern" },
                        wp.element.createElement("strong", null,
                            selected.length,
                            " ",
                            selected.length === 1 ? __('item selected', 'wooptionsfic') : __('items selected', 'wooptionsfic')),
                        status === 'active' ? wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => bulk('deactivate') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "hidden" }),
                            __('Deactivate', 'wooptionsfic')) : null,
                        status === 'inactive' ? wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => bulk('activate') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "yes-alt" }),
                            __('Activate', 'wooptionsfic')) : null,
                        status !== 'archived' ? wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => bulk('archive') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "archive" }),
                            __('Archive', 'wooptionsfic')) : wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => bulk('restore') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "image-rotate" }),
                            __('Restore', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => bulk('export') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "download" }),
                            __('Export', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "tertiary", isDestructive: true, disabled: busy, onClick: () => bulk('delete') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" }),
                            __('Delete', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "tertiary", disabled: busy, onClick: () => setSelected([]) }, __('Clear', 'wooptionsfic'))) : null,
                    wp.element.createElement("div", { className: "wof-option-set-results" },
                        loading && collection.items.length ? wp.element.createElement("div", { className: "wof-table-loading-overlay", role: "status" },
                            wp.element.createElement("span", { className: "wof-loader", "aria-hidden": "true" }),
                            wp.element.createElement("small", null, __('Refreshing option sets…', 'wooptionsfic'))) : null,
                        wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-set-table-wrap', loading && 'is-loading') },
                            wp.element.createElement("table", { className: "wof-set-table wof-set-table--managed" },
                                wp.element.createElement("thead", null,
                                    wp.element.createElement("tr", null,
                                        wp.element.createElement("th", { className: "wof-check-cell" },
                                            wp.element.createElement("input", { className: "wof-table-checkbox", type: "checkbox", checked: allSelected, onChange: () => setSelected(allSelected ? selected.filter((uuid) => !collection.items.some((item) => item.uuid === uuid)) : Array.from(new Set([...selected, ...collection.items.map((item) => item.uuid)]))), "aria-label": __('Select all on this page', 'wooptionsfic') })),
                                        wp.element.createElement("th", null, __('Title', 'wooptionsfic')),
                                        wp.element.createElement("th", null, __('Status', 'wooptionsfic')),
                                        wp.element.createElement("th", null, __('Options applied', 'wooptionsfic')),
                                        wp.element.createElement("th", null, __('Updated', 'wooptionsfic')),
                                        wp.element.createElement("th", { className: "wof-actions-heading" }, __('Actions', 'wooptionsfic')))),
                                wp.element.createElement("tbody", null, collection.items.map((item) => wp.element.createElement("tr", { key: item.uuid },
                                    wp.element.createElement("td", { className: "wof-check-cell" },
                                        wp.element.createElement("input", { className: "wof-table-checkbox", type: "checkbox", checked: selected.includes(item.uuid), onChange: () => setSelected(selected.includes(item.uuid) ? selected.filter((uuid) => uuid !== item.uuid) : [...selected, item.uuid]), "aria-label": __('Select option set', 'wooptionsfic') })),
                                    wp.element.createElement("td", null,
                                        wp.element.createElement("button", { type: "button", className: "wof-set-title", onClick: () => props.navigate(`builder/${item.uuid}`) },
                                            wp.element.createElement("span", { className: "wof-set-glyph" },
                                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "screenoptions" })),
                                            wp.element.createElement("span", null,
                                                wp.element.createElement("strong", null, item.title),
                                                wp.element.createElement("small", null, item.uuid)))),
                                    wp.element.createElement("td", null,
                                        wp.element.createElement(WooOptionsFic.Components.StatusPill, { status: item.status })),
                                    wp.element.createElement("td", null,
                                        wp.element.createElement("strong", { className: "wof-field-count" }, item.fieldCount ?? 0)),
                                    wp.element.createElement("td", null,
                                        wp.element.createElement("time", null, WooOptionsFic.Utils.formatDate(item.updatedAtGmt))),
                                    wp.element.createElement("td", { className: "wof-actions-cell" },
                                        wp.element.createElement(ActionMenu, { item: item, onAction: (action) => rowAction(item, action) })))))),
                            !loading && !collection.items.length ? wp.element.createElement(WooOptionsFic.Components.EmptyState, { icon: "screenoptions", title: __('No option sets found', 'wooptionsfic'), description: __('Try another status or search, or create a new option set.', 'wooptionsfic'), action: wp.element.createElement(Button, { variant: "primary", onClick: () => setCreateOpen(true) }, __('Create option set', 'wooptionsfic')) }) : null,
                            loading && !collection.items.length ? wp.element.createElement(WooOptionsFic.Components.Loading, { label: __('Organizing option sets…', 'wooptionsfic') }) : null)),
                    wp.element.createElement("nav", { className: "wof-pagination", "aria-label": __('Option set pagination', 'wooptionsfic') },
                        wp.element.createElement("label", { className: "wof-pagination__length" },
                            wp.element.createElement("span", null, __('Show', 'wooptionsfic')),
                            wp.element.createElement("select", { value: perPage, disabled: loading, onChange: (event) => setPerPage(Number(event.target.value)) }, [10, 25, 50, 100].map((value) => wp.element.createElement("option", { value: value, key: value }, value))),
                            wp.element.createElement("span", null, __('entries', 'wooptionsfic'))),
                        wp.element.createElement("span", { className: "wof-pagination__summary" },
                            __('Showing', 'wooptionsfic'),
                            " ",
                            start,
                            "\u2013",
                            end,
                            " ",
                            __('of', 'wooptionsfic'),
                            " ",
                            collection.total),
                        wp.element.createElement("div", { className: "wof-pagination__controls" },
                            wp.element.createElement("button", { type: "button", className: "wof-pagination__direction", disabled: page <= 1 || loading, onClick: () => setPage(Math.max(1, page - 1)) }, __('Previous', 'wooptionsfic')),
                            pages.map((value) => wp.element.createElement("button", { type: "button", key: value, className: page === value ? 'is-current' : '', "aria-current": page === value ? 'page' : undefined, disabled: loading, onClick: () => setPage(value) }, value)),
                            wp.element.createElement("button", { type: "button", className: "wof-pagination__direction", disabled: page >= totalPages || loading, onClick: () => setPage(Math.min(totalPages, page + 1)) }, __('Next', 'wooptionsfic'))))),
                createOpen ? wp.element.createElement(Modal, { title: __('Create an option set', 'wooptionsfic'), onRequestClose: () => !busy && setCreateOpen(false), className: "wof-modal" },
                    wp.element.createElement(TextControl, { label: __('Option set title', 'wooptionsfic'), value: createTitle, onChange: setCreateTitle, autoFocus: true }),
                    wp.element.createElement("div", { className: "wof-modal__actions" },
                        wp.element.createElement(Button, { variant: "tertiary", onClick: () => setCreateOpen(false) }, __('Cancel', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", isBusy: busy, disabled: !createTitle.trim(), onClick: create }, __('Create and open', 'wooptionsfic')))) : null,
                deleteTarget ? wp.element.createElement(WooOptionsFic.Components.ConfirmModal, { title: __('Delete permanently?', 'wooptionsfic'), message: __('This removes the option set and its complete revision history. This action cannot be undone.', 'wooptionsfic'), confirmLabel: __('Delete permanently', 'wooptionsfic'), busy: busy, destructive: true, onConfirm: confirmDelete, onCancel: () => setDeleteTarget(null) }) : null);
        }
        Pages.OptionSets = OptionSets;
    })(Pages = WooOptionsFic.Pages || (WooOptionsFic.Pages = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Pages;
    (function (Pages) {
        const { Button, SearchControl } = wp.components;
        const { __ } = wp.i18n;
        const { useEffect, useMemo, useState } = wp.element;
        function Templates(props) {
            const [items, setItems] = useState([]);
            const [search, setSearch] = useState('');
            const [loading, setLoading] = useState(true);
            const [busy, setBusy] = useState(null);
            const [error, setError] = useState('');
            useEffect(() => { WooOptionsFic.Api.listTemplates().then((response) => setItems(response.items)).catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason))).finally(() => setLoading(false)); }, []);
            const filtered = useMemo(() => {
                const term = search.trim().toLowerCase();
                return term ? items.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(term)) : items;
            }, [items, search]);
            const importTemplate = async (slug) => {
                setBusy(slug);
                try {
                    const result = await WooOptionsFic.Api.importTemplate(slug);
                    props.navigate(`builder/${result.uuid}`);
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setBusy(null);
                }
            };
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Fast, practical starting points', 'wooptionsfic'), title: __('Template gallery', 'wooptionsfic'), description: __('Every template is an editable option set—not a locked demo.', 'wooptionsfic') }),
                error ? wp.element.createElement(WooOptionsFic.Components.InlineNotice, { type: "error" }, error) : null,
                wp.element.createElement("div", { className: "wof-template-toolbar" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("strong", null, __('Original templates', 'wooptionsfic')),
                        wp.element.createElement("span", null, __('Schema-tested and ready to adapt', 'wooptionsfic'))),
                    wp.element.createElement(SearchControl, { label: __('Search templates', 'wooptionsfic'), value: search, onChange: setSearch, placeholder: __('Search use cases…', 'wooptionsfic') })),
                loading ? wp.element.createElement(WooOptionsFic.Components.Loading, { label: __('Loading templates…', 'wooptionsfic') }) : wp.element.createElement("div", { className: "wof-template-grid" }, filtered.map((item) => wp.element.createElement("article", { className: "wof-template-card", key: item.slug },
                    wp.element.createElement("div", { className: "wof-template-art" },
                        wp.element.createElement("span", null,
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "star-filled" }))),
                    wp.element.createElement("div", { className: "wof-template-card__body" },
                        wp.element.createElement("span", { className: "wof-eyebrow" }, item.category),
                        wp.element.createElement("h2", null, item.name),
                        wp.element.createElement("p", null, item.description),
                        wp.element.createElement("div", { className: "wof-template-card__meta" },
                            wp.element.createElement("span", null,
                                item.fieldCount ?? '—',
                                " ",
                                __('fields', 'wooptionsfic'))),
                        wp.element.createElement(Button, { variant: "primary", isBusy: busy === item.slug, onClick: () => importTemplate(item.slug) }, __('Use this template', 'wooptionsfic')))))));
        }
        Pages.Templates = Templates;
    })(Pages = WooOptionsFic.Pages || (WooOptionsFic.Pages = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Pages;
    (function (Pages) {
        const { __ } = wp.i18n;
        const { useEffect, useState } = wp.element;
        function Analytics() {
            const [data, setData] = useState(null);
            const [error, setError] = useState('');
            useEffect(() => { WooOptionsFic.Api.analytics().then(setData).catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason))); }, []);
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Storefront signals', 'wooptionsfic'), title: __('Analytics', 'wooptionsfic'), description: __('Understand interactions, validation friction, and configured-product conversions.', 'wooptionsfic') }),
                error ? wp.element.createElement(WooOptionsFic.Components.InlineNotice, { type: "error" }, error) : !data ? wp.element.createElement(WooOptionsFic.Components.Loading, null) : wp.element.createElement(wp.element.Fragment, null,
                    wp.element.createElement("div", { className: "wof-stat-grid" }, Object.entries(data).slice(0, 4).map(([key, value]) => wp.element.createElement("div", { className: "wof-stat", key: key },
                        wp.element.createElement("span", null, key.replace(/([A-Z])/g, ' $1')),
                        wp.element.createElement("strong", null, typeof value === 'number' || typeof value === 'string' ? value : '—'),
                        wp.element.createElement("small", null, __('Current reporting window', 'wooptionsfic'))))),
                    wp.element.createElement("section", { className: "wof-panel" },
                        wp.element.createElement("div", { className: "wof-panel__header" },
                            wp.element.createElement("div", null,
                                wp.element.createElement("h2", null, __('Analytics payload', 'wooptionsfic')),
                                wp.element.createElement("p", null, __('Raw server-authoritative summary for development and verification.', 'wooptionsfic')))),
                        wp.element.createElement("pre", { className: "wof-code-panel" }, JSON.stringify(data, null, 2)))));
        }
        Pages.Analytics = Analytics;
    })(Pages = WooOptionsFic.Pages || (WooOptionsFic.Pages = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Pages;
    (function (Pages) {
        const { Button, TextControl, ToggleControl } = wp.components;
        const { __ } = wp.i18n;
        const { useEffect, useState } = wp.element;
        function Integrations() {
            const [items, setItems] = useState(null);
            useEffect(() => { WooOptionsFic.Api.integrations().then((response) => setItems(response.items)).catch(() => setItems([])); }, []);
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Connected commerce surface', 'wooptionsfic'), title: __('Integrations', 'wooptionsfic'), description: __('See the WooCommerce and WordPress services WooOptionsFic can use.', 'wooptionsfic') }),
                items === null ? wp.element.createElement(WooOptionsFic.Components.Loading, null) : wp.element.createElement("div", { className: "wof-integration-grid" }, items.map((item, index) => wp.element.createElement("article", { className: "wof-integration-card", key: item.id ?? index },
                    wp.element.createElement("span", null,
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-links" })),
                    wp.element.createElement("h2", null, item.name ?? item.label ?? `Integration ${index + 1}`),
                    wp.element.createElement("p", null, item.description ?? item.detail ?? ''),
                    wp.element.createElement(WooOptionsFic.Components.StatusPill, { status: item.available || item.connected ? __('Connected', 'wooptionsfic') : __('Unavailable', 'wooptionsfic') })))));
        }
        Pages.Integrations = Integrations;
        function Diagnostics() {
            const [data, setData] = useState(null);
            const [loading, setLoading] = useState(true);
            const refresh = () => { setLoading(true); WooOptionsFic.Api.diagnostics().then(setData).finally(() => setLoading(false)); };
            useEffect(refresh, []);
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('System confidence', 'wooptionsfic'), title: __('Diagnostics', 'wooptionsfic'), description: __('Verify database tables, sessions, REST routes, and WooCommerce services.', 'wooptionsfic'), actions: wp.element.createElement(Button, { variant: "secondary", onClick: refresh }, __('Run again', 'wooptionsfic')) }),
                loading ? wp.element.createElement(WooOptionsFic.Components.Loading, null) : wp.element.createElement("section", { className: "wof-panel" },
                    wp.element.createElement("pre", { className: "wof-code-panel" }, JSON.stringify(data, null, 2))));
        }
        Pages.Diagnostics = Diagnostics;
        function Settings() {
            const [settings, setSettings] = useState(null);
            const [saving, setSaving] = useState(false);
            const [notice, setNotice] = useState('');
            useEffect(() => { WooOptionsFic.Api.getSettings().then(setSettings); }, []);
            if (!settings)
                return wp.element.createElement("div", { className: "wof-page" },
                    wp.element.createElement(WooOptionsFic.Components.Loading, null));
            const set = (key, value) => setSettings({ ...settings, [key]: value });
            const save = async () => { setSaving(true); try {
                setSettings(await WooOptionsFic.Api.saveSettings(settings));
                setNotice(__('Settings saved.', 'wooptionsfic'));
            }
            finally {
                setSaving(false);
            } };
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Operational defaults', 'wooptionsfic'), title: __('Settings', 'wooptionsfic'), description: __('Control limits and product-option behavior without editing code.', 'wooptionsfic'), actions: wp.element.createElement(Button, { variant: "primary", isBusy: saving, onClick: save }, __('Save settings', 'wooptionsfic')) }),
                notice ? wp.element.createElement(WooOptionsFic.Components.InlineNotice, { type: "success", onClose: () => setNotice('') }, notice) : null,
                wp.element.createElement("div", { className: "wof-settings-grid" },
                    wp.element.createElement("section", { className: "wof-settings-section" },
                        wp.element.createElement("h2", null, __('Public API limits', 'wooptionsfic')),
                        wp.element.createElement(TextControl, { label: __('Quote requests per minute', 'wooptionsfic'), type: "number", value: String(settings.quote_rate_limit_per_minute ?? 60), onChange: (value) => set('quote_rate_limit_per_minute', Number(value)) }),
                        wp.element.createElement(TextControl, { label: __('Upload size limit (MB)', 'wooptionsfic'), type: "number", value: String(settings.upload_max_mb ?? 10), onChange: (value) => set('upload_max_mb', Number(value)) })),
                    wp.element.createElement("section", { className: "wof-settings-section" },
                        wp.element.createElement("h2", null, __('Features', 'wooptionsfic')),
                        Object.entries(settings).filter(([, value]) => typeof value === 'boolean').map(([key, value]) => wp.element.createElement(ToggleControl, { key: key, label: key.replace(/_/g, ' '), checked: Boolean(value), onChange: (checked) => set(key, checked) })))));
        }
        Pages.Settings = Settings;
        function Help(props) {
            return wp.element.createElement("div", { className: "wof-page" },
                wp.element.createElement(WooOptionsFic.Components.PageHeader, { eyebrow: __('Learn the workshop', 'wooptionsfic'), title: __('Help & onboarding', 'wooptionsfic'), description: __('A practical route from your first element to a published product configurator.', 'wooptionsfic') }),
                wp.element.createElement("div", { className: "wof-onboarding-grid" },
                    wp.element.createElement("article", null,
                        wp.element.createElement("span", null, "1"),
                        wp.element.createElement("h2", null, __('Create or import', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Start blank or choose one of the editable templates.', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "secondary", onClick: () => props.navigate('templates') }, __('Browse templates', 'wooptionsfic'))),
                    wp.element.createElement("article", null,
                        wp.element.createElement("span", null, "2"),
                        wp.element.createElement("h2", null, __('Build and style', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Add elements, configure prices and logic, and preview the product page live.', 'wooptionsfic'))),
                    wp.element.createElement("article", null,
                        wp.element.createElement("span", null, "3"),
                        wp.element.createElement("h2", null, __('Assign and publish', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Target products or catalog groups, run preflight checks, then publish.', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", onClick: () => props.navigate('option-sets') }, __('Open option sets', 'wooptionsfic')))));
        }
        Pages.Help = Help;
    })(Pages = WooOptionsFic.Pages || (WooOptionsFic.Pages = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { __ } = wp.i18n;
        function choiceLabel(choice) {
            const amount = choice.pricing?.strategy === 'fixed' && choice.pricing.amount !== '0' ? ` · ${choice.pricing.amount}` : '';
            return `${choice.label}${amount}`;
        }
        function previewColor(field) {
            const value = String(field.default ?? '#5B4FF5').toUpperCase();
            return /^#[0-9A-F]{6}$/.test(value) ? value : '#5B4FF5';
        }
        function FieldPreview(props) {
            const field = props.field;
            const choices = field.choices ?? [];
            if (field.type === 'heading')
                return wp.element.createElement("h3", { className: "wof-preview-heading" }, field.label);
            if (field.type === 'paragraph')
                return wp.element.createElement("p", { className: "wof-preview-paragraph" }, field.description || field.label);
            if (field.type === 'help')
                return wp.element.createElement("div", { className: "wof-preview-help" }, field.description || field.help || field.label);
            if (field.type === 'separator')
                return wp.element.createElement("hr", { className: "wof-preview-separator" });
            if (field.type === 'spacer')
                return wp.element.createElement("div", { className: "wof-preview-spacer", style: { height: `${Number(field.style?.height ?? 24)}px` } });
            if (field.type === 'formula' || field.type === 'calculated')
                return wp.element.createElement("output", { className: "wof-preview-output" }, "0.00");
            if (field.type === 'checkbox' || field.type === 'toggle')
                return wp.element.createElement("label", { className: "wof-preview-boolean" },
                    wp.element.createElement("input", { type: "checkbox", disabled: true }),
                    wp.element.createElement("span", null),
                    wp.element.createElement("strong", null, field.label));
            if (field.type === 'textarea') {
                return wp.element.createElement("div", { className: "wof-preview-textarea-wrap" },
                    wp.element.createElement("textarea", { className: "wof-preview-textarea", readOnly: true, tabIndex: -1, placeholder: field.placeholder || 'Enter text…' }),
                    wp.element.createElement("small", null, __('Multi-line text', 'wooptionsfic')));
            }
            if (field.type === 'select') {
                return wp.element.createElement("div", { className: "wof-preview-select-control" },
                    wp.element.createElement("select", { "aria-disabled": "true", tabIndex: -1, value: "", onChange: () => undefined },
                        wp.element.createElement("option", { value: "" }, choices[0]?.label ?? __('Choose an option', 'wooptionsfic'))),
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-down-alt2" }));
            }
            if (field.type === 'color_picker') {
                const color = previewColor(field);
                return wp.element.createElement("div", { className: "wof-preview-color-picker" },
                    wp.element.createElement("span", { className: "wof-preview-color-picker__swatch", style: { background: color } }),
                    wp.element.createElement("span", null,
                        wp.element.createElement("strong", null, color),
                        wp.element.createElement("small", null, __('Click to choose a color', 'wooptionsfic'))),
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-customizer" }));
            }
            if (field.type === 'range')
                return wp.element.createElement("input", { disabled: true, type: "range", min: field.min ?? 0, max: field.max ?? 100 });
            if (field.type === 'file') {
                const maxFiles = Math.max(1, Number(field.maxFiles ?? 1));
                const maxMb = Math.max(1, Number(field.maxFileMb ?? 5));
                return wp.element.createElement("div", { className: "wof-preview-upload" },
                    wp.element.createElement("div", { className: "wof-preview-upload__picker" },
                        wp.element.createElement("button", { type: "button", className: "wof-preview-upload__button", tabIndex: -1, "aria-disabled": "true" },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "upload" }),
                            __('Upload', 'wooptionsfic')),
                        wp.element.createElement("span", null, __('Click or drag and drop', 'wooptionsfic')),
                        wp.element.createElement("small", null, maxFiles === 1 ? `${maxMb} MB max` : `Up to ${maxFiles} files, ${maxMb} MB each`)),
                    wp.element.createElement("div", { className: "wof-preview-upload__item" },
                        wp.element.createElement("span", { className: "wof-preview-upload__remove", "aria-hidden": "true" }, "\u00D7"),
                        wp.element.createElement("span", { className: "wof-preview-upload__file-icon" },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "media-default" })),
                        wp.element.createElement("span", { className: "wof-preview-upload__copy" },
                            wp.element.createElement("strong", null, __('Uploaded file preview', 'wooptionsfic')),
                            wp.element.createElement("span", { className: "wof-preview-upload__progress" },
                                wp.element.createElement("i", null))),
                        wp.element.createElement("small", null, "0.20 MB")));
            }
            if (field.type === 'date_range')
                return wp.element.createElement("div", { className: "wof-preview-date-range" },
                    wp.element.createElement("input", { disabled: true, type: "date" }),
                    wp.element.createElement("span", null, "to"),
                    wp.element.createElement("input", { disabled: true, type: "date" }));
            if (['radio', 'checkbox_group', 'segmented', 'font'].includes(field.type)) {
                return wp.element.createElement("div", { className: "wof-preview-choice-row" }, choices.slice(0, 4).map((choice, index) => wp.element.createElement("span", { className: index === 0 ? 'is-selected' : '', key: choice.uuid }, choiceLabel(choice))));
            }
            if (field.type === 'color_swatch') {
                return wp.element.createElement("div", { className: "wof-preview-swatches" }, choices.slice(0, 5).map((choice, index) => wp.element.createElement("span", { className: index === 0 ? 'is-selected' : '', style: { background: choice.color || '#ddd' }, key: choice.uuid })));
            }
            if (field.type === 'image_swatch' || field.type === 'product') {
                return wp.element.createElement("div", { className: "wof-preview-images" }, choices.slice(0, 4).map((choice, index) => wp.element.createElement("span", { className: index === 0 ? 'is-selected' : '', key: choice.uuid },
                    choice.imageId || choice.imageUrl ? wp.element.createElement(WooOptionsFic.Components.MediaImage, { attachmentId: choice.imageId, src: choice.imageUrl, alt: "" }) : wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" }),
                    wp.element.createElement("small", null, choice.label))));
            }
            if (field.type === 'repeater')
                return wp.element.createElement("div", { className: "wof-preview-repeater" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("strong", null, "Item 1"),
                        wp.element.createElement("small", null,
                            field.children?.length ?? 0,
                            " fields")),
                    wp.element.createElement("button", { type: "button", disabled: true }, "+ Add item"));
            const inputType = {
                password: 'password', tel: 'tel', email: 'email', url: 'url', number: 'number', quantity: 'number', date: 'date', time: 'time', datetime: 'datetime-local', customer_defined_price: 'number',
            };
            return wp.element.createElement("input", { disabled: true, type: inputType[field.type] ?? 'text', placeholder: field.placeholder || 'Enter value…' });
        }
        Builder.FieldPreview = FieldPreview;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { SearchControl } = wp.components;
        const { __ } = wp.i18n;
        const { useMemo, useState } = wp.element;
        const groupLabels = {
            choice: __('Choices', 'wooptionsfic'),
            boolean: __('Yes / no', 'wooptionsfic'),
            scalar: __('Inputs', 'wooptionsfic'),
            upload: __('Assets', 'wooptionsfic'),
            calculated: __('Pricing & outputs', 'wooptionsfic'),
            repeater: __('Structure', 'wooptionsfic'),
            content: __('Content', 'wooptionsfic'),
        };
        function ElementItem(props) {
            const dragStart = (event) => {
                event.dataTransfer?.setData('application/x-wooptionsfic-field-type', props.type);
                if (event.dataTransfer)
                    event.dataTransfer.effectAllowed = 'copy';
            };
            return wp.element.createElement("button", { type: "button", draggable: true, className: "wof-palette-item", onDragStart: dragStart, onClick: () => props.onAdd(WooOptionsFic.FieldFactory.create(props.type)) },
                wp.element.createElement("span", { className: "wof-palette-item__grip" },
                    wp.element.createElement(WooOptionsFic.Components.GripIcon, null)),
                wp.element.createElement("span", { className: "wof-palette-item__icon" },
                    wp.element.createElement(WooOptionsFic.Components.FieldIcon, { type: props.type })),
                wp.element.createElement("strong", null, props.label));
        }
        function ElementsPanel(props) {
            const [search, setSearch] = useState('');
            const groups = useMemo(() => {
                const term = search.trim().toLowerCase();
                const map = new Map();
                Object.entries(window.WooOptionsFicAdmin.fieldTypes).forEach(([type, manifest]) => {
                    if (term && !`${type} ${manifest.label} ${manifest.group}`.toLowerCase().includes(term))
                        return;
                    const items = map.get(manifest.group) ?? [];
                    items.push({ type, label: manifest.label });
                    map.set(manifest.group, items);
                });
                return map;
            }, [search]);
            return wp.element.createElement("aside", { className: "wof-builder-palette" },
                wp.element.createElement("div", { className: "wof-builder-pane__heading wof-palette-heading" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("h2", null, __('Elements', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Drag or click to add to the live product form', 'wooptionsfic'))),
                    wp.element.createElement("button", { type: "button", className: "wof-pane-action", onClick: props.onOpenStyle, "aria-label": __('Open Style Studio', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "ellipsis" }))),
                wp.element.createElement(SearchControl, { label: __('Search field types', 'wooptionsfic'), value: search, onChange: setSearch, placeholder: __('Find a field…', 'wooptionsfic') }),
                wp.element.createElement("div", { className: "wof-palette-groups" },
                    Array.from(groups.entries()).map(([group, items]) => wp.element.createElement("section", { key: group },
                        wp.element.createElement("h3", null, groupLabels[group] ?? group),
                        wp.element.createElement("div", null, items.map((item) => wp.element.createElement(ElementItem, { key: item.type, type: item.type, label: item.label, onAdd: props.onAdd }))))),
                    !groups.size ? wp.element.createElement("p", { className: "wof-palette-empty" }, __('No fields match that search.', 'wooptionsfic')) : null),
                wp.element.createElement("p", { className: "wof-palette-tip" },
                    wp.element.createElement(WooOptionsFic.Components.GripIcon, null),
                    __('Click to add, or drag a field onto the canvas.', 'wooptionsfic')));
        }
        Builder.ElementsPanel = ElementsPanel;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { __ } = wp.i18n;
        const { useEffect, useMemo, useState } = wp.element;
        const FIELD_TYPE_MIME = 'application/x-wooptionsfic-field-type';
        const FIELD_INDEX_MIME = 'application/x-wooptionsfic-field-index';
        function hasBuilderDrag(event) {
            const types = Array.from(event.dataTransfer?.types ?? []);
            return types.includes(FIELD_TYPE_MIME) || types.includes(FIELD_INDEX_MIME);
        }
        function CanvasField(props) {
            const [dropEdge, setDropEdge] = useState(null);
            const dragStart = (event) => {
                event.stopPropagation();
                event.dataTransfer?.setData(FIELD_INDEX_MIME, String(props.index));
                if (event.dataTransfer)
                    event.dataTransfer.effectAllowed = 'move';
            };
            const dragOver = (event) => {
                if (!hasBuilderDrag(event))
                    return;
                event.preventDefault();
                event.stopPropagation();
                if (event.dataTransfer)
                    event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(FIELD_TYPE_MIME) ? 'copy' : 'move';
                const element = event.currentTarget;
                const bounds = element.getBoundingClientRect();
                setDropEdge(event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after');
            };
            const dragLeave = (event) => {
                const element = event.currentTarget;
                if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))
                    return;
                setDropEdge(null);
            };
            const drop = (event) => {
                if (!hasBuilderDrag(event))
                    return;
                event.preventDefault();
                event.stopPropagation();
                const type = event.dataTransfer?.getData(FIELD_TYPE_MIME) ?? '';
                const sourceText = event.dataTransfer?.getData(FIELD_INDEX_MIME) ?? '';
                const insertIndex = props.index + (dropEdge === 'after' ? 1 : 0);
                setDropEdge(null);
                if (type) {
                    props.onAdd(WooOptionsFic.FieldFactory.create(type), insertIndex);
                    return;
                }
                const source = Number(sourceText);
                if (!Number.isInteger(source))
                    return;
                let finalIndex = insertIndex;
                if (source < insertIndex)
                    finalIndex -= 1;
                finalIndex = Math.max(0, Math.min(props.count - 1, finalIndex));
                if (finalIndex !== source)
                    props.onMove(source, finalIndex);
            };
            return wp.element.createElement("article", { className: WooOptionsFic.Utils.classNames('wof-canvas-field', props.selected && 'is-selected', props.field.disabled && 'is-disabled', dropEdge === 'before' && 'is-drop-before', dropEdge === 'after' && 'is-drop-after'), onDragOver: dragOver, onDragLeave: dragLeave, onDrop: drop, onClick: props.onSelect, "data-field-uuid": props.field.uuid },
                !props.previewMode ? wp.element.createElement("div", { className: "wof-canvas-field__toolbar", onClick: (event) => event.stopPropagation() },
                    wp.element.createElement("button", { type: "button", draggable: true, className: "wof-canvas-field__drag-handle", onDragStart: dragStart, onDragEnd: () => setDropEdge(null), "aria-label": __('Drag field', 'wooptionsfic'), title: __('Drag to reorder', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.GripIcon, null)),
                    wp.element.createElement("button", { type: "button", onClick: props.onDuplicate, "aria-label": __('Duplicate field', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-page" })),
                    wp.element.createElement("button", { type: "button", className: "is-destructive", onClick: props.onDelete, "aria-label": __('Delete field', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" }))) : null,
                wp.element.createElement("div", { className: "wof-canvas-field__copy" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("strong", null, props.field.label || __('Untitled field', 'wooptionsfic')),
                        props.field.required ? wp.element.createElement("span", null, __('Required', 'wooptionsfic')) : null),
                    wp.element.createElement("small", null, props.field.choices?.length ? `${props.field.choices.length} ${__('choices', 'wooptionsfic')}` : window.WooOptionsFicAdmin.fieldTypes[props.field.type]?.label ?? props.field.type)),
                wp.element.createElement("div", { className: "wof-canvas-field__preview" },
                    wp.element.createElement(Builder.FieldPreview, { field: props.field })));
        }
        function Canvas(props) {
            const [previewMode, setPreviewMode] = useState(false);
            const [zoom, setZoom] = useState(100);
            const [dragActive, setDragActive] = useState(false);
            const palette = window.WooOptionsFicAdmin.palettes[props.document.style.palette] ?? window.WooOptionsFicAdmin.palettes['iris-studio'];
            const tokens = { ...(palette?.tokens ?? {}), ...(props.document.style.overrides ?? {}) };
            const typography = props.document.style.typography ?? { family: 'inherit' };
            const fontStack = {
                inherit: 'inherit',
                'system-ui': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                Inter: 'Inter, system-ui, sans-serif',
                Manrope: 'Manrope, system-ui, sans-serif',
                Poppins: 'Poppins, system-ui, sans-serif',
                Outfit: 'Outfit, system-ui, sans-serif',
                'Plus Jakarta Sans': '"Plus Jakarta Sans", system-ui, sans-serif',
                Roboto: 'Roboto, system-ui, sans-serif',
            };
            const style = useMemo(() => ({
                '--wof-preview-primary': tokens.primary ?? '#5B4FF5',
                '--wof-preview-background': tokens.background ?? '#F7F7FC',
                '--wof-preview-surface': tokens.surface ?? '#FFFFFF',
                '--wof-preview-text': tokens.text ?? '#172033',
                '--wof-preview-muted': tokens.muted ?? '#5E6A7D',
                '--wof-preview-border': tokens.border ?? '#D8DEEA',
                '--wof-preview-font': fontStack[typography.family] ?? typography.family ?? 'inherit',
                '--wof-preview-label-weight': String(typography.labelWeight ?? 650),
                zoom: zoom / 100,
            }), [props.document.style, zoom]);
            useEffect(() => {
                const reset = () => setDragActive(false);
                document.addEventListener('dragend', reset);
                document.addEventListener('drop', reset);
                return () => {
                    document.removeEventListener('dragend', reset);
                    document.removeEventListener('drop', reset);
                };
            }, []);
            const dropAtEnd = (event) => {
                if (!hasBuilderDrag(event))
                    return;
                event.preventDefault();
                event.stopPropagation();
                setDragActive(false);
                const type = event.dataTransfer?.getData(FIELD_TYPE_MIME) ?? '';
                const source = Number(event.dataTransfer?.getData(FIELD_INDEX_MIME));
                if (type)
                    props.onAdd(WooOptionsFic.FieldFactory.create(type));
                else if (Number.isInteger(source))
                    props.onMove(source, props.document.fields.length - 1);
            };
            const canvasDragOver = (event) => {
                if (!hasBuilderDrag(event))
                    return;
                event.preventDefault();
                setDragActive(true);
                if (event.dataTransfer)
                    event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(FIELD_TYPE_MIME) ? 'copy' : 'move';
            };
            const canvasDragLeave = (event) => {
                const element = event.currentTarget;
                if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))
                    return;
                setDragActive(false);
            };
            return wp.element.createElement("section", { className: WooOptionsFic.Utils.classNames('wof-builder-canvas', previewMode ? 'is-preview-mode' : 'is-edit-mode', dragActive && 'is-drag-active') },
                wp.element.createElement("div", { className: "wof-canvas-toolbar" },
                    wp.element.createElement("div", { className: "wof-canvas-toolbar__copy" },
                        wp.element.createElement("h2", null, __('Live storefront canvas', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('The builder and product page use the same component stylesheet.', 'wooptionsfic'))),
                    wp.element.createElement("div", { className: "wof-canvas-toolbar__controls" },
                        wp.element.createElement("div", { className: "wof-zoom-control" },
                            wp.element.createElement("button", { type: "button", disabled: zoom <= 75, onClick: () => setZoom(Math.max(75, zoom - 10)) },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "minus" })),
                            wp.element.createElement("output", null,
                                zoom,
                                "%"),
                            wp.element.createElement("button", { type: "button", disabled: zoom >= 125, onClick: () => setZoom(Math.min(125, zoom + 10)) },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }))),
                        wp.element.createElement("span", { className: "wof-interactive-status" },
                            wp.element.createElement("i", null),
                            __('Interactive', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-mode-switcher" },
                            wp.element.createElement("button", { type: "button", className: !previewMode ? 'is-active' : '', onClick: () => setPreviewMode(false) },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "edit" }),
                                __('Edit', 'wooptionsfic')),
                            wp.element.createElement("button", { type: "button", className: previewMode ? 'is-active' : '', onClick: () => setPreviewMode(true) },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "visibility" }),
                                __('Preview', 'wooptionsfic'))))),
                wp.element.createElement("div", { className: `wof-canvas-device is-${props.device}`, style: style },
                    wp.element.createElement("div", { className: "wof-canvas-device__chrome" },
                        wp.element.createElement("span", null, __('Live customer preview', 'wooptionsfic')),
                        wp.element.createElement("small", null,
                            props.device,
                            " \u00B7 ",
                            props.document.layout.type)),
                    wp.element.createElement("div", { className: "wof-canvas-frame" },
                        wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-canvas-sheet', dragActive && 'is-drag-active'), onDragEnter: canvasDragOver, onDragOver: canvasDragOver, onDragLeave: canvasDragLeave, onDrop: dropAtEnd },
                            wp.element.createElement("div", { className: "wof-product-shell" },
                                wp.element.createElement("aside", { className: "wof-product-shell__media" },
                                    wp.element.createElement("div", { className: "wof-product-gallery__hero" },
                                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" })),
                                    wp.element.createElement("div", { className: "wof-product-gallery__thumbs" },
                                        wp.element.createElement("div", { className: "wof-product-gallery__thumb" },
                                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" })),
                                        wp.element.createElement("div", { className: "wof-product-gallery__thumb" },
                                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" })),
                                        wp.element.createElement("div", { className: "wof-product-gallery__thumb" },
                                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" })))),
                                wp.element.createElement("div", { className: "wof-product-shell__content" },
                                    wp.element.createElement("div", { className: "wof-product-preview-meta" },
                                        wp.element.createElement("span", { className: "wof-product-preview-meta__eyebrow" }, __('Live product preview', 'wooptionsfic')),
                                        wp.element.createElement("h1", null, __('WowAddon Product (Preview)', 'wooptionsfic')),
                                        wp.element.createElement("strong", { className: "wof-product-preview-meta__price" }, "20.00 USD")),
                                    props.document.fields.length ? wp.element.createElement("div", { className: `wof-canvas-fields is-${props.document.layout.type}` },
                                        props.document.fields.map((field, index) => wp.element.createElement(CanvasField, { key: field.uuid, field: field, index: index, count: props.document.fields.length, selected: field.uuid === props.selectedUuid, previewMode: previewMode, onSelect: () => props.onSelect(field.uuid), onAdd: props.onAdd, onMove: props.onMove, onDuplicate: () => props.onDuplicate(field), onDelete: () => props.onDelete(field.uuid) })),
                                        wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-canvas-drop-end', dragActive && 'is-active'), onDragOver: canvasDragOver, onDrop: dropAtEnd },
                                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }),
                                            __('Drop a field here', 'wooptionsfic'))) : wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-canvas-empty', dragActive && 'is-active'), onDragOver: canvasDragOver, onDrop: dropAtEnd },
                                        wp.element.createElement("div", null,
                                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "layout" })),
                                        wp.element.createElement("h3", null, __('Your canvas is ready', 'wooptionsfic')),
                                        wp.element.createElement("p", null, __('Choose a field from the palette or drag one into this product page preview.', 'wooptionsfic')))))))));
        }
        Builder.Canvas = Canvas;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { SelectControl, ToggleControl } = wp.components;
        const { __ } = wp.i18n;
        function StyleStudio(props) {
            const document = props.document;
            const updateStyle = (patch) => props.onChange({ style: { ...document.style, ...patch } });
            const updateTypography = (patch) => updateStyle({ typography: { ...document.style.typography, ...patch } });
            const updateSettings = (patch) => props.onChange({ settings: { ...document.settings, ...patch } });
            const fonts = ['inherit', 'system-ui', 'Inter', 'Manrope', 'Poppins', 'Outfit', 'Plus Jakarta Sans', 'Roboto'];
            return wp.element.createElement("div", { className: "wof-style-studio" },
                wp.element.createElement("h3", null, __('Color palette', 'wooptionsfic')),
                wp.element.createElement("div", { className: "wof-palette-picker" }, Object.entries(window.WooOptionsFicAdmin.palettes).map(([key, palette]) => wp.element.createElement("button", { type: "button", key: key, className: document.style.palette === key ? 'is-selected' : '', onClick: () => updateStyle({ palette: key }) },
                    wp.element.createElement("span", { className: "wof-palette-dots" }, ['primary', 'accent', 'background', 'surface'].map((token) => wp.element.createElement("i", { key: token, style: { background: palette.tokens[token] } }))),
                    wp.element.createElement("span", null,
                        wp.element.createElement("strong", null, palette.name),
                        wp.element.createElement("small", null, key)),
                    wp.element.createElement("b", null, "\u2713")))),
                wp.element.createElement("div", { className: "wof-style-divider" }),
                wp.element.createElement("h3", null, __('Typography', 'wooptionsfic')),
                wp.element.createElement(SelectControl, { label: __('Font family', 'wooptionsfic'), value: document.style.typography.family ?? 'inherit', options: fonts.map((font) => ({ label: font === 'inherit' ? __('Inherit from theme', 'wooptionsfic') : font === 'system-ui' ? __('System UI', 'wooptionsfic') : font, value: font })), onChange: (family) => updateTypography({ family }) }),
                wp.element.createElement(SelectControl, { label: __('Label weight', 'wooptionsfic'), value: String(document.style.typography.labelWeight ?? 650), options: [400, 500, 600, 650, 700, 800].map((value) => ({ label: String(value), value: String(value) })), onChange: (value) => updateTypography({ labelWeight: Number(value) }) }),
                wp.element.createElement(SelectControl, { label: __('Body weight', 'wooptionsfic'), value: String(document.style.typography.bodyWeight ?? 450), options: [300, 400, 450, 500, 600, 700].map((value) => ({ label: String(value), value: String(value) })), onChange: (value) => updateTypography({ bodyWeight: Number(value) }) }),
                wp.element.createElement("div", { className: "wof-style-divider" }),
                wp.element.createElement("h3", null, __('Layout & summary', 'wooptionsfic')),
                wp.element.createElement(SelectControl, { label: __('Layout preset', 'wooptionsfic'), value: document.layout.type, options: [{ label: __('Stacked form', 'wooptionsfic'), value: 'stack' }, { label: __('Inline', 'wooptionsfic'), value: 'inline' }, { label: __('Responsive grid', 'wooptionsfic'), value: 'grid' }], onChange: (type) => props.onChange({ layout: { ...document.layout, type } }) }),
                wp.element.createElement(ToggleControl, { label: __('Show itemized price breakdown', 'wooptionsfic'), checked: document.settings.showPriceBreakdown, onChange: (value) => updateSettings({ showPriceBreakdown: value }) }),
                wp.element.createElement(ToggleControl, { label: __('Keep configuration summary visible', 'wooptionsfic'), checked: document.settings.stickySummary, onChange: (value) => updateSettings({ stickySummary: value }) }),
                wp.element.createElement(ToggleControl, { label: __('Allow saved configurations', 'wooptionsfic'), checked: document.settings.saveEnabled, onChange: (value) => updateSettings({ saveEnabled: value }) }),
                wp.element.createElement(ToggleControl, { label: __('Allow shareable links', 'wooptionsfic'), checked: document.settings.shareEnabled, onChange: (value) => updateSettings({ shareEnabled: value }) }));
        }
        Builder.StyleStudio = StyleStudio;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { SelectControl, TextControl, ToggleControl } = wp.components;
        const { __, sprintf } = wp.i18n;
        const { useMemo } = wp.element;
        const contentOnlyTypes = ['heading', 'paragraph', 'help', 'separator', 'spacer', 'formula', 'calculated'];
        const operatorOptions = [
            { label: __('equals', 'wooptionsfic'), value: 'equals' },
            { label: __('does not equal', 'wooptionsfic'), value: 'not_equals' },
            { label: __('contains / is selected', 'wooptionsfic'), value: 'contains' },
            { label: __('does not contain', 'wooptionsfic'), value: 'not_contains' },
            { label: __('is greater than', 'wooptionsfic'), value: 'greater_than' },
            { label: __('is less than', 'wooptionsfic'), value: 'less_than' },
            { label: __('is empty', 'wooptionsfic'), value: 'empty' },
            { label: __('is not empty', 'wooptionsfic'), value: 'not_empty' },
        ];
        function cloneGroups(groups) {
            return groups.map((group) => ({
                ...group,
                conditions: group.conditions.map((condition) => ({ ...condition })),
            }));
        }
        function defaultCondition(fieldUuid, fields) {
            const source = fields.find((field) => field.uuid === fieldUuid);
            const operator = source?.multiple || ['checkbox_group', 'product'].includes(source?.type ?? '') ? 'contains' : 'equals';
            return {
                field: fieldUuid,
                operator,
                value: String(source?.choices?.[0]?.uuid ?? ''),
            };
        }
        function toConditionRow(expression) {
            return {
                field: String(expression?.left?.field ?? expression?.field ?? ''),
                operator: (expression?.operator ?? 'equals'),
                value: String(expression?.right?.literal ?? expression?.value ?? ''),
            };
        }
        function normalizeState(field, fields) {
            const visibility = (field.conditions ?? {}).visible;
            let effect = 'show';
            let expression = visibility;
            if (expression?.logic === 'not') {
                effect = 'hide';
                expression = expression.not ?? expression.condition ?? {};
            }
            let rootLogic = 'and';
            let storedGroups = [];
            if (expression?.wofRoot && Array.isArray(expression.conditions)) {
                rootLogic = expression.logic === 'or' ? 'or' : 'and';
                storedGroups = expression.conditions;
            }
            else if (['and', 'or'].includes(expression?.logic ?? '') && Array.isArray(expression?.conditions)) {
                const containsNestedGroup = expression.conditions.some((item) => ['and', 'or'].includes(item?.logic ?? '') && Array.isArray(item?.conditions));
                if (containsNestedGroup) {
                    rootLogic = expression.logic === 'or' ? 'or' : 'and';
                    storedGroups = expression.conditions;
                }
                else {
                    storedGroups = [expression];
                }
            }
            else if (expression && (expression.left || expression.field)) {
                storedGroups = [{ logic: 'and', conditions: [expression] }];
            }
            const groups = storedGroups
                .map((group) => ({
                logic: group.logic === 'or' ? 'or' : 'and',
                conditions: (Array.isArray(group.conditions) ? group.conditions : [group])
                    .filter(Boolean)
                    .map(toConditionRow),
            }))
                .filter((group) => group.conditions.length > 0);
            const firstField = fields[0]?.uuid ?? '';
            return {
                enabled: Boolean(visibility),
                effect,
                rootLogic,
                groups: groups.length ? groups : [{ logic: 'and', conditions: [defaultCondition(firstField, fields)] }],
            };
        }
        function LogicEditor(props) {
            const sourceFields = useMemo(() => WooOptionsFic.Utils.allFields(props.allFields).filter((field) => field.uuid !== props.field.uuid && !contentOnlyTypes.includes(field.type)), [props.allFields, props.field.uuid]);
            const state = useMemo(() => normalizeState(props.field, sourceFields), [props.field.conditions, sourceFields]);
            const save = (patch) => {
                const next = { ...state, ...patch };
                const fieldConditions = { ...(props.field.conditions ?? {}) };
                if (!next.enabled) {
                    delete fieldConditions.visible;
                    props.onChange({ ...props.field, conditions: fieldConditions });
                    return;
                }
                const storedGroups = next.groups
                    .map((group) => ({
                    logic: group.logic,
                    conditions: group.conditions
                        .filter((condition) => Boolean(condition.field))
                        .map((condition) => ({
                        left: { field: condition.field },
                        operator: condition.operator,
                        right: { literal: condition.value },
                    })),
                    wofGroup: true,
                }))
                    .filter((group) => Boolean(group.conditions?.length));
                if (!storedGroups.length) {
                    delete fieldConditions.visible;
                }
                else {
                    let visibility = storedGroups.length === 1
                        ? storedGroups[0]
                        : { logic: next.rootLogic, conditions: storedGroups, wofRoot: true };
                    if (next.effect === 'hide')
                        visibility = { logic: 'not', condition: visibility, wofEffect: 'hide' };
                    fieldConditions.visible = visibility;
                }
                props.onChange({ ...props.field, conditions: fieldConditions });
            };
            const updateGroup = (groupIndex, patch) => {
                const groups = cloneGroups(state.groups);
                groups[groupIndex] = { ...groups[groupIndex], ...patch };
                save({ groups });
            };
            const updateCondition = (groupIndex, conditionIndex, patch) => {
                const groups = cloneGroups(state.groups);
                groups[groupIndex].conditions[conditionIndex] = { ...groups[groupIndex].conditions[conditionIndex], ...patch };
                save({ groups });
            };
            const addCondition = (groupIndex) => {
                const groups = cloneGroups(state.groups);
                groups[groupIndex].conditions.push(defaultCondition(sourceFields[0]?.uuid ?? '', sourceFields));
                save({ groups });
            };
            const removeCondition = (groupIndex, conditionIndex) => {
                const groups = cloneGroups(state.groups);
                groups[groupIndex].conditions.splice(conditionIndex, 1);
                if (!groups[groupIndex].conditions.length)
                    groups[groupIndex].conditions.push(defaultCondition(sourceFields[0]?.uuid ?? '', sourceFields));
                save({ groups });
            };
            const removeGroup = (groupIndex) => {
                const groups = cloneGroups(state.groups);
                groups.splice(groupIndex, 1);
                save({ groups: groups.length ? groups : [{ logic: 'and', conditions: [defaultCondition(sourceFields[0]?.uuid ?? '', sourceFields)] }] });
            };
            return wp.element.createElement("div", { className: "wof-inspector-section wof-logic-builder" },
                wp.element.createElement("div", { className: "wof-inspector-section__intro" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("h3", null, __('Conditional logic', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Show or hide this field using multiple grouped conditions. Rules are rechecked securely on the storefront.', 'wooptionsfic')))),
                wp.element.createElement(ToggleControl, { __nextHasNoMarginBottom: true, label: __('Enable conditional logic', 'wooptionsfic'), checked: state.enabled, disabled: !sourceFields.length, onChange: (enabled) => enabled
                        ? save({ enabled: true, groups: [{ logic: 'and', conditions: [defaultCondition(sourceFields[0]?.uuid ?? '', sourceFields)] }] })
                        : save({ enabled: false }) }),
                !sourceFields.length ? wp.element.createElement("div", { className: "wof-logic-empty" }, __('Add another customer-input field before creating a condition.', 'wooptionsfic')) : null,
                state.enabled && sourceFields.length ? wp.element.createElement(wp.element.Fragment, null,
                    wp.element.createElement("div", { className: "wof-logic-behavior" },
                        wp.element.createElement(SelectControl, { label: __('Action', 'wooptionsfic'), value: state.effect, options: [{ label: __('Show this field', 'wooptionsfic'), value: 'show' }, { label: __('Hide this field', 'wooptionsfic'), value: 'hide' }], onChange: (effect) => save({ effect }) }),
                        state.groups.length > 1 ? wp.element.createElement(SelectControl, { label: __('Match rule groups', 'wooptionsfic'), value: state.rootLogic, options: [{ label: __('All groups must match', 'wooptionsfic'), value: 'and' }, { label: __('Any group may match', 'wooptionsfic'), value: 'or' }], onChange: (rootLogic) => save({ rootLogic }) }) : null),
                    wp.element.createElement("div", { className: "wof-logic-groups" }, state.groups.map((group, groupIndex) => wp.element.createElement("article", { className: "wof-logic-group", key: `group-${groupIndex}` },
                        wp.element.createElement("header", null,
                            wp.element.createElement("div", null,
                                wp.element.createElement("span", null, groupIndex + 1),
                                wp.element.createElement("div", null,
                                    wp.element.createElement("strong", null, sprintf(__('Rule group %d', 'wooptionsfic'), groupIndex + 1)),
                                    wp.element.createElement("small", null, __('Conditions inside this group', 'wooptionsfic')))),
                            wp.element.createElement(SelectControl, { label: __('Group matching', 'wooptionsfic'), hideLabelFromVision: true, value: group.logic, options: [{ label: __('Match all (AND)', 'wooptionsfic'), value: 'and' }, { label: __('Match any (OR)', 'wooptionsfic'), value: 'or' }], onChange: (logic) => updateGroup(groupIndex, { logic }) }),
                            state.groups.length > 1 ? wp.element.createElement("button", { type: "button", className: "wof-logic-delete", onClick: () => removeGroup(groupIndex), "aria-label": __('Delete rule group', 'wooptionsfic') },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" })) : null),
                        wp.element.createElement("div", { className: "wof-logic-conditions" }, group.conditions.map((condition, conditionIndex) => {
                            const source = sourceFields.find((field) => field.uuid === condition.field);
                            const hasChoices = Boolean(source?.choices?.length);
                            const needsValue = !['empty', 'not_empty'].includes(condition.operator);
                            return wp.element.createElement("div", { className: "wof-logic-condition", key: `condition-${groupIndex}-${conditionIndex}` },
                                wp.element.createElement("span", { className: "wof-logic-condition__number" }, conditionIndex + 1),
                                wp.element.createElement(SelectControl, { label: __('Source field', 'wooptionsfic'), hideLabelFromVision: true, value: condition.field, options: sourceFields.map((field) => ({ label: field.label || field.type, value: field.uuid })), onChange: (fieldUuid) => updateCondition(groupIndex, conditionIndex, defaultCondition(fieldUuid, sourceFields)) }),
                                wp.element.createElement(SelectControl, { label: __('Operator', 'wooptionsfic'), hideLabelFromVision: true, value: condition.operator, options: operatorOptions, onChange: (operator) => updateCondition(groupIndex, conditionIndex, { operator }) }),
                                needsValue ? hasChoices ? wp.element.createElement(SelectControl, { label: __('Value', 'wooptionsfic'), hideLabelFromVision: true, value: condition.value, options: [{ label: __('Choose a value…', 'wooptionsfic'), value: '' }, ...(source?.choices ?? []).map((choice) => ({ label: choice.label, value: choice.uuid }))], onChange: (value) => updateCondition(groupIndex, conditionIndex, { value }) }) : ['checkbox', 'toggle'].includes(source?.type ?? '') ? wp.element.createElement(SelectControl, { label: __('Value', 'wooptionsfic'), hideLabelFromVision: true, value: condition.value, options: [{ label: __('Checked / Yes', 'wooptionsfic'), value: '1' }, { label: __('Unchecked / No', 'wooptionsfic'), value: '' }], onChange: (value) => updateCondition(groupIndex, conditionIndex, { value }) }) : wp.element.createElement(TextControl, { label: __('Comparison value', 'wooptionsfic'), hideLabelFromVision: true, value: condition.value, placeholder: __('Enter a value', 'wooptionsfic'), onChange: (value) => updateCondition(groupIndex, conditionIndex, { value }) }) : null,
                                wp.element.createElement("button", { type: "button", className: "wof-logic-condition__remove", disabled: state.groups.length === 1 && group.conditions.length === 1, onClick: () => removeCondition(groupIndex, conditionIndex), "aria-label": __('Remove condition', 'wooptionsfic') },
                                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "no-alt" })));
                        })),
                        wp.element.createElement("button", { type: "button", className: "wof-logic-add-condition", onClick: () => addCondition(groupIndex) },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }),
                            __('Add condition', 'wooptionsfic'))))),
                    wp.element.createElement("button", { type: "button", className: "wof-logic-add-group", onClick: () => save({ groups: [...cloneGroups(state.groups), { logic: 'and', conditions: [defaultCondition(sourceFields[0]?.uuid ?? '', sourceFields)] }] }) },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }),
                        __('Add rule group', 'wooptionsfic')),
                    wp.element.createElement("p", { className: "wof-muted-note" }, __('Use groups to combine AND and OR rules. Choice-based comparisons store stable choice IDs, so renaming labels will not break the logic.', 'wooptionsfic'))) : null);
        }
        Builder.LogicEditor = LogicEditor;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { Button, ColorPicker, SelectControl, TextControl, TextareaControl, ToggleControl } = wp.components;
        const { __ } = wp.i18n;
        const { useEffect, useMemo, useRef, useState } = wp.element;
        const tabs = [
            ['content', __('Content', 'wooptionsfic')],
            ['choices', __('Choices', 'wooptionsfic')],
            ['pricing', __('Pricing', 'wooptionsfic')],
            ['logic', __('Logic', 'wooptionsfic')],
            ['style', __('Style', 'wooptionsfic')],
            ['advanced', __('Advanced', 'wooptionsfic')],
        ];
        function normalizeHexColor(value, fallback = '#5B4FF5') {
            const color = String(value || '').trim().toUpperCase();
            return /^#[0-9A-F]{6}$/.test(color) ? color : fallback;
        }
        function ChoiceColorControl(props) {
            const [open, setOpen] = useState(false);
            const color = normalizeHexColor(props.color);
            return wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-choice-color-control', open && 'is-open') },
                wp.element.createElement("span", { className: "wof-choice-color-control__label" }, props.label ?? __('Swatch color', 'wooptionsfic')),
                wp.element.createElement("div", { className: "wof-choice-color-control__row" },
                    wp.element.createElement("button", { type: "button", className: "wof-choice-color-control__trigger", onClick: () => setOpen((value) => !value), "aria-expanded": open },
                        wp.element.createElement("span", { style: { background: color }, "aria-hidden": "true" }),
                        wp.element.createElement("code", null, color),
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-down-alt2" })),
                    wp.element.createElement(TextControl, { label: __('Hex color', 'wooptionsfic'), hideLabelFromVision: true, value: color, onChange: (next) => {
                            if (/^#[0-9a-f]{6}$/i.test(next.trim()))
                                props.onChange(next.trim().toUpperCase());
                        } })),
                open ? wp.element.createElement("div", { className: "wof-choice-color-control__picker" },
                    wp.element.createElement(ColorPicker, { color: color, enableAlpha: false, onChange: (next) => props.onChange(normalizeHexColor(next, color)) })) : null);
        }
        function ChoiceMediaControl(props) {
            const [previewUrl, setPreviewUrl] = useState(props.choice.imageUrl ?? '');
            useEffect(() => {
                let active = true;
                setPreviewUrl(props.choice.imageUrl ?? '');
                const attachmentId = Number(props.choice.imageId ?? 0);
                if (!attachmentId || !wp.media?.attachment)
                    return () => { active = false; };
                const attachment = wp.media.attachment(attachmentId);
                const update = () => {
                    if (!active)
                        return;
                    const data = attachment.toJSON?.() ?? {};
                    const source = data.sizes?.thumbnail?.url ?? data.sizes?.medium?.url ?? data.url ?? '';
                    if (source)
                        setPreviewUrl(String(source));
                };
                update();
                const request = attachment.fetch?.();
                if (request)
                    Promise.resolve(request).then(update).catch(() => undefined);
                return () => { active = false; };
            }, [props.choice.imageId, props.choice.imageUrl]);
            const openPicker = () => {
                if (!wp.media)
                    return;
                const frame = wp.media({
                    title: __('Choose a choice image', 'wooptionsfic'),
                    button: { text: __('Use this image', 'wooptionsfic') },
                    library: { type: 'image' },
                    multiple: false,
                });
                frame.on('select', () => {
                    const attachment = frame.state().get('selection').first().toJSON();
                    const imageId = Math.max(0, Number(attachment.id ?? 0));
                    const imageUrl = String(attachment.sizes?.thumbnail?.url ?? attachment.sizes?.medium?.url ?? attachment.url ?? '');
                    if (!imageId)
                        return;
                    setPreviewUrl(imageUrl);
                    props.onChange({ imageId, imageUrl });
                });
                frame.open();
            };
            const hasImage = Number(props.choice.imageId ?? 0) > 0 || Boolean(previewUrl);
            return (wp.element.createElement("div", { className: "wof-media-control" },
                wp.element.createElement("button", { type: "button", className: `wof-media-control__preview ${hasImage ? 'has-image' : ''}`, onClick: openPicker }, previewUrl ? wp.element.createElement("img", { src: previewUrl, alt: "" }) : wp.element.createElement("span", { className: "dashicons dashicons-format-image", "aria-hidden": "true" })),
                wp.element.createElement("div", null,
                    wp.element.createElement("strong", null, props.required ? __('Swatch image', 'wooptionsfic') : __('Choice image (optional)', 'wooptionsfic')),
                    wp.element.createElement("small", null, props.choice.imageId ? `Media #${props.choice.imageId}` : __('No image selected', 'wooptionsfic')),
                    wp.element.createElement("div", { className: "wof-media-control__actions" },
                        wp.element.createElement(Button, { variant: "secondary", onClick: openPicker }, hasImage ? __('Replace', 'wooptionsfic') : __('Choose image', 'wooptionsfic')),
                        hasImage ? (wp.element.createElement(Button, { variant: "tertiary", isDestructive: true, onClick: () => {
                                setPreviewUrl('');
                                props.onChange({ imageId: 0, imageUrl: '' });
                            } }, __('Remove', 'wooptionsfic'))) : null))));
        }
        function ChoiceEditor(props) {
            const choices = props.field.choices ?? [];
            const updateChoice = (uuid, patch) => props.onChange({
                ...props.field,
                choices: choices.map((choice) => choice.uuid === uuid ? { ...choice, ...patch } : choice),
            });
            const removeChoice = (uuid) => props.onChange({
                ...props.field,
                choices: choices.filter((choice) => choice.uuid !== uuid),
            });
            const addChoice = () => props.onChange({
                ...props.field,
                choices: [...choices, WooOptionsFic.FieldFactory.choice(`Choice ${choices.length + 1}`, choices.length)],
            });
            if (!props.field.choices)
                return wp.element.createElement("p", { className: "wof-muted-note" }, __('This element has no choices.', 'wooptionsfic'));
            return (wp.element.createElement("div", { className: "wof-choice-editor-list" },
                props.field.type === 'image_swatch' ? wp.element.createElement("div", { className: "wof-image-swatch-behavior" },
                    wp.element.createElement(ToggleControl, { label: __('Update product image on selection', 'wooptionsfic'), help: __('Replace the main WooCommerce product image with the selected swatch image.', 'wooptionsfic'), checked: Boolean(props.field.updateProductImage), onChange: (updateProductImage) => props.onChange({ ...props.field, updateProductImage }) })) : null,
                choices.map((choice, index) => (wp.element.createElement("article", { key: choice.uuid },
                    wp.element.createElement("header", null,
                        wp.element.createElement(WooOptionsFic.Components.GripIcon, null),
                        wp.element.createElement("strong", null,
                            __('Choice', 'wooptionsfic'),
                            " ",
                            index + 1),
                        wp.element.createElement("button", { type: "button", onClick: () => removeChoice(choice.uuid) },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" }))),
                    wp.element.createElement(TextControl, { label: __('Label', 'wooptionsfic'), value: choice.label, onChange: (label) => updateChoice(choice.uuid, { label }) }),
                    wp.element.createElement(TextControl, { label: __('Description', 'wooptionsfic'), value: choice.description, onChange: (description) => updateChoice(choice.uuid, { description }) }),
                    props.field.type === 'color_swatch' ? (wp.element.createElement(ChoiceColorControl, { color: choice.color || '#5B4FF5', onChange: (color) => updateChoice(choice.uuid, { color }) })) : null,
                    ['image_swatch', 'color_swatch', 'product', 'radio', 'checkbox_group', 'segmented'].includes(props.field.type) ? (wp.element.createElement(ChoiceMediaControl, { choice: choice, required: props.field.type === 'image_swatch', onChange: (patch) => updateChoice(choice.uuid, patch) })) : null,
                    wp.element.createElement("div", { className: "wof-choice-pricing-row" },
                        wp.element.createElement(SelectControl, { label: __('Price type', 'wooptionsfic'), value: choice.pricing.strategy, options: [
                                { label: __('No adjustment', 'wooptionsfic'), value: 'none' },
                                { label: __('Fixed amount', 'wooptionsfic'), value: 'fixed' },
                                { label: __('Percentage', 'wooptionsfic'), value: 'percentage' },
                            ], onChange: (strategy) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, strategy } }) }),
                        choice.pricing.strategy === 'percentage' ? (wp.element.createElement(TextControl, { label: __('Percent', 'wooptionsfic'), type: "number", value: choice.pricing.percent, onChange: (percent) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, percent } }) })) : choice.pricing.strategy !== 'none' ? (wp.element.createElement(TextControl, { label: __('Amount', 'wooptionsfic'), type: "number", value: choice.pricing.amount, onChange: (amount) => updateChoice(choice.uuid, { pricing: { ...choice.pricing, amount } }) })) : null),
                    wp.element.createElement(ToggleControl, { label: __('Default choice', 'wooptionsfic'), checked: choice.default, onChange: (value) => updateChoice(choice.uuid, { default: value }) }),
                    wp.element.createElement(ToggleControl, { label: __('Disable choice', 'wooptionsfic'), checked: choice.disabled, onChange: (value) => updateChoice(choice.uuid, { disabled: value }) })))),
                wp.element.createElement(Button, { variant: "secondary", onClick: addChoice },
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "plus-alt2" }),
                    __('Add choice', 'wooptionsfic'))));
        }
        function PricingPanel(props) {
            const pricing = props.field.pricing ?? WooOptionsFic.FieldFactory.emptyPricing();
            const update = (patch) => props.onChange({ ...props.field, pricing: { ...pricing, ...patch } });
            return wp.element.createElement("div", null,
                wp.element.createElement(SelectControl, { label: __('Pricing strategy', 'wooptionsfic'), value: pricing.strategy, options: [{ label: __('No price change', 'wooptionsfic'), value: 'none' }, { label: __('Fixed amount', 'wooptionsfic'), value: 'fixed' }, { label: __('Percentage', 'wooptionsfic'), value: 'percentage' }, { label: __('Per character', 'wooptionsfic'), value: 'per_character' }, { label: __('Per unit', 'wooptionsfic'), value: 'per_unit' }, { label: __('Setup fee', 'wooptionsfic'), value: 'setup' }, { label: __('Formula', 'wooptionsfic'), value: 'formula' }], onChange: (strategy) => update({ strategy }) }),
                wp.element.createElement(SelectControl, { label: __('Price mode', 'wooptionsfic'), value: pricing.mode, options: [{ label: __('Add to product price', 'wooptionsfic'), value: 'adjustment' }, { label: __('Replace unit price', 'wooptionsfic'), value: 'unit_price' }], onChange: (mode) => update({ mode }) }),
                pricing.strategy === 'percentage' ? wp.element.createElement(TextControl, { label: __('Percentage', 'wooptionsfic'), type: "number", value: pricing.percent, onChange: (percent) => update({ percent }) }) : pricing.strategy === 'formula' ? wp.element.createElement(TextareaControl, { label: __('Formula expression', 'wooptionsfic'), value: pricing.expression ?? '0', onChange: (expression) => update({ expression }), help: __('Use server-supported FIELD("uuid") and arithmetic expressions.', 'wooptionsfic') }) : pricing.strategy !== 'none' ? wp.element.createElement(TextControl, { label: __('Amount', 'wooptionsfic'), type: "number", value: pricing.amount, onChange: (amount) => update({ amount }) }) : null);
        }
        function Inspector(props) {
            const scrollerRef = useRef(null);
            const [canLeft, setCanLeft] = useState(false);
            const [canRight, setCanRight] = useState(false);
            const updateScroll = () => {
                const element = scrollerRef.current;
                if (!element)
                    return;
                setCanLeft(element.scrollLeft > 4);
                setCanRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
            };
            useEffect(() => {
                updateScroll();
                window.addEventListener('resize', updateScroll);
                const element = scrollerRef.current;
                element?.addEventListener('scroll', updateScroll, { passive: true });
                return () => { window.removeEventListener('resize', updateScroll); element?.removeEventListener('scroll', updateScroll); };
            }, [props.field]);
            if (!props.field)
                return wp.element.createElement("aside", { className: "wof-builder-inspector" },
                    wp.element.createElement("div", { className: "wof-builder-pane__heading" },
                        wp.element.createElement("div", null,
                            wp.element.createElement("span", { className: "wof-eyebrow" }, __('Style', 'wooptionsfic')),
                            wp.element.createElement("h2", null, __('Option set styling', 'wooptionsfic')))),
                    wp.element.createElement("div", { className: "wof-inspector-body" },
                        wp.element.createElement("section", { className: "wof-inspector-section" },
                            wp.element.createElement(Builder.StyleStudio, { document: props.document, onChange: props.onDocumentChange }))));
            const field = props.field;
            const update = (patch) => props.onFieldChange({ ...field, ...patch });
            const visibleTabs = tabs.filter(([tab]) => tab !== 'choices' || Boolean(field.choices));
            return wp.element.createElement("aside", { className: "wof-builder-inspector" },
                wp.element.createElement("div", { className: "wof-builder-pane__heading" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("span", { className: "wof-eyebrow" }, window.WooOptionsFicAdmin.fieldTypes[field.type]?.label ?? field.type),
                        wp.element.createElement("h2", null, field.label)),
                    wp.element.createElement("div", { className: "wof-inspector-heading-actions" },
                        wp.element.createElement("button", { type: "button", onClick: props.onDuplicate },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-page" })),
                        wp.element.createElement("button", { type: "button", className: "is-destructive", onClick: props.onDelete },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" })))),
                wp.element.createElement("div", { className: "wof-inspector-tabs-shell" },
                    canLeft ? wp.element.createElement("button", { type: "button", className: "wof-inspector-tabs-arrow is-left", onClick: () => scrollerRef.current?.scrollBy({ left: -180, behavior: 'smooth' }) },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-left-alt2" })) : null,
                    wp.element.createElement("div", { className: "wof-inspector-tabs", ref: scrollerRef }, visibleTabs.map(([tab, label]) => wp.element.createElement("button", { type: "button", key: tab, className: props.tab === tab ? 'is-active' : '', onClick: (event) => { props.onTabChange(tab); event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); } }, label))),
                    canRight ? wp.element.createElement("button", { type: "button", className: "wof-inspector-tabs-arrow is-right", onClick: () => scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' }) },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-right-alt2" })) : null),
                wp.element.createElement("div", { className: "wof-inspector-body" },
                    wp.element.createElement("section", { className: "wof-inspector-section" }, props.tab === 'content' ? wp.element.createElement(wp.element.Fragment, null,
                        wp.element.createElement(TextControl, { label: __('Label', 'wooptionsfic'), value: field.label, onChange: (label) => update({ label }) }),
                        wp.element.createElement(TextareaControl, { label: __('Description', 'wooptionsfic'), value: field.description, onChange: (description) => update({ description }) }),
                        'placeholder' in field ? wp.element.createElement(TextControl, { label: __('Placeholder', 'wooptionsfic'), value: field.placeholder ?? '', onChange: (placeholder) => update({ placeholder }) }) : null,
                        field.type === 'color_picker' ? wp.element.createElement(ChoiceColorControl, { label: __('Default color', 'wooptionsfic'), color: String(field.default ?? '#5B4FF5'), onChange: (color) => update({ default: color }) }) : null,
                        wp.element.createElement(TextareaControl, { label: __('Help text', 'wooptionsfic'), value: field.help, onChange: (help) => update({ help }) }),
                        wp.element.createElement(ToggleControl, { label: __('Required', 'wooptionsfic'), checked: field.required, onChange: (required) => update({ required }) })) : props.tab === 'choices' ? wp.element.createElement(ChoiceEditor, { field: field, onChange: props.onFieldChange }) : props.tab === 'pricing' ? wp.element.createElement(PricingPanel, { field: field, onChange: props.onFieldChange }) : props.tab === 'logic' ? wp.element.createElement(Builder.LogicEditor, { field: field, allFields: props.document.fields, onChange: props.onFieldChange }) : props.tab === 'style' ? wp.element.createElement(Builder.StyleStudio, { document: props.document, onChange: props.onDocumentChange }) : wp.element.createElement(wp.element.Fragment, null,
                        wp.element.createElement(ToggleControl, { label: __('Disable this field', 'wooptionsfic'), checked: field.disabled, onChange: (disabled) => update({ disabled }) }),
                        field.type === 'file' ? wp.element.createElement(wp.element.Fragment, null,
                            wp.element.createElement(TextControl, { label: __('Allowed extensions', 'wooptionsfic'), value: (field.allowedExtensions ?? []).join(', '), onChange: (value) => update({ allowedExtensions: value.split(',').map((item) => item.trim().replace(/^\./, '')).filter(Boolean) }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum files', 'wooptionsfic'), type: "number", value: String(field.maxFiles ?? 1), onChange: (value) => update({ maxFiles: Math.max(1, Number(value)) }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum file size (MB)', 'wooptionsfic'), type: "number", value: String(field.maxFileMb ?? 5), onChange: (value) => update({ maxFileMb: Math.max(1, Number(value)) }) })) : null,
                        ['number', 'range', 'quantity', 'customer_defined_price'].includes(field.type) ? wp.element.createElement(wp.element.Fragment, null,
                            wp.element.createElement(TextControl, { label: __('Minimum', 'wooptionsfic'), value: field.min ?? '', onChange: (value) => update({ min: value || null }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum', 'wooptionsfic'), value: field.max ?? '', onChange: (value) => update({ max: value || null }) }),
                            wp.element.createElement(TextControl, { label: __('Step', 'wooptionsfic'), value: field.step ?? '', onChange: (value) => update({ step: value || null }) })) : null,
                        wp.element.createElement(TextControl, { label: __('Field UUID', 'wooptionsfic'), value: field.uuid, disabled: true })))));
        }
        Builder.Inspector = Inspector;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { Button, Modal } = wp.components;
        const { __ } = wp.i18n;
        const { useMemo, useState } = wp.element;
        function HistoryModal(props) {
            const [restoring, setRestoring] = useState(null);
            const revisions = useMemo(() => [...props.revisions].sort((left, right) => Number(right.revisionNumber) - Number(left.revisionNumber)), [props.revisions]);
            const publishedCount = revisions.filter((revision) => revision.state === 'published').length;
            const latestNumber = revisions.reduce((latest, revision) => Math.max(latest, Number(revision.revisionNumber) || 0), 0);
            const restore = async (revisionUuid) => {
                setRestoring(revisionUuid);
                try {
                    await props.onRollback(revisionUuid);
                }
                finally {
                    setRestoring(null);
                }
            };
            return (wp.element.createElement(Modal, { title: __('Version history', 'wooptionsfic'), onRequestClose: props.onClose, className: "wof-modal wof-history-modal" },
                wp.element.createElement("section", { className: "wof-version-header" },
                    wp.element.createElement("div", { className: "wof-version-header__copy" },
                        wp.element.createElement("span", { className: "wof-version-header__icon dashicons dashicons-backup", "aria-hidden": "true" }),
                        wp.element.createElement("div", null,
                            wp.element.createElement("h3", null, __('A clear record of every saved version', 'wooptionsfic')),
                            wp.element.createElement("p", null, __('Published versions stay immutable. Restoring creates a new draft, so the current live configuration remains protected.', 'wooptionsfic')))),
                    wp.element.createElement("div", { className: "wof-version-overview" },
                        wp.element.createElement("span", null,
                            wp.element.createElement("small", null, __('Versions', 'wooptionsfic')),
                            wp.element.createElement("strong", null, revisions.length)),
                        wp.element.createElement("span", null,
                            wp.element.createElement("small", null, __('Published', 'wooptionsfic')),
                            wp.element.createElement("strong", null, publishedCount)),
                        wp.element.createElement("span", null,
                            wp.element.createElement("small", null, __('Latest', 'wooptionsfic')),
                            wp.element.createElement("strong", null,
                                "#",
                                latestNumber || '—')))),
                props.busy && !revisions.length ? (wp.element.createElement(WooOptionsFic.Components.ModalLoading, { label: __('Loading version history…', 'wooptionsfic') })) : revisions.length ? (wp.element.createElement("div", { className: "wof-version-list" }, revisions.map((revision, index) => {
                    const published = revision.state === 'published';
                    const latest = index === 0;
                    return (wp.element.createElement("article", { key: revision.uuid, className: `wof-version-row ${published ? 'is-published' : 'is-draft'} ${latest ? 'is-latest' : ''}` },
                        wp.element.createElement("div", { className: "wof-version-number" },
                            wp.element.createElement("small", null, __('Version', 'wooptionsfic')),
                            wp.element.createElement("strong", null,
                                "#",
                                revision.revisionNumber)),
                        wp.element.createElement("div", { className: "wof-version-details" },
                            wp.element.createElement("div", { className: "wof-version-details__top" },
                                wp.element.createElement("div", { className: "wof-version-badges" },
                                    wp.element.createElement("span", { className: `wof-version-state is-${revision.state}` }, published ? __('Published', 'wooptionsfic') : __('Draft', 'wooptionsfic')),
                                    latest ? wp.element.createElement("span", { className: "wof-version-latest" }, __('Latest', 'wooptionsfic')) : null),
                                wp.element.createElement("time", { dateTime: revision.createdAtGmt }, WooOptionsFic.Utils.formatDate(revision.createdAtGmt))),
                            wp.element.createElement("p", null, revision.versionNote || __('No version note was added for this save.', 'wooptionsfic'))),
                        wp.element.createElement(Button, { variant: "secondary", className: "wof-version-restore", isBusy: restoring === revision.uuid, disabled: props.busy || Boolean(restoring), onClick: () => restore(revision.uuid) },
                            wp.element.createElement("span", { className: "dashicons dashicons-image-rotate", "aria-hidden": "true" }),
                            __('Restore', 'wooptionsfic'))));
                }))) : (wp.element.createElement("div", { className: "wof-history-empty" },
                    wp.element.createElement("span", { className: "dashicons dashicons-backup", "aria-hidden": "true" }),
                    wp.element.createElement("h3", null, __('No saved versions yet', 'wooptionsfic')),
                    wp.element.createElement("p", null, __('Save a draft or publish this option set to create the first version.', 'wooptionsfic'))))));
        }
        Builder.HistoryModal = HistoryModal;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { Button, Modal, SelectControl, TextControl } = wp.components;
        const { __ } = wp.i18n;
        const { useEffect, useMemo, useState } = wp.element;
        const assignmentTypes = [
            { type: 'product', label: __('Products', 'wooptionsfic'), icon: 'dashicons-products' },
            { type: 'category', label: __('Categories', 'wooptionsfic'), icon: 'dashicons-category' },
            { type: 'tag', label: __('Tags', 'wooptionsfic'), icon: 'dashicons-tag' },
            { type: 'variation', label: __('Variations', 'wooptionsfic'), icon: 'dashicons-image-rotate' },
            { type: 'global', label: __('All products', 'wooptionsfic'), icon: 'dashicons-admin-site-alt3' },
        ];
        function assignmentTypeLabel(type) {
            const labels = {
                global: __('All products', 'wooptionsfic'),
                product: __('Product', 'wooptionsfic'),
                category: __('Category', 'wooptionsfic'),
                tag: __('Tag', 'wooptionsfic'),
                variation: __('Variation', 'wooptionsfic'),
                product_type: __('Product type', 'wooptionsfic'),
            };
            return labels[type] ?? type;
        }
        function assignmentTypeIcon(type) {
            const icons = {
                global: 'dashicons-admin-site-alt3',
                product: 'dashicons-products',
                category: 'dashicons-category',
                tag: 'dashicons-tag',
                variation: 'dashicons-image-rotate',
                product_type: 'dashicons-filter',
            };
            return icons[type] ?? 'dashicons-marker';
        }
        function TargetSearch(props) {
            const [query, setQuery] = useState('');
            const [results, setResults] = useState([]);
            const [loading, setLoading] = useState(false);
            const [focused, setFocused] = useState(false);
            const [error, setError] = useState('');
            const selectedIds = useMemo(() => new Set(props.assignments
                .filter((assignment) => assignment.targetType === props.type)
                .map((assignment) => String(assignment.targetId ?? 'global'))), [props.assignments, props.type]);
            useEffect(() => {
                setQuery('');
                setResults([]);
                setError('');
            }, [props.type]);
            useEffect(() => {
                const targetType = props.type;
                if (!focused || targetType === 'global')
                    return;
                let active = true;
                const timeout = window.setTimeout(() => {
                    setLoading(true);
                    setError('');
                    WooOptionsFic.Api.searchAssignmentTargets(targetType, query)
                        .then((response) => {
                        if (active)
                            setResults(Array.isArray(response.items) ? response.items : []);
                    })
                        .catch((reason) => {
                        if (active)
                            setError(WooOptionsFic.Utils.errorMessage(reason));
                    })
                        .finally(() => {
                        if (active)
                            setLoading(false);
                    });
                }, 220);
                return () => {
                    active = false;
                    window.clearTimeout(timeout);
                };
            }, [query, props.type, focused]);
            if (props.type === 'global') {
                const selected = selectedIds.has('global');
                return (wp.element.createElement("button", { type: "button", className: `wof-assignment-global ${selected ? 'is-selected' : ''}`, disabled: selected, onClick: () => props.onAdd({
                        id: null,
                        type: 'global',
                        label: __('All WooCommerce products', 'wooptionsfic'),
                        meta: __('Every product in the store', 'wooptionsfic'),
                        image: '',
                    }) },
                    wp.element.createElement("span", { className: "dashicons dashicons-admin-site-alt3", "aria-hidden": "true" }),
                    wp.element.createElement("span", null,
                        wp.element.createElement("strong", null, __('All products', 'wooptionsfic')),
                        wp.element.createElement("small", null, selected ? __('Already assigned', 'wooptionsfic') : __('Apply this option set store-wide', 'wooptionsfic'))),
                    wp.element.createElement("span", { className: `dashicons ${selected ? 'dashicons-yes-alt' : 'dashicons-plus-alt2'}`, "aria-hidden": "true" })));
            }
            const placeholder = props.type === 'product'
                ? __('Search products by name, ID, or SKU…', 'wooptionsfic')
                : props.type === 'category'
                    ? __('Search product categories…', 'wooptionsfic')
                    : props.type === 'tag'
                        ? __('Search product tags…', 'wooptionsfic')
                        : __('Search variations by name, ID, or SKU…', 'wooptionsfic');
            return (wp.element.createElement("div", { className: "wof-target-search" },
                wp.element.createElement("div", { className: "wof-target-search__input" },
                    wp.element.createElement("span", { className: "dashicons dashicons-search", "aria-hidden": "true" }),
                    wp.element.createElement("input", { type: "search", value: query, placeholder: placeholder, onChange: (event) => setQuery(event.target.value), onFocus: () => setFocused(true), onBlur: () => window.setTimeout(() => setFocused(false), 160), "aria-label": __('Search assignment targets', 'wooptionsfic') }),
                    loading || query ? (wp.element.createElement("button", { type: "button", className: "wof-target-search__clear", onMouseDown: (event) => event.preventDefault(), onClick: () => setQuery(''), "aria-label": __('Clear search', 'wooptionsfic') }, loading ? wp.element.createElement("span", { className: "wof-mini-spinner", "aria-hidden": "true" }) : wp.element.createElement("span", { className: "dashicons dashicons-no-alt", "aria-hidden": "true" }))) : null),
                focused ? (wp.element.createElement("div", { className: "wof-target-results" },
                    error ? wp.element.createElement("p", { className: "wof-target-results__message is-error" }, error) : null,
                    !error && !loading && !results.length ? (wp.element.createElement("p", { className: "wof-target-results__message" }, query ? __('No matching items found.', 'wooptionsfic') : __('Start typing or choose from recent items.', 'wooptionsfic'))) : null,
                    results.map((target) => {
                        const selected = selectedIds.has(String(target.id));
                        return (wp.element.createElement("button", { type: "button", key: `${props.type}-${target.id}`, className: selected ? 'is-selected' : '', disabled: selected, onMouseDown: (event) => event.preventDefault(), onClick: () => props.onAdd({ ...target, type: props.type }) },
                            target.image ? wp.element.createElement("img", { src: target.image, alt: "" }) : wp.element.createElement("span", { className: `wof-target-result__icon dashicons ${assignmentTypeIcon(props.type)}`, "aria-hidden": "true" }),
                            wp.element.createElement("span", { className: "wof-target-result__copy" },
                                wp.element.createElement("strong", null, target.label),
                                wp.element.createElement("small", null, target.meta || `${assignmentTypeLabel(props.type)} #${target.id}`)),
                            wp.element.createElement("span", { className: `dashicons ${selected ? 'dashicons-yes-alt' : 'dashicons-plus-alt2'}`, "aria-hidden": "true" })));
                    }))) : null));
        }
        function AssignmentsModal(props) {
            const [type, setType] = useState('product');
            const [draft, setDraft] = useState(() => WooOptionsFic.Utils.clone(props.assignments));
            const [targetDetails, setTargetDetails] = useState({});
            const [saving, setSaving] = useState(false);
            const assignmentKey = useMemo(() => draft.map((assignment) => `${assignment.targetType}:${assignment.targetId ?? 'global'}`).sort().join('|'), [draft]);
            useEffect(() => {
                let active = true;
                const grouped = new Map();
                draft.forEach((assignment) => {
                    if (!['product', 'variation', 'category', 'tag'].includes(assignment.targetType) || assignment.targetId === null)
                        return;
                    const targetType = assignment.targetType;
                    grouped.set(targetType, [...(grouped.get(targetType) ?? []), Number(assignment.targetId)]);
                });
                Promise.all(Array.from(grouped.entries()).map(async ([targetType, ids]) => {
                    try {
                        const response = await WooOptionsFic.Api.searchAssignmentTargets(targetType, '', [...new Set(ids)]);
                        return response.items.map((item) => [`${targetType}:${item.id}`, item]);
                    }
                    catch {
                        return [];
                    }
                })).then((groups) => {
                    if (!active)
                        return;
                    const next = {};
                    groups.flat().forEach(([key, item]) => { next[key] = item; });
                    setTargetDetails(next);
                });
                return () => { active = false; };
            }, [assignmentKey]);
            const updateAssignment = (index, patch) => {
                setDraft((current) => current.map((assignment, assignmentIndex) => assignmentIndex === index ? { ...assignment, ...patch } : assignment));
            };
            const addTarget = (target) => {
                const targetId = target.type === 'global' ? null : Number(target.id);
                if (draft.some((assignment) => assignment.targetType === target.type && assignment.targetId === targetId))
                    return;
                const assignment = {
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
                            type: target.type,
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
                }
                finally {
                    setSaving(false);
                }
            };
            return (wp.element.createElement(Modal, { title: __('Product assignments', 'wooptionsfic'), onRequestClose: props.onClose, className: "wof-modal wof-assignment-modal" },
                wp.element.createElement("div", { className: "wof-assignment-hero" },
                    wp.element.createElement("span", { className: "dashicons dashicons-admin-links", "aria-hidden": "true" }),
                    wp.element.createElement("div", null,
                        wp.element.createElement("h3", null, __('Choose exactly where this option set appears', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Search and select multiple products, categories, tags, or variations. Product-specific rules take priority over broader category rules.', 'wooptionsfic')))),
                wp.element.createElement("section", { className: "wof-assignment-picker" },
                    wp.element.createElement("div", { className: "wof-assignment-type-tabs", role: "tablist" }, assignmentTypes.map((assignmentType) => (wp.element.createElement("button", { type: "button", role: "tab", key: assignmentType.type, "aria-selected": type === assignmentType.type, className: type === assignmentType.type ? 'is-active' : '', onClick: () => setType(assignmentType.type) },
                        wp.element.createElement("span", { className: `dashicons ${assignmentType.icon}`, "aria-hidden": "true" }),
                        assignmentType.label)))),
                    wp.element.createElement(TargetSearch, { type: type, assignments: draft, onAdd: addTarget })),
                wp.element.createElement("div", { className: "wof-assignment-section-head" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("h3", null, __('Assigned targets', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Adjust inclusion mode or priority for each selected target.', 'wooptionsfic'))),
                    wp.element.createElement("span", null,
                        draft.length,
                        " ",
                        draft.length === 1 ? __('rule', 'wooptionsfic') : __('rules', 'wooptionsfic'))),
                draft.length ? (wp.element.createElement("div", { className: "wof-assignment-cards" }, draft.map((assignment, index) => {
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
                    return (wp.element.createElement("article", { className: "wof-assignment-card", key: assignment.uuid || key },
                        wp.element.createElement("div", { className: "wof-assignment-card__visual" }, image ? wp.element.createElement("img", { src: image, alt: "" }) : wp.element.createElement("span", { className: `dashicons ${assignmentTypeIcon(assignment.targetType)}`, "aria-hidden": "true" })),
                        wp.element.createElement("div", { className: "wof-assignment-card__identity" },
                            wp.element.createElement("div", null,
                                wp.element.createElement("strong", null, label),
                                wp.element.createElement("span", null, assignmentTypeLabel(assignment.targetType))),
                            wp.element.createElement("small", null, meta)),
                        wp.element.createElement(SelectControl, { label: __('Mode', 'wooptionsfic'), value: assignment.mode, options: [
                                { label: __('Include', 'wooptionsfic'), value: 'include' },
                                { label: __('Exclude', 'wooptionsfic'), value: 'exclude' },
                            ], onChange: (mode) => updateAssignment(index, { mode }) }),
                        wp.element.createElement(TextControl, { type: "number", label: __('Priority', 'wooptionsfic'), value: String(assignment.priority), min: -1000, max: 1000, onChange: (priority) => updateAssignment(index, { priority: Number(priority) }) }),
                        wp.element.createElement("button", { type: "button", className: "wof-assignment-card__remove", onClick: () => setDraft((current) => current.filter((candidate) => candidate !== assignment)), "aria-label": __('Remove assignment', 'wooptionsfic') },
                            wp.element.createElement("span", { className: "dashicons dashicons-trash", "aria-hidden": "true" }))));
                }))) : (wp.element.createElement("div", { className: "wof-assignment-empty" },
                    wp.element.createElement("span", { className: "dashicons dashicons-admin-links", "aria-hidden": "true" }),
                    wp.element.createElement("h3", null, __('No products assigned yet', 'wooptionsfic')),
                    wp.element.createElement("p", null, __('Use the search above to select one or more targets.', 'wooptionsfic')))),
                wp.element.createElement("div", { className: "wof-modal__actions wof-assignment-actions" },
                    wp.element.createElement(Button, { variant: "tertiary", onClick: props.onClose }, __('Cancel', 'wooptionsfic')),
                    wp.element.createElement(Button, { variant: "primary", isBusy: saving || props.busy, onClick: save },
                        wp.element.createElement("span", { className: "dashicons dashicons-saved", "aria-hidden": "true" }),
                        __('Save assignments', 'wooptionsfic')))));
        }
        Builder.AssignmentsModal = AssignmentsModal;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Builder;
    (function (Builder) {
        const { Button, TextControl } = wp.components;
        const { __ } = wp.i18n;
        const { useCallback, useEffect, useRef, useState } = wp.element;
        const statusLabels = {
            idle: __('Ready', 'wooptionsfic'),
            dirty: __('Unsaved changes', 'wooptionsfic'),
            saving: __('Saving…', 'wooptionsfic'),
            saved: __('All changes saved', 'wooptionsfic'),
            error: __('Save failed', 'wooptionsfic'),
            conflict: __('Editing conflict', 'wooptionsfic'),
        };
        function BuilderPage(props) {
            const state = wp.data.useSelect((select) => select(WooOptionsFic.BuilderStore.STORE_KEY).getState(), []);
            const actions = wp.data.useDispatch(WooOptionsFic.BuilderStore.STORE_KEY);
            const [loading, setLoading] = useState(true);
            const [fatal, setFatal] = useState('');
            const [notice, setNotice] = useState('');
            const [historyOpen, setHistoryOpen] = useState(false);
            const [assignmentOpen, setAssignmentOpen] = useState(false);
            const [revisions, setRevisions] = useState([]);
            const [assignments, setAssignments] = useState([]);
            const [modalBusy, setModalBusy] = useState(false);
            const [deleteUuid, setDeleteUuid] = useState(null);
            const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
            const savePromise = useRef(null);
            useEffect(() => {
                let active = true;
                setLoading(true);
                WooOptionsFic.Api.getOptionSet(props.uuid)
                    .then((optionSet) => active && actions.loadSet(optionSet))
                    .catch((reason) => active && setFatal(WooOptionsFic.Utils.errorMessage(reason)))
                    .finally(() => active && setLoading(false));
                return () => { active = false; };
            }, [props.uuid]);
            const saveNow = useCallback(async (note = 'Builder autosave') => {
                if (savePromise.current)
                    return savePromise.current;
                if (!state.optionSet || !state.document)
                    throw new Error(__('The builder is not ready.', 'wooptionsfic'));
                actions.setSaveStatus('saving');
                const expectedHash = state.optionSet.currentRevision?.contentHash ?? '';
                savePromise.current = WooOptionsFic.Api.saveRevision(state.optionSet.uuid, state.document, expectedHash, note);
                try {
                    const result = await savePromise.current;
                    actions.saved(result, result.currentRevision?.definition ?? state.document);
                    return result;
                }
                catch (reason) {
                    actions.setSaveStatus(reason?.code === 'wooptionsfic_revision_conflict' ? 'conflict' : 'error');
                    setNotice(WooOptionsFic.Utils.errorMessage(reason));
                    throw reason;
                }
                finally {
                    savePromise.current = null;
                }
            }, [state.optionSet, state.document]);
            useEffect(() => {
                if (!state.dirty || !state.document || !state.optionSet)
                    return;
                const timeout = window.setTimeout(() => { saveNow().catch(() => undefined); }, 1600);
                return () => window.clearTimeout(timeout);
            }, [state.dirty, state.document, state.optionSet, saveNow]);
            useEffect(() => {
                if (!state.document || !state.optionSet)
                    return;
                const timeout = window.setTimeout(() => {
                    WooOptionsFic.Api.validateDefinition(state.optionSet.uuid, state.document)
                        .then((result) => actions.setValidation(result.errors, result.warnings))
                        .catch(() => undefined);
                }, 500);
                return () => window.clearTimeout(timeout);
            }, [state.document, state.optionSet]);
            const publish = async () => {
                if (!state.optionSet || !state.document || state.errors.length) {
                    setDiagnosticsOpen(true);
                    return;
                }
                setNotice('');
                try {
                    const saved = state.dirty ? await saveNow('Pre-publish save') : state.optionSet;
                    actions.setSaveStatus('saving');
                    const result = await WooOptionsFic.Api.publishOptionSet(saved.uuid, saved.currentRevision?.contentHash ?? '');
                    actions.saved(result, result.currentRevision?.definition ?? state.document);
                    setNotice(__('Published. This live revision is now immutable.', 'wooptionsfic'));
                }
                catch (reason) {
                    setNotice(WooOptionsFic.Utils.errorMessage(reason));
                }
            };
            const openHistory = async () => {
                if (!state.optionSet)
                    return;
                setHistoryOpen(true);
                setModalBusy(true);
                try {
                    setRevisions(await WooOptionsFic.Api.listRevisions(state.optionSet.uuid));
                }
                finally {
                    setModalBusy(false);
                }
            };
            const openAssignments = async () => {
                if (!state.optionSet)
                    return;
                setAssignmentOpen(true);
                setModalBusy(true);
                try {
                    setAssignments((await WooOptionsFic.Api.getAssignments(state.optionSet.uuid)).items);
                }
                finally {
                    setModalBusy(false);
                }
            };
            if (loading)
                return wp.element.createElement(WooOptionsFic.Components.Loading, { label: __('Opening the Precision Workshop…', 'wooptionsfic') });
            if (fatal || !state.optionSet || !state.document)
                return wp.element.createElement("div", { className: "wof-fatal" },
                    wp.element.createElement("h1", null, __('This option set could not be opened', 'wooptionsfic')),
                    wp.element.createElement("p", null, fatal),
                    wp.element.createElement(Button, { variant: "primary", onClick: () => props.navigate('option-sets') }, __('Back to option sets', 'wooptionsfic')));
            const selectedField = WooOptionsFic.Utils.fieldByUuid(state.document, state.selectedUuid);
            const addField = (field, index) => { actions.addField(field, index); actions.selectField(field.uuid); actions.setInspectorTab('content'); };
            const duplicateSelected = () => selectedField && addField(WooOptionsFic.FieldFactory.duplicate(selectedField));
            return wp.element.createElement("div", { className: "wof-builder" },
                wp.element.createElement("header", { className: "wof-builder-topbar" },
                    wp.element.createElement("div", { className: "wof-builder-context" },
                        wp.element.createElement("button", { type: "button", className: "wof-builder-brand", onClick: () => props.navigate('dashboard') },
                            wp.element.createElement("span", { className: "wof-builder-brand-mark" },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "screenoptions" })),
                            wp.element.createElement("strong", null, "WooOptionsFic")),
                        wp.element.createElement("span", { className: "wof-builder-divider" }),
                        wp.element.createElement("button", { type: "button", className: "wof-builder-back", onClick: () => props.navigate('option-sets') },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-left-alt2" })),
                        wp.element.createElement("div", { className: "wof-builder-breadcrumb" },
                            wp.element.createElement("button", { type: "button", onClick: () => props.navigate('option-sets') }, __('Option Sets', 'wooptionsfic')),
                            wp.element.createElement("span", null, "/"),
                            wp.element.createElement("div", { className: "wof-builder-title-editor" },
                                wp.element.createElement(TextControl, { label: __('Option set title', 'wooptionsfic'), hideLabelFromVision: true, value: state.document.title, onChange: (title) => actions.updateDocument({ title }) }),
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "edit" })),
                            wp.element.createElement("span", { className: `wof-save-state is-${state.saveStatus}` },
                                wp.element.createElement("i", null),
                                statusLabels[state.saveStatus]))),
                    wp.element.createElement("div", { className: "wof-builder-tools" },
                        wp.element.createElement("div", { className: "wof-tool-group wof-history-tools" },
                            wp.element.createElement("button", { type: "button", disabled: !state.history.length, onClick: actions.undo },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "undo" })),
                            wp.element.createElement("button", { type: "button", disabled: !state.future.length, onClick: actions.redo },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "redo" }))),
                        wp.element.createElement("div", { className: "wof-tool-group wof-device-switcher" }, ['desktop', 'tablet', 'mobile'].map((device) => wp.element.createElement("button", { type: "button", key: device, className: state.device === device ? 'is-active' : '', onClick: () => actions.setDevice(device) },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: device === 'desktop' ? 'desktop' : device === 'tablet' ? 'tablet' : 'smartphone' })))),
                        wp.element.createElement(Button, { variant: "tertiary", className: "wof-header-action", onClick: openHistory },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "backup" }),
                            __('Version history', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "tertiary", className: "wof-header-action", onClick: openAssignments },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-links" }),
                            __('Assignments', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "secondary", isBusy: state.saveStatus === 'saving', onClick: () => saveNow('Manual save').catch(() => undefined) }, __('Save draft', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", disabled: state.errors.length > 0, onClick: publish }, __('Publish', 'wooptionsfic')))),
                notice ? wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-builder-notice', state.saveStatus === 'error' || state.saveStatus === 'conflict' ? 'is-error' : 'is-success') },
                    wp.element.createElement("span", null, notice),
                    wp.element.createElement("button", { type: "button", onClick: () => setNotice('') }, "\u00D7")) : null,
                wp.element.createElement("div", { className: "wof-builder-workspace" },
                    wp.element.createElement(Builder.ElementsPanel, { onAdd: addField, onOpenStyle: () => { actions.selectField(null); actions.setInspectorTab('style'); } }),
                    wp.element.createElement(Builder.Canvas, { document: state.document, selectedUuid: state.selectedUuid, device: state.device, onSelect: (uuid) => { actions.selectField(uuid); actions.setInspectorTab('content'); }, onAdd: addField, onMove: actions.moveField, onDuplicate: (field) => addField(WooOptionsFic.FieldFactory.duplicate(field)), onDelete: setDeleteUuid }),
                    wp.element.createElement(Builder.Inspector, { field: selectedField, document: state.document, tab: state.inspectorTab, onTabChange: actions.setInspectorTab, onFieldChange: (field) => actions.replaceField(field.uuid, field), onDocumentChange: actions.updateDocument, onDuplicate: duplicateSelected, onDelete: () => selectedField && setDeleteUuid(selectedField.uuid) })),
                wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-diagnostics-drawer', diagnosticsOpen && 'is-open') },
                    wp.element.createElement("button", { type: "button", className: "wof-diagnostics-toggle", onClick: () => setDiagnosticsOpen(!diagnosticsOpen) },
                        wp.element.createElement("span", { className: state.errors.length ? 'is-error' : 'is-good' }, state.errors.length ? '!' : '✓'),
                        wp.element.createElement("strong", null, __('Preflight diagnostics', 'wooptionsfic')),
                        wp.element.createElement("small", null,
                            state.errors.length ? `${state.errors.length} ${__('errors', 'wooptionsfic')}` : __('Ready to publish', 'wooptionsfic'),
                            state.warnings.length ? ` · ${state.warnings.length} ${__('warnings', 'wooptionsfic')}` : ''),
                        wp.element.createElement("b", null, diagnosticsOpen ? '⌄' : '⌃')),
                    diagnosticsOpen ? wp.element.createElement("div", { className: "wof-diagnostics-content" },
                        wp.element.createElement("div", null,
                            wp.element.createElement("h3", null, __('Errors', 'wooptionsfic')),
                            state.errors.length ? wp.element.createElement("ul", null, state.errors.map((issue, index) => wp.element.createElement("li", { key: `${issue.code}-${index}` },
                                wp.element.createElement("span", null, "!"),
                                wp.element.createElement("code", null, issue.code),
                                wp.element.createElement("small", null, issue.path ?? issue.fieldUuid ?? '')))) : wp.element.createElement("p", null,
                                "\u2713 ",
                                __('No blocking errors.', 'wooptionsfic'))),
                        wp.element.createElement("div", null,
                            wp.element.createElement("h3", null, __('Warnings', 'wooptionsfic')),
                            state.warnings.length ? wp.element.createElement("ul", null, state.warnings.map((issue, index) => wp.element.createElement("li", { key: `${issue.code}-${index}` },
                                wp.element.createElement("span", null, "\u2022"),
                                wp.element.createElement("code", null, issue.code),
                                wp.element.createElement("small", null, issue.path ?? issue.fieldUuid ?? '')))) : wp.element.createElement("p", null,
                                "\u2713 ",
                                __('No warnings.', 'wooptionsfic'))),
                        wp.element.createElement("div", { className: "wof-config-size" },
                            wp.element.createElement("h3", null, __('Configuration size', 'wooptionsfic')),
                            wp.element.createElement("strong", null,
                                new Blob([JSON.stringify(state.document)]).size.toLocaleString(),
                                " B"),
                            wp.element.createElement("small", null,
                                state.document.fields.length,
                                " ",
                                __('top-level fields', 'wooptionsfic')))) : null),
                historyOpen ? wp.element.createElement(Builder.HistoryModal, { revisions: revisions, busy: modalBusy, onClose: () => setHistoryOpen(false), onRollback: async (revisionUuid) => { setModalBusy(true); try {
                        const result = await WooOptionsFic.Api.rollback(state.optionSet.uuid, revisionUuid);
                        actions.loadSet(result);
                        setHistoryOpen(false);
                        setNotice(__('A new draft was created from that revision.', 'wooptionsfic'));
                    }
                    finally {
                        setModalBusy(false);
                    } } }) : null,
                assignmentOpen ? wp.element.createElement(Builder.AssignmentsModal, { assignments: assignments, busy: modalBusy, onClose: () => setAssignmentOpen(false), onSave: async (nextAssignments) => { setModalBusy(true); try {
                        const response = await WooOptionsFic.Api.saveAssignments(state.optionSet.uuid, nextAssignments);
                        setAssignments(response.items);
                        setAssignmentOpen(false);
                        setNotice(__('Product assignments saved.', 'wooptionsfic'));
                    }
                    finally {
                        setModalBusy(false);
                    } } }) : null,
                deleteUuid ? wp.element.createElement(WooOptionsFic.Components.ConfirmModal, { title: __('Delete field?', 'wooptionsfic'), message: __('Delete this field and its configuration? This can be undone until you leave the builder.', 'wooptionsfic'), confirmLabel: __('Delete field', 'wooptionsfic'), destructive: true, onCancel: () => setDeleteUuid(null), onConfirm: () => { actions.deleteField(deleteUuid); setDeleteUuid(null); } }) : null);
        }
        Builder.BuilderPage = BuilderPage;
    })(Builder = WooOptionsFic.Builder || (WooOptionsFic.Builder = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    const { useEffect, useState } = wp.element;
    const { __ } = wp.i18n;
    function routeFromLocation() {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        return hash || window.WooOptionsFicAdmin.initialRoute || 'dashboard';
    }
    function App() {
        const [route, setRoute] = useState(routeFromLocation());
        useEffect(() => {
            const update = () => setRoute(routeFromLocation());
            window.addEventListener('hashchange', update);
            return () => window.removeEventListener('hashchange', update);
        }, []);
        const navigate = (nextRoute) => {
            const nextHash = `#/${nextRoute}`;
            if (window.location.hash === nextHash)
                setRoute(nextRoute);
            else
                window.location.hash = nextHash;
        };
        let page;
        if (route.startsWith('builder/')) {
            page = wp.element.createElement(WooOptionsFic.Builder.BuilderPage, { uuid: route.slice('builder/'.length), navigate: navigate });
        }
        else {
            switch (route) {
                case 'dashboard':
                    page = wp.element.createElement(WooOptionsFic.Pages.Dashboard, { navigate: navigate });
                    break;
                case 'option-sets':
                    page = wp.element.createElement(WooOptionsFic.Pages.OptionSets, { navigate: navigate });
                    break;
                case 'templates':
                    page = wp.element.createElement(WooOptionsFic.Pages.Templates, { navigate: navigate });
                    break;
                case 'analytics':
                    page = wp.element.createElement(WooOptionsFic.Pages.Analytics, null);
                    break;
                case 'integrations':
                    page = wp.element.createElement(WooOptionsFic.Pages.Integrations, null);
                    break;
                case 'diagnostics':
                    page = wp.element.createElement(WooOptionsFic.Pages.Diagnostics, null);
                    break;
                case 'settings':
                    page = wp.element.createElement(WooOptionsFic.Pages.Settings, null);
                    break;
                case 'help':
                    page = wp.element.createElement(WooOptionsFic.Pages.Help, { navigate: navigate });
                    break;
                default: page = wp.element.createElement("div", { className: "wof-fatal" },
                    wp.element.createElement("h1", null, __('Page not found', 'wooptionsfic')),
                    wp.element.createElement("p", null, __('This WooOptionsFic route does not exist.', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", onClick: () => navigate('dashboard') }, __('Open dashboard', 'wooptionsfic')));
            }
        }
        return wp.element.createElement(WooOptionsFic.Components.AdminShell, { route: route, navigate: navigate }, page);
    }
    WooOptionsFic.App = App;
})(WooOptionsFic || (WooOptionsFic = {}));
(() => {
    const rootElement = document.getElementById('wooptionsfic-admin-root');
    if (!rootElement)
        return;
    try {
        wp.element.createRoot(rootElement).render(wp.element.createElement(WooOptionsFic.App, null));
    }
    catch (error) {
        window.console.error('WooOptionsFic admin failed to initialize.', error);
        rootElement.innerHTML = '<div class="wof-fatal"><h1>The workshop hit a snag</h1><p>Your saved configuration is safe. Reload the page to restart the builder.</p><button type="button" onclick="window.location.reload()">Reload WooOptionsFic</button></div>';
    }
})();
//# sourceMappingURL=admin.js.map