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
        function compactNumber(value) {
            const number = Number(value || 0);
            if (number < 1000)
                return String(number);
            return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(number);
        }
        Utils.compactNumber = compactNumber;
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
                data: { expectedHash, versionNote: 'Published from the builder' },
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
        function previewImport(payload) {
            return request('/imports/preview', { method: 'POST', data: payload });
        }
        Api.previewImport = previewImport;
        function commitImport(payload, title) {
            return request('/imports/commit', { method: 'POST', data: { ...payload, title } });
        }
        Api.commitImport = commitImport;
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
                helpTextPosition: 'below_title',
                width: '100%',
            };
            if (choiceTypes.has(type)) {
                field.choices = [choice('Choice 1', 0), choice('Choice 2', 1), choice('Choice 3', 2)];
                field.multiple = Boolean(manifest?.multiple);
                field.minChoices = 0;
                field.maxChoices = 0;
                field.choiceWidth = '';
                field.choiceHeight = '';
                field.choiceBorderRadius = '';
                field.enableQuantity = false;
                field.minQuantity = 1;
                field.maxQuantity = 100;
                if (type === 'image_swatch')
                    field.updateProductImage = false;
                if (['radio', 'checkbox_group', 'select'].includes(type)) {
                    field.columns = 'one';
                    field.imageStyle = 'normal';
                }
                if (type === 'checkbox_group') {
                    field.choices.forEach((c) => {
                        c.default = false;
                    });
                }
            }
            if (type === 'tel') {
                field.flagStyle = 'number_only';
                field.defaultCountry = 'US';
            }
            if (type === 'datetime' || type === 'date' || type === 'time') {
                field.dateTimeType = type === 'time' ? 'time' : 'date';
                field.dateFormat = 'DD/MM/YYYY';
                field.minDateType = 'none';
                field.minDateCustom = '';
                field.maxDateType = 'none';
                field.maxDateCustom = '';
                field.disableToday = false;
                field.disableNextNDays = 0;
                field.disabledDates = [];
                field.disabledWeekdays = [];
                field.disabledMonthlyDays = '';
                field.minTime = '12:00 AM';
                field.maxTime = '12:00 PM';
                field.timeFormat = '12';
            }
            if (type === 'date_range') {
                field.dateFormat = 'DD/MM/YYYY';
                field.minDateType = 'none';
                field.minDateCustom = '';
                field.maxDateType = 'none';
                field.maxDateCustom = '';
                field.disableToday = false;
                field.disableNextNDays = 0;
                field.disabledDates = [];
                field.disabledWeekdays = [];
                field.disabledMonthlyDays = '';
                field.minDays = 0;
                field.maxDays = 0;
                field.allowSameDay = true;
            }
            if (['text', 'textarea', 'password', 'tel', 'email', 'url', 'number', 'range', 'quantity', 'date', 'date_range', 'time', 'datetime', 'customer_defined_price', 'color_picker'].includes(type)) {
                field.placeholder = '';
                field.min = null;
                field.max = null;
                field.step = ['number', 'range', 'customer_defined_price'].includes(type) ? '1' : null;
                field.maxLength = 0;
            }
            if (type === 'text' || type === 'textarea') {
                field.minLength = 0;
                field.maxLength = 0;
                field.textTransform = 'none';
                if (type === 'textarea') {
                    field.rows = 4;
                }
            }
            if (type === 'number') {
                field.enableMinMax = true;
                field.min = '1';
                field.max = '100';
                field.step = '1';
                field.default = '';
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
            return (wp.element.createElement(Modal, { title: props.title, onRequestClose: () => !props.busy && props.onCancel(), className: WooOptionsFic.Utils.classNames('wof-modal', 'wof-confirm-modal', props.destructive && 'is-destructive') },
                wp.element.createElement("div", { className: "wof-confirm-modal__header-custom" },
                    wp.element.createElement("h3", { className: "wof-confirm-modal__title-custom" }, props.title),
                    wp.element.createElement("button", { type: "button", className: "wof-confirm-modal__close-custom", onClick: props.onCancel, "aria-label": __('Close', 'wooptionsfic') }, "\u2715")),
                wp.element.createElement("div", { className: "wof-confirm-modal__body" },
                    props.destructive ? (wp.element.createElement("div", { className: "wof-confirm-modal__icon-badge" },
                        wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("polyline", { points: "3 6 5 6 21 6" }),
                            wp.element.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
                            wp.element.createElement("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
                            wp.element.createElement("line", { x1: "14", y1: "11", x2: "14", y2: "17" })))) : null,
                    wp.element.createElement("div", { className: "wof-confirm-modal__text" },
                        wp.element.createElement("p", { className: "wof-confirm-modal__message" }, props.message))),
                wp.element.createElement("div", { className: "wof-modal__actions wof-confirm-modal__actions" },
                    wp.element.createElement("button", { type: "button", className: "wof-btn-modal-cancel", disabled: props.busy, onClick: props.onCancel }, props.cancelLabel ?? __('Cancel', 'wooptionsfic')),
                    wp.element.createElement("button", { type: "button", className: WooOptionsFic.Utils.classNames('wof-btn-modal-confirm', props.destructive && 'is-destructive'), disabled: props.busy, onClick: props.onConfirm }, props.busy ? (wp.element.createElement("span", { className: "wof-btn-busy-spinner" },
                        wp.element.createElement(Spinner, null),
                        wp.element.createElement("span", null, __('Deleting…', 'wooptionsfic')))) : (props.confirmLabel)))));
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
    var Toast;
    (function (Toast) {
        let items = [];
        const listeners = new Set();
        function notify() {
            listeners.forEach((fn) => fn([...items]));
        }
        function subscribe(listener) {
            listeners.add(listener);
            listener([...items]);
            return () => {
                listeners.delete(listener);
            };
        }
        Toast.subscribe = subscribe;
        function dismiss(id) {
            const existing = items.find((t) => t.id === id);
            if (!existing || existing.isHiding)
                return;
            items = items.map((t) => (t.id === id ? { ...t, isHiding: true } : t));
            notify();
            setTimeout(() => {
                items = items.filter((t) => t.id !== id);
                notify();
            }, 220);
        }
        Toast.dismiss = dismiss;
        function show(options) {
            const id = 'toast_' + Math.random().toString(36).slice(2, 9);
            const item = {
                id,
                type: options.type ?? 'info',
                title: options.title,
                message: options.message,
                duration: options.duration ?? 4000,
            };
            if (items.length >= 3) {
                items = items.slice(items.length - 2);
            }
            items = [...items, item];
            notify();
            return id;
        }
        Toast.show = show;
        function success(message, title, duration) {
            return show({ type: 'success', message, title, duration });
        }
        Toast.success = success;
        function error(message, title, duration) {
            return show({ type: 'error', message, title: title ?? 'Error', duration: duration ?? 5000 });
        }
        Toast.error = error;
        function warning(message, title, duration) {
            return show({ type: 'warning', message, title: title ?? 'Attention', duration });
        }
        Toast.warning = warning;
        function info(message, title, duration) {
            return show({ type: 'info', message, title, duration });
        }
        Toast.info = info;
    })(Toast = WooOptionsFic.Toast || (WooOptionsFic.Toast = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
(function (WooOptionsFic) {
    var Components;
    (function (Components) {
        const { useEffect, useRef, useState } = wp.element;
        function ToastContainer() {
            const [toasts, setToasts] = useState([]);
            useEffect(() => {
                return WooOptionsFic.Toast.subscribe(setToasts);
            }, []);
            if (!toasts.length)
                return null;
            return (wp.element.createElement("div", { className: "wof-toast-container", role: "region", "aria-label": "Notifications" }, toasts.map((toast) => (wp.element.createElement(ToastCard, { key: toast.id, toast: toast, onDismiss: () => WooOptionsFic.Toast.dismiss(toast.id) })))));
        }
        Components.ToastContainer = ToastContainer;
        function ToastCard(props) {
            const { toast, onDismiss } = props;
            const duration = toast.duration ?? 4000;
            const remainingRef = useRef(duration);
            const startTimeRef = useRef(Date.now());
            const timerRef = useRef(null);
            const startTimer = () => {
                if (remainingRef.current > 0 && !toast.isHiding) {
                    startTimeRef.current = Date.now();
                    timerRef.current = window.setTimeout(onDismiss, remainingRef.current);
                }
            };
            const pauseTimer = () => {
                if (timerRef.current) {
                    window.clearTimeout(timerRef.current);
                    timerRef.current = null;
                    remainingRef.current -= (Date.now() - startTimeRef.current);
                    if (remainingRef.current < 500)
                        remainingRef.current = 500;
                }
            };
            useEffect(() => {
                startTimer();
                return () => {
                    if (timerRef.current)
                        window.clearTimeout(timerRef.current);
                };
            }, [toast.id, toast.isHiding]);
            return (wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-toast', `wof-toast--${toast.type}`, toast.isHiding && 'is-hiding'), role: toast.type === 'error' ? 'alert' : 'status', "aria-live": "polite", onMouseEnter: pauseTimer, onMouseLeave: startTimer },
                wp.element.createElement("span", { className: "wof-toast__icon", "aria-hidden": "true" }, toast.type === 'success' ? (wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    wp.element.createElement("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
                    wp.element.createElement("polyline", { points: "22 4 12 14.01 9 11.01" }))) : toast.type === 'error' ? (wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                    wp.element.createElement("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
                    wp.element.createElement("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }))) : toast.type === 'warning' ? (wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    wp.element.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
                    wp.element.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
                    wp.element.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" }))) : (wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                    wp.element.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
                    wp.element.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })))),
                wp.element.createElement("div", { className: "wof-toast__content" },
                    toast.title ? wp.element.createElement("div", { className: "wof-toast__title" }, toast.title) : null,
                    wp.element.createElement("div", { className: "wof-toast__message" }, toast.message)),
                wp.element.createElement("button", { type: "button", className: "wof-toast__close", "aria-label": "Close notification", onClick: onDismiss },
                    wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
                        wp.element.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        wp.element.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }))),
                wp.element.createElement("div", { className: "wof-toast__progress", "aria-hidden": "true" },
                    wp.element.createElement("div", { className: "wof-toast__progress-bar", style: { animationDuration: `${duration}ms` } }))));
        }
    })(Components = WooOptionsFic.Components || (WooOptionsFic.Components = {}));
})(WooOptionsFic || (WooOptionsFic = {}));
var WooOptionsFic;
(function (WooOptionsFic) {
    var Components;
    (function (Components) {
        const { __ } = wp.i18n;
        function AdminShell(props) {
            const isBuilder = props.route.startsWith('builder/');
            const isTemplateStudio = props.route === 'templates';
            if (isBuilder || isTemplateStudio) {
                return (wp.element.createElement("div", { className: isBuilder ? "wof-admin is-builder" : "wof-admin is-template-studio" },
                    wp.element.createElement("main", { className: "wof-admin__content" }, props.children),
                    wp.element.createElement(Components.ToastContainer, null)));
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
                    wp.element.createElement("main", { className: "wof-admin__content" }, props.children)),
                wp.element.createElement(Components.ToastContainer, null)));
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
        const { __, sprintf } = wp.i18n;
        const { useEffect, useMemo, useRef, useState } = wp.element;
        const { Button } = wp.components;
        const { Dashicon } = WooOptionsFic.Components;
        function renderFooterIcon(type, itemSlug) {
            switch (type) {
                case 'image':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Image options', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
                            wp.element.createElement("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                            wp.element.createElement("polyline", { points: "21 15 16 10 5 21" }))));
                case 'list':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('List choices', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("line", { x1: "8", y1: "6", x2: "21", y2: "6" }),
                            wp.element.createElement("line", { x1: "8", y1: "12", x2: "21", y2: "12" }),
                            wp.element.createElement("line", { x1: "8", y1: "18", x2: "21", y2: "18" }),
                            wp.element.createElement("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }),
                            wp.element.createElement("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }),
                            wp.element.createElement("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" }))));
                case 'price':
                case 'price3':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon is-glyph-price", title: __('Dynamic pricing', 'wooptionsfic') }, itemSlug === 'donation' ? '$' : '$$$'));
                case 'text':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Text personalization', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("polyline", { points: "4 7 4 4 20 4 20 7" }),
                            wp.element.createElement("line", { x1: "9", y1: "20", x2: "15", y2: "20" }),
                            wp.element.createElement("line", { x1: "12", y1: "4", x2: "12", y2: "20" }))));
                case 'swatch':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Color choices', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                            wp.element.createElement("circle", { cx: "12", cy: "12", r: "4" }),
                            wp.element.createElement("line", { x1: "4.93", y1: "4.93", x2: "9.17", y2: "9.17" }),
                            wp.element.createElement("line", { x1: "14.83", y1: "14.83", x2: "19.07", y2: "19.07" }),
                            wp.element.createElement("line", { x1: "14.83", y1: "9.17", x2: "19.07", y2: "4.93" }),
                            wp.element.createElement("line", { x1: "4.93", y1: "19.07", x2: "9.17", y2: "14.83" }))));
                case 'package':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Product bundles', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
                            wp.element.createElement("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
                            wp.element.createElement("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }))));
                case 'ruler':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Measurement', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M21.3 8.7 8.7 21.3c-.4.4-1 .4-1.4 0l-6-6c-.4-.4-.4-1 0-1.4L13.9 1.3c.4-.4 1-.4 1.4 0l6 6c.4.4.4 1 0 1.4z" }),
                            wp.element.createElement("path", { d: "m14.5 4.5 1.5 1.5" }),
                            wp.element.createElement("path", { d: "m11.5 7.5 1.5 1.5" }),
                            wp.element.createElement("path", { d: "m8.5 10.5 1.5 1.5" }),
                            wp.element.createElement("path", { d: "m5.5 13.5 1.5 1.5" }))));
                case 'chip':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Components builder', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }),
                            wp.element.createElement("rect", { x: "9", y: "9", width: "6", height: "6" }),
                            wp.element.createElement("line", { x1: "9", y1: "1", x2: "9", y2: "4" }),
                            wp.element.createElement("line", { x1: "15", y1: "1", x2: "15", y2: "4" }),
                            wp.element.createElement("line", { x1: "9", y1: "20", x2: "9", y2: "23" }),
                            wp.element.createElement("line", { x1: "15", y1: "20", x2: "15", y2: "23" }),
                            wp.element.createElement("line", { x1: "20", y1: "9", x2: "23", y2: "9" }),
                            wp.element.createElement("line", { x1: "20", y1: "15", x2: "23", y2: "15" }),
                            wp.element.createElement("line", { x1: "1", y1: "9", x2: "4", y2: "9" }),
                            wp.element.createElement("line", { x1: "1", y1: "15", x2: "4", y2: "15" }))));
                case 'users':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Team members', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
                            wp.element.createElement("circle", { cx: "9", cy: "7", r: "4" }),
                            wp.element.createElement("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
                            wp.element.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }))));
                case 'calendar':
                    return (wp.element.createElement("span", { key: type, className: "wof-footer-icon", title: __('Rental dates', 'wooptionsfic') },
                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                            wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                            wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                            wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" }))));
                default:
                    return wp.element.createElement("span", { key: type, className: "wof-footer-icon" },
                        wp.element.createElement(Dashicon, { name: "screenoptions" }));
            }
        }
        function TemplateCard(props) {
            const { item, selected, busy, onSelect, onPreview, onUse } = props;
            const isAdvanced = (item.level ?? '').toLowerCase() === 'advanced';
            const footerIcons = item.footerIcons?.length ? item.footerIcons : ['image', 'list', 'price'];
            return (wp.element.createElement("article", { className: WooOptionsFic.Utils.classNames('wof-new-template-card', selected && 'is-selected'), onClick: onSelect },
                selected ? (wp.element.createElement("span", { className: "wof-template-card__selected-check", "aria-label": __('Selected', 'wooptionsfic') },
                    wp.element.createElement("svg", { width: "12", height: "10", viewBox: "0 0 12 10", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
                        wp.element.createElement("path", { d: "M1 5L4.5 8.5L11 1.5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" })))) : null,
                wp.element.createElement("div", { className: "wof-template-card__body" },
                    wp.element.createElement("div", { className: "wof-template-card__media" },
                        wp.element.createElement("img", { src: item.previewImage, alt: item.name, loading: "lazy" })),
                    wp.element.createElement("div", { className: "wof-template-card__content" },
                        wp.element.createElement("div", { className: "wof-template-card__header" },
                            wp.element.createElement("h3", { className: "wof-template-card__title" }, item.name),
                            wp.element.createElement("span", { className: `wof-template-level-badge ${isAdvanced ? 'is-advanced' : 'is-beginner'}` }, item.level ?? 'Beginner')),
                        wp.element.createElement("div", { className: "wof-template-card__specs" },
                            wp.element.createElement("div", { className: "wof-template-card__spec" },
                                item.fieldsCount || item.fieldCount || 4,
                                " ",
                                __('fields', 'wooptionsfic'),
                                " \u00B7 ",
                                item.rulesCount ?? 2,
                                " ",
                                __('rules', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-template-card__spec" }, item.pricingModel ?? __('Cumulative pricing', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-template-card__spec" }, item.layoutModel ?? __('Grid layout', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-template-card__tested" },
                                wp.element.createElement("svg", { width: "13", height: "13", viewBox: "0 0 16 16", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg" },
                                    wp.element.createElement("path", { fillRule: "evenodd", d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.41 5.41a1 1 0 0 0-1.41 0L7 8.41 5.71 7.12a1 1 0 1 0-1.42 1.42l2 2a1 1 0 0 0 1.42 0l4-4a1 1 0 0 0 0-1.42z" })),
                                wp.element.createElement("span", null, __('Tested', 'wooptionsfic')))))),
                wp.element.createElement("div", { className: "wof-template-card__footer", onClick: (e) => e.stopPropagation() },
                    wp.element.createElement("div", { className: "wof-template-card__icons" }, footerIcons.map((t) => renderFooterIcon(t, item.slug))),
                    wp.element.createElement("div", { className: "wof-template-card__actions" },
                        wp.element.createElement("button", { type: "button", className: "wof-btn-card-preview", onClick: onPreview }, __('Preview', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", className: "wof-btn-card-use", isBusy: busy, onClick: onUse }, __('Use template', 'wooptionsfic'))))));
        }
        function Templates(props) {
            const [items, setItems] = useState([]);
            const [search, setSearch] = useState('');
            const [category, setCategory] = useState('all');
            const [fieldTypeFilter, setFieldTypeFilter] = useState('all');
            const [layoutFilter, setLayoutFilter] = useState('all');
            const [sort, setSort] = useState('popular');
            const [page, setPage] = useState(1);
            const [perPage, setPerPage] = useState(9);
            const [viewMode, setViewMode] = useState('grid');
            const [selectedSlug, setSelectedSlug] = useState('design-your-own-pizza');
            const [loading, setLoading] = useState(true);
            const [busy, setBusy] = useState(null);
            const [creating, setCreating] = useState(false);
            const [importing, setImporting] = useState(false);
            const [error, setError] = useState('');
            const fileRef = useRef(null);
            const searchInputRef = useRef(null);
            useEffect(() => {
                WooOptionsFic.Api.listTemplates()
                    .then((response) => {
                    setItems(response.items);
                    if (response.items.length && !selectedSlug) {
                        setSelectedSlug(response.items[0].slug);
                    }
                })
                    .catch((reason) => setError(WooOptionsFic.Utils.errorMessage(reason)))
                    .finally(() => setLoading(false));
            }, []);
            // ⌘K or Ctrl+K shortcut listener
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                    }
                };
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, []);
            useEffect(() => {
                setPage(1);
            }, [search, category, fieldTypeFilter, layoutFilter, sort]);
            const categories = [
                { id: 'all', label: __('All', 'wooptionsfic') },
                { id: 'food', label: __('Food', 'wooptionsfic') },
                { id: 'apparel', label: __('Apparel', 'wooptionsfic') },
                { id: 'personalization', label: __('Personalization', 'wooptionsfic') },
                { id: 'measurement', label: __('Measurement', 'wooptionsfic') },
                { id: 'bundles', label: __('Bundles', 'wooptionsfic') },
                { id: 'advanced', label: __('Advanced', 'wooptionsfic') },
            ];
            const filtered = useMemo(() => {
                const term = search.trim().toLowerCase();
                const result = items.filter((item) => {
                    if (category !== 'all') {
                        if (category === 'advanced') {
                            if ((item.level ?? '').toLowerCase() !== 'advanced' && item.category !== 'advanced') {
                                return false;
                            }
                        }
                        else if (item.category !== category) {
                            return false;
                        }
                    }
                    if (fieldTypeFilter !== 'all') {
                        if (!(item.fieldTypes ?? []).includes(fieldTypeFilter))
                            return false;
                    }
                    if (layoutFilter !== 'all') {
                        const layoutName = (item.layoutModel ?? '').toLowerCase();
                        if (!layoutName.includes(layoutFilter.toLowerCase()))
                            return false;
                    }
                    if (!term)
                        return true;
                    return `${item.name} ${item.description} ${item.categoryLabel ?? item.category} ${item.pricingModel ?? ''} ${item.layoutModel ?? ''} ${(item.features ?? []).join(' ')}`.toLowerCase().includes(term);
                });
                return result.sort((left, right) => {
                    if (sort === 'name')
                        return left.name.localeCompare(right.name);
                    if (sort === 'newest')
                        return (right.order ?? 0) - (left.order ?? 0);
                    return (right.order ?? 0) - (left.order ?? 0);
                });
            }, [items, search, category, fieldTypeFilter, layoutFilter, sort]);
            const pages = Math.max(1, Math.ceil(filtered.length / perPage));
            const currentPage = Math.min(page, pages);
            const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
            const selectedItem = useMemo(() => {
                if (!selectedSlug)
                    return null;
                return items.find((i) => i.slug === selectedSlug) ?? (filtered.length ? filtered[0] : null);
            }, [selectedSlug, items, filtered]);
            const importTemplate = async (slug) => {
                setBusy(slug);
                setError('');
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
            const createFromScratch = async () => {
                setCreating(true);
                setError('');
                try {
                    const created = await WooOptionsFic.Api.createOptionSet(__('Untitled option set', 'wooptionsfic'));
                    props.navigate(`builder/${created.uuid}`);
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setCreating(false);
                }
            };
            const importFile = async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file)
                    return;
                setImporting(true);
                setError('');
                try {
                    const raw = await file.text();
                    const payload = JSON.parse(raw);
                    const previewResult = await WooOptionsFic.Api.previewImport(payload);
                    if (!previewResult.valid) {
                        throw new Error(__('The selected file is not a valid option set template.', 'wooptionsfic'));
                    }
                    const result = await WooOptionsFic.Api.commitImport(payload, previewResult.title || __('Imported template', 'wooptionsfic'));
                    props.navigate(`builder/${result.uuid}`);
                }
                catch (reason) {
                    setError(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setImporting(false);
                }
            };
            return (wp.element.createElement("div", { className: "wof-new-templates-page" },
                wp.element.createElement("header", { className: "wof-new-templates-header" },
                    wp.element.createElement("div", { className: "wof-new-templates-header__left" },
                        wp.element.createElement("h1", { className: "wof-new-templates-title" }, __('Templates', 'wooptionsfic')),
                        wp.element.createElement("p", { className: "wof-new-templates-subtitle" }, __('Start with a tested option set, then make it your own.', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-new-templates-cta-row" },
                            wp.element.createElement(Button, { variant: "primary", className: "wof-btn-create-template", isBusy: creating, onClick: createFromScratch }, __('Create template', 'wooptionsfic')),
                            wp.element.createElement("input", { ref: fileRef, type: "file", hidden: true, accept: "application/json,.json", onChange: importFile }),
                            wp.element.createElement(Button, { variant: "secondary", className: "wof-btn-import-template", isBusy: importing, onClick: () => fileRef.current?.click() }, __('Import template', 'wooptionsfic')))),
                    wp.element.createElement("div", { className: "wof-new-templates-header__right" },
                        wp.element.createElement("div", { className: "wof-quick-search-box", onClick: () => searchInputRef.current?.focus() },
                            wp.element.createElement("input", { ref: searchInputRef, type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: __('Search (⌘K)', 'wooptionsfic'), className: "wof-quick-search-input" }),
                            wp.element.createElement("span", { className: "wof-quick-search-icon" },
                                wp.element.createElement(Dashicon, { name: "search" }))))),
                wp.element.createElement("div", { className: "wof-new-templates-toolbar" },
                    wp.element.createElement("div", { className: "wof-toolbar-row-top" },
                        wp.element.createElement("div", { className: "wof-search-templates-field" },
                            wp.element.createElement("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: __('Search templates', 'wooptionsfic'), className: "wof-search-templates-input" }),
                            wp.element.createElement("span", { className: "wof-search-templates-icon" },
                                wp.element.createElement(Dashicon, { name: "search" }))),
                        wp.element.createElement("div", { className: "wof-category-pills" }, categories.map((cat) => (wp.element.createElement("button", { type: "button", key: cat.id, className: `wof-category-pill ${category === cat.id ? 'is-active' : ''}`, onClick: () => setCategory(cat.id) }, cat.label))))),
                    wp.element.createElement("div", { className: "wof-toolbar-row-bottom" },
                        wp.element.createElement("div", { className: "wof-toolbar-dropdowns-left" },
                            wp.element.createElement("div", { className: "wof-select-wrapper" },
                                wp.element.createElement("select", { value: fieldTypeFilter, onChange: (e) => setFieldTypeFilter(e.target.value), className: "wof-filter-select", "aria-label": __('Filter by field type', 'wooptionsfic') },
                                    wp.element.createElement("option", { value: "all" }, __('Field types', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "image_swatch" }, __('Image choices', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "color_swatch" }, __('Color swatches', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "radio" }, __('Radio group', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "segmented" }, __('Button choices', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "checkbox_group" }, __('Checkbox group', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "product" }, __('Product choices', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "file" }, __('File upload', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "repeater" }, __('Repeatable section', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "date_range" }, __('Date range', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "formula" }, __('Formula output', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "customer_defined_price" }, __('Customer price', 'wooptionsfic'))),
                                wp.element.createElement("span", { className: "wof-select-chevron" }, "\u25BE")),
                            wp.element.createElement("div", { className: "wof-select-wrapper" },
                                wp.element.createElement("select", { value: layoutFilter, onChange: (e) => setLayoutFilter(e.target.value), className: "wof-filter-select", "aria-label": __('Filter by layout', 'wooptionsfic') },
                                    wp.element.createElement("option", { value: "all" }, __('Layout', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "grid" }, __('Grid layout', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "sectioned" }, __('Sectioned layout', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "accordion" }, __('Accordion layout', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "step" }, __('Step layout', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "single column" }, __('Single column', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "table" }, __('Table layout', 'wooptionsfic'))),
                                wp.element.createElement("span", { className: "wof-select-chevron" }, "\u25BE"))),
                        wp.element.createElement("div", { className: "wof-toolbar-dropdowns-right" },
                            wp.element.createElement("div", { className: "wof-select-wrapper" },
                                wp.element.createElement("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "wof-filter-select", "aria-label": __('Sort templates', 'wooptionsfic') },
                                    wp.element.createElement("option", { value: "popular" }, __('Most useful', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "newest" }, __('Newest first', 'wooptionsfic')),
                                    wp.element.createElement("option", { value: "name" }, __('Name A–Z', 'wooptionsfic'))),
                                wp.element.createElement("span", { className: "wof-select-chevron" }, "\u25BE"))))),
                error ? (wp.element.createElement("div", { className: "wof-notice-wrap" },
                    wp.element.createElement(WooOptionsFic.Components.InlineNotice, { type: "error", onClose: () => setError('') }, error))) : null,
                wp.element.createElement("div", { className: `wof-templates-main-layout ${selectedItem ? 'has-drawer' : 'no-drawer'}` },
                    wp.element.createElement("div", { className: "wof-templates-catalog-column" },
                        loading ? (wp.element.createElement(WooOptionsFic.Components.Loading, { label: __('Loading templates…', 'wooptionsfic') })) : visible.length ? (wp.element.createElement("div", { className: `wof-templates-cards-grid is-${viewMode}` }, visible.map((item) => (wp.element.createElement(TemplateCard, { key: item.slug, item: item, selected: selectedItem?.slug === item.slug, busy: busy === item.slug, onSelect: () => setSelectedSlug(item.slug), onPreview: () => setSelectedSlug(item.slug), onUse: () => importTemplate(item.slug) }))))) : (wp.element.createElement(WooOptionsFic.Components.EmptyState, { icon: "search", title: __('No templates found', 'wooptionsfic'), description: __('Try adjusting your search terms or category filters.', 'wooptionsfic'), action: wp.element.createElement(Button, { variant: "secondary", onClick: () => {
                                    setSearch('');
                                    setCategory('all');
                                    setFieldTypeFilter('all');
                                    setLayoutFilter('all');
                                } }, __('Clear all filters', 'wooptionsfic')) })),
                        !loading && filtered.length ? (wp.element.createElement("div", { className: "wof-templates-bottom-bar" },
                            wp.element.createElement("div", { className: "wof-templates-bottom-count" }, sprintf(__('%d original templates', 'wooptionsfic'), filtered.length)),
                            wp.element.createElement("div", { className: "wof-templates-bottom-controls" },
                                wp.element.createElement("div", { className: "wof-view-mode-toggle" },
                                    wp.element.createElement("button", { type: "button", className: `wof-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`, onClick: () => setViewMode('grid'), "aria-label": __('Grid view', 'wooptionsfic'), title: __('Grid view', 'wooptionsfic') },
                                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "currentColor" },
                                            wp.element.createElement("rect", { x: "1", y: "1", width: "6", height: "6", rx: "1.5" }),
                                            wp.element.createElement("rect", { x: "9", y: "1", width: "6", height: "6", rx: "1.5" }),
                                            wp.element.createElement("rect", { x: "1", y: "9", width: "6", height: "6", rx: "1.5" }),
                                            wp.element.createElement("rect", { x: "9", y: "9", width: "6", height: "6", rx: "1.5" }))),
                                    wp.element.createElement("button", { type: "button", className: `wof-view-btn ${viewMode === 'list' ? 'is-active' : ''}`, onClick: () => setViewMode('list'), "aria-label": __('List view', 'wooptionsfic'), title: __('List view', 'wooptionsfic') },
                                        wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "currentColor" },
                                            wp.element.createElement("rect", { x: "1", y: "2", width: "14", height: "2", rx: "1" }),
                                            wp.element.createElement("rect", { x: "1", y: "7", width: "14", height: "2", rx: "1" }),
                                            wp.element.createElement("rect", { x: "1", y: "12", width: "14", height: "2", rx: "1" })))),
                                wp.element.createElement("div", { className: "wof-per-page-select-wrapper" },
                                    wp.element.createElement("select", { value: perPage, onChange: (e) => setPerPage(Number(e.target.value)), className: "wof-per-page-select", "aria-label": __('Items per page', 'wooptionsfic') },
                                        wp.element.createElement("option", { value: 9 }, __('9 per page', 'wooptionsfic')),
                                        wp.element.createElement("option", { value: 18 }, __('18 per page', 'wooptionsfic')),
                                        wp.element.createElement("option", { value: 36 }, __('36 per page', 'wooptionsfic'))),
                                    wp.element.createElement("span", { className: "wof-select-chevron" }, "\u25BE")),
                                wp.element.createElement("div", { className: "wof-templates-pagination" },
                                    wp.element.createElement("button", { type: "button", disabled: currentPage <= 1, onClick: () => setPage(currentPage - 1), className: "wof-page-nav-btn", "aria-label": __('Previous page', 'wooptionsfic') }, "\u2039"),
                                    wp.element.createElement("span", { className: "wof-page-number-active" }, currentPage),
                                    wp.element.createElement("button", { type: "button", disabled: currentPage >= pages, onClick: () => setPage(currentPage + 1), className: "wof-page-nav-btn", "aria-label": __('Next page', 'wooptionsfic') }, "\u203A"))))) : null),
                    selectedItem ? (wp.element.createElement("aside", { className: "wof-template-drawer" },
                        wp.element.createElement("div", { className: "wof-template-drawer__header" },
                            wp.element.createElement("h2", { className: "wof-template-drawer__title" }, selectedItem.name),
                            wp.element.createElement("button", { type: "button", className: "wof-template-drawer__close", onClick: () => setSelectedSlug(null), "aria-label": __('Close details', 'wooptionsfic') }, "\u2715")),
                        wp.element.createElement("div", { className: "wof-template-drawer__hero" },
                            wp.element.createElement("img", { src: selectedItem.heroImage || selectedItem.previewImage, alt: selectedItem.name, className: "wof-template-drawer__hero-img" })),
                        wp.element.createElement("p", { className: "wof-template-drawer__desc" }, selectedItem.description),
                        wp.element.createElement("div", { className: "wof-template-drawer__section" },
                            wp.element.createElement("h4", { className: "wof-drawer-section-title" }, __('Features', 'wooptionsfic')),
                            wp.element.createElement("ul", { className: "wof-drawer-features-list" }, (selectedItem.features?.length ? selectedItem.features : [
                                __('Image choices', 'wooptionsfic'),
                                __('Per-choice quantity', 'wooptionsfic'),
                                __('Conditional toppings', 'wooptionsfic'),
                                __('Cumulative pricing', 'wooptionsfic')
                            ]).map((feat, idx) => (wp.element.createElement("li", { key: idx, className: "wof-drawer-feature-item" },
                                wp.element.createElement("span", { className: "wof-feature-check" },
                                    wp.element.createElement("svg", { width: "12", height: "12", viewBox: "0 0 16 16", fill: "currentColor" },
                                        wp.element.createElement("path", { fillRule: "evenodd", d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.41 5.41a1 1 0 0 0-1.41 0L7 8.41 5.71 7.12a1 1 0 1 0-1.42 1.42l2 2a1 1 0 0 0 1.42 0l4-4a1 1 0 0 0 0-1.42z" }))),
                                wp.element.createElement("span", null, feat)))))),
                        wp.element.createElement("div", { className: "wof-template-drawer__section" },
                            wp.element.createElement("h4", { className: "wof-drawer-section-title" }, __('Details', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-drawer-details-list" },
                                wp.element.createElement("div", { className: "wof-drawer-detail-item" },
                                    wp.element.createElement("span", { className: "wof-detail-icon is-glyph" }, "$$"),
                                    wp.element.createElement("span", null, selectedItem.details?.fields || `${selectedItem.fieldsCount || selectedItem.fieldCount || 12} fields`)),
                                wp.element.createElement("div", { className: "wof-drawer-detail-item" },
                                    wp.element.createElement("span", { className: "wof-detail-icon" }, "\u26A1"),
                                    wp.element.createElement("span", null, selectedItem.details?.rules || `${selectedItem.rulesCount ?? 4} rules`)),
                                wp.element.createElement("div", { className: "wof-drawer-detail-item" },
                                    wp.element.createElement("span", { className: "wof-detail-icon" }, "\u229E"),
                                    wp.element.createElement("span", null, selectedItem.details?.layout || selectedItem.layoutModel || 'Grid layout')),
                                wp.element.createElement("div", { className: "wof-drawer-detail-item" },
                                    wp.element.createElement("span", { className: "wof-detail-icon is-check" }, "\u2714"),
                                    wp.element.createElement("span", null, selectedItem.details?.tested || 'Tested for accessibility')))),
                        wp.element.createElement("div", { className: "wof-template-drawer__actions" },
                            wp.element.createElement(Button, { variant: "primary", className: "wof-drawer-btn-use", isBusy: busy === selectedItem.slug, onClick: () => importTemplate(selectedItem.slug) }, __('Use this template', 'wooptionsfic')),
                            wp.element.createElement("button", { type: "button", className: "wof-drawer-btn-preview", onClick: () => {
                                    if (selectedItem.previewUrl) {
                                        window.open(selectedItem.previewUrl, '_blank');
                                    }
                                    else {
                                        window.alert(__('Storefront preview URL will be configured manually.', 'wooptionsfic'));
                                    }
                                } },
                                wp.element.createElement("span", null, __('Preview storefront', 'wooptionsfic')),
                                wp.element.createElement("svg", { width: "13", height: "13", viewBox: "0 0 16 16", fill: "currentColor" },
                                    wp.element.createElement("path", { d: "M14 2.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0 0 1h4.793L2.146 13.146a.5.5 0 0 0 .708.708L13 3.707V8.5a.5.5 0 0 0 1 0v-6z" })))))) : null)));
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
        function formatChoicePrice(pricing) {
            if (!pricing || pricing.strategy === 'none')
                return '';
            const adminConfig = window.WooOptionsFicAdmin;
            const symbol = adminConfig?.currencySymbol || adminConfig?.currency || '$';
            if (pricing.strategy === 'fixed') {
                const raw = String(pricing.amount ?? '0').trim();
                if (!raw || raw === '0')
                    return '';
                const isNegative = raw.startsWith('-');
                const clean = isNegative ? raw.slice(1) : raw.startsWith('+') ? raw.slice(1) : raw;
                const prefix = isNegative ? '-' : '+';
                return `${prefix}${symbol}${clean}`;
            }
            if (pricing.strategy === 'percentage') {
                const raw = String(pricing.percent ?? '0').trim();
                if (!raw || raw === '0')
                    return '';
                const isNegative = raw.startsWith('-');
                const clean = isNegative ? raw.slice(1) : raw.startsWith('+') ? raw.slice(1) : raw;
                const prefix = isNegative ? '-' : '+';
                return `${prefix}${clean}%`;
            }
            return '';
        }
        Builder.formatChoicePrice = formatChoicePrice;
        function choiceLabel(choice) {
            const priceText = formatChoicePrice(choice.pricing);
            const amount = priceText ? ` · ${priceText}` : '';
            return `${choice.label}${amount}`;
        }
        function previewColor(field) {
            const value = String(field.default ?? '#5B4FF5').toUpperCase();
            return /^#[0-9A-F]{6}$/.test(value) ? value : '#5B4FF5';
        }
        function renderCheckSvg(size = 11) {
            return (wp.element.createElement("svg", { viewBox: "0 0 20 20", width: size, height: size, fill: "currentColor", "aria-hidden": "true", style: { display: 'block' } },
                wp.element.createElement("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" })));
        }
        function renderFlagSvg(country) {
            const c = (country || 'US').toUpperCase();
            const style = { borderRadius: '2px', overflow: 'hidden', flexShrink: 0, display: 'block', boxShadow: '0 0 1px rgba(0,0,0,0.3)' };
            if (c === 'BD')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#006A4E" }),
                    wp.element.createElement("circle", { cx: "9", cy: "7", r: "4.2", fill: "#F42A41" }));
            if (c === 'US')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#B22234" }),
                    wp.element.createElement("rect", { y: "2.1", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "6.3", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "10.5", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { width: "8", height: "7.2", fill: "#3C3B6E" }),
                    wp.element.createElement("circle", { cx: "4", cy: "3.6", r: "1.5", fill: "#FFFFFF" }));
            if (c === 'GB')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#012169" }),
                    wp.element.createElement("path", { d: "M0 0L20 14M20 0L0 14", stroke: "#FFFFFF", strokeWidth: "2.5" }),
                    wp.element.createElement("path", { d: "M0 0L20 14M20 0L0 14", stroke: "#C8102E", strokeWidth: "1.2" }),
                    wp.element.createElement("path", { d: "M10 0v14M0 7h20", stroke: "#FFFFFF", strokeWidth: "4" }),
                    wp.element.createElement("path", { d: "M10 0v14M0 7h20", stroke: "#C8102E", strokeWidth: "2.2" }));
            if (c === 'CA')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#D80027" }),
                    wp.element.createElement("rect", { x: "5", width: "10", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("polygon", { points: "10,2.5 11,5.5 13.5,5 12,7 13.5,8.5 11,8 10.5,11 9.5,11 9,8 6.5,8.5 8,7 6.5,5 9,5.5", fill: "#D80027" }));
            if (c === 'AU')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#00008B" }),
                    wp.element.createElement("circle", { cx: "14", cy: "4", r: "1", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "16", cy: "7", r: "1", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "13", cy: "10", r: "1", fill: "#FFFFFF" }));
            if (c === 'DE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#000000" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#DD0000" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#FFCE00" }));
            if (c === 'FR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#002654" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#CE1126" }));
            if (c === 'IT')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#009246" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#CE2B37" }));
            if (c === 'ES')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "3.5", fill: "#AA151B" }),
                    wp.element.createElement("rect", { y: "3.5", width: "20", height: "7", fill: "#F1BF00" }),
                    wp.element.createElement("rect", { y: "10.5", width: "20", height: "3.5", fill: "#AA151B" }));
            if (c === 'NL')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#AE1C28" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#21468B" }));
            if (c === 'BR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#009C3B" }),
                    wp.element.createElement("polygon", { points: "10,2 18,7 10,12 2,7", fill: "#FEDF00" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "2.5", fill: "#002776" }));
            if (c === 'IN')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#FF9933" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#138808" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "1.8", fill: "#000080" }));
            if (c === 'CN')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#DE2910" }),
                    wp.element.createElement("polygon", { points: "4,2.5 4.6,4.2 6.2,4.2 4.9,5.2 5.4,6.8 4,5.8 2.6,6.8 3.1,5.2 1.8,4.2 3.4,4.2", fill: "#FFDE00" }));
            if (c === 'JP')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "4", fill: "#BC002D" }));
            if (c === 'KR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "3.5", fill: "#CD2E3A" }),
                    wp.element.createElement("path", { d: "M10 7a3.5 3.5 0 0 1 0 3.5 3.5 3.5 0 0 0 0-7z", fill: "#0047A0" }));
            if (c === 'MX')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#006847" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#CE1126" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "1.5", fill: "#8B5A2B" }));
            if (c === 'AE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { y: "0", width: "20", height: "4.66", fill: "#00732F" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#000000" }),
                    wp.element.createElement("rect", { width: "5", height: "14", fill: "#FF0000" }));
            if (c === 'SA')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#006C35" }),
                    wp.element.createElement("rect", { x: "4", y: "6.2", width: "12", height: "1.6", fill: "#FFFFFF" }));
            if (c === 'SG')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "7", fill: "#ED2939" }),
                    wp.element.createElement("rect", { y: "7", width: "20", height: "7", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "4.5", cy: "3.5", r: "2.2", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "5.2", cy: "3.5", r: "1.8", fill: "#ED2939" }));
            if (c === 'PK')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "5", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "5", width: "15", height: "14", fill: "#01411C" }),
                    wp.element.createElement("circle", { cx: "12", cy: "7", r: "3.2", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "13", cy: "6.4", r: "2.7", fill: "#01411C" }));
            if (c === 'ZA')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "7", fill: "#E03C31" }),
                    wp.element.createElement("rect", { y: "7", width: "20", height: "7", fill: "#001489" }),
                    wp.element.createElement("polygon", { points: "0,0 8,7 0,14", fill: "#000000" }),
                    wp.element.createElement("path", { d: "M0 0l8.5 7-8.5 7h3l7-5.5v-3l-7-5.5z", fill: "#FFB81C" }),
                    wp.element.createElement("path", { d: "M8 5.5h12v3h-12z", fill: "#007749" }));
            if (c === 'TR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#E30A17" }),
                    wp.element.createElement("circle", { cx: "8", cy: "7", r: "3.5", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "9", cy: "7", r: "2.8", fill: "#E30A17" }),
                    wp.element.createElement("polygon", { points: "12.5,5.5 13.5,7 15,7 13.8,8 14.2,9.5 13,8.5 11.8,9.5 12.2,8 11,7 12.5,7", fill: "#FFFFFF" }));
            if (c === 'SE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#005293" }),
                    wp.element.createElement("rect", { x: "6", width: "3", height: "14", fill: "#FECB00" }),
                    wp.element.createElement("rect", { y: "5.5", width: "20", height: "3", fill: "#FECB00" }));
            if (c === 'CH')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#D52B1E" }),
                    wp.element.createElement("rect", { x: "8.5", y: "3", width: "3", height: "8", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "6", y: "5.5", width: "8", height: "3", fill: "#FFFFFF" }));
            if (c === 'PL')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "7", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "7", width: "20", height: "7", fill: "#DC143C" }));
            if (c === 'AR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#74ACDF" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#74ACDF" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "1.6", fill: "#F6B40E" }));
            if (c === 'BE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#000000" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FDDA24" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#EF3340" }));
            if (c === 'AT')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#ED2939" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#ED2939" }));
            if (c === 'NO')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#BA0C2F" }),
                    wp.element.createElement("rect", { x: "5.5", width: "4", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "5", width: "20", height: "4", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "6.5", width: "2", height: "14", fill: "#00205B" }),
                    wp.element.createElement("rect", { y: "6", width: "20", height: "2", fill: "#00205B" }));
            if (c === 'DK')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#C60C30" }),
                    wp.element.createElement("rect", { x: "6", width: "2.5", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "5.7", width: "20", height: "2.5", fill: "#FFFFFF" }));
            if (c === 'FI')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "6", width: "3", height: "14", fill: "#002F6C" }),
                    wp.element.createElement("rect", { y: "5.5", width: "20", height: "3", fill: "#002F6C" }));
            if (c === 'IE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#169B62" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#FF883E" }));
            if (c === 'NZ')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#00247D" }),
                    wp.element.createElement("circle", { cx: "14", cy: "4", r: "1.1", fill: "#CC142B" }),
                    wp.element.createElement("circle", { cx: "16.5", cy: "7", r: "1.1", fill: "#CC142B" }),
                    wp.element.createElement("circle", { cx: "13", cy: "10", r: "1.1", fill: "#CC142B" }));
            if (c === 'PT')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "8", height: "14", fill: "#046A38" }),
                    wp.element.createElement("rect", { x: "8", width: "12", height: "14", fill: "#DA291C" }),
                    wp.element.createElement("circle", { cx: "8", cy: "7", r: "2.5", fill: "#FFE900" }));
            if (c === 'GR')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#0D5EAF" }),
                    wp.element.createElement("rect", { y: "1.5", width: "20", height: "1.5", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "4.6", width: "20", height: "1.5", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "7.7", width: "20", height: "1.5", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "10.8", width: "20", height: "1.5", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { width: "7.5", height: "7.7", fill: "#0D5EAF" }),
                    wp.element.createElement("rect", { x: "3", width: "1.5", height: "7.7", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "3.1", width: "7.5", height: "1.5", fill: "#FFFFFF" }));
            if (c === 'IL')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "1.5", width: "20", height: "2", fill: "#0038B8" }),
                    wp.element.createElement("rect", { y: "10.5", width: "20", height: "2", fill: "#0038B8" }),
                    wp.element.createElement("polygon", { points: "10,4.5 12,8 8,8", stroke: "#0038B8", strokeWidth: "0.7", fill: "none" }),
                    wp.element.createElement("polygon", { points: "10,9 12,5.5 8,5.5", stroke: "#0038B8", strokeWidth: "0.7", fill: "none" }));
            if (c === 'HK')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#C8102E" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "3", fill: "#FFFFFF" }));
            if (c === 'MY')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#CC0000" }),
                    wp.element.createElement("rect", { y: "2", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "6", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "10", width: "20", height: "2", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { width: "10", height: "8", fill: "#010066" }),
                    wp.element.createElement("circle", { cx: "5", cy: "4", r: "2.5", fill: "#FFCC00" }),
                    wp.element.createElement("circle", { cx: "5.8", cy: "4", r: "2.1", fill: "#010066" }));
            if (c === 'PH')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "7", fill: "#0038A8" }),
                    wp.element.createElement("rect", { y: "7", width: "20", height: "7", fill: "#CE1126" }),
                    wp.element.createElement("polygon", { points: "0,0 8,7 0,14", fill: "#FFFFFF" }),
                    wp.element.createElement("circle", { cx: "2.8", cy: "7", r: "1.3", fill: "#FCD116" }));
            if (c === 'ID')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "7", fill: "#CE1126" }),
                    wp.element.createElement("rect", { y: "7", width: "20", height: "7", fill: "#FFFFFF" }));
            if (c === 'TH')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#A51931" }),
                    wp.element.createElement("rect", { y: "2.3", width: "20", height: "9.4", fill: "#F4F5F8" }),
                    wp.element.createElement("rect", { y: "4.6", width: "20", height: "4.8", fill: "#2D2A4A" }));
            if (c === 'VN')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "14", fill: "#DA251D" }),
                    wp.element.createElement("polygon", { points: "10,3.5 11.2,7.2 14.8,7.2 11.9,9.4 13,13 10,10.8 7,13 8.1,9.4 5.2,7.2 8.8,7.2", fill: "#FFFF00" }));
            if (c === 'EG')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4.66", fill: "#CE1126" }),
                    wp.element.createElement("rect", { y: "4.66", width: "20", height: "4.66", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "9.33", width: "20", height: "4.67", fill: "#000000" }),
                    wp.element.createElement("circle", { cx: "10", cy: "7", r: "1.3", fill: "#C09A3E" }));
            if (c === 'NG')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "6.6", height: "14", fill: "#008751" }),
                    wp.element.createElement("rect", { x: "6.6", width: "6.8", height: "14", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { x: "13.4", width: "6.6", height: "14", fill: "#008751" }));
            if (c === 'KE')
                return wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                    wp.element.createElement("rect", { width: "20", height: "4", fill: "#000000" }),
                    wp.element.createElement("rect", { y: "4", width: "20", height: "1", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "5", width: "20", height: "4", fill: "#922529" }),
                    wp.element.createElement("rect", { y: "9", width: "20", height: "1", fill: "#FFFFFF" }),
                    wp.element.createElement("rect", { y: "10", width: "20", height: "4", fill: "#006600" }),
                    wp.element.createElement("ellipse", { cx: "10", cy: "7", rx: "2", ry: "3.5", fill: "#922529" }),
                    wp.element.createElement("ellipse", { cx: "10", cy: "7", rx: "0.5", ry: "3.5", fill: "#FFFFFF" }));
            return (wp.element.createElement("svg", { viewBox: "0 0 20 14", width: "20", height: "14", "aria-hidden": "true", style: style },
                wp.element.createElement("rect", { width: "20", height: "14", fill: "#334155" }),
                wp.element.createElement("text", { x: "10", y: "10", fontFamily: "-apple-system,sans-serif", fontSize: "7", fontWeight: "bold", fill: "#ffffff", textAnchor: "middle" }, c.slice(0, 2))));
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
            if (field.type === 'toggle') {
                const isChecked = Boolean(field.default);
                const priceText = formatChoicePrice(field.pricing);
                return (wp.element.createElement("div", { className: `wof-preview-toggle${isChecked ? ' is-checked' : ''}` },
                    wp.element.createElement("span", { className: "wof-preview-toggle__track" },
                        wp.element.createElement("span", { className: "wof-preview-toggle__thumb" })),
                    wp.element.createElement("strong", { className: "wof-preview-toggle__label" }, field.label || __('Switch', 'wooptionsfic')),
                    priceText ? wp.element.createElement("span", { className: "wof-preview-boolean__price" }, priceText) : null));
            }
            if (field.type === 'checkbox') {
                const isChecked = Boolean(field.default);
                const priceText = formatChoicePrice(field.pricing);
                return (wp.element.createElement("div", { className: `wof-preview-checkbox${isChecked ? ' is-checked' : ''}` },
                    wp.element.createElement("span", { className: "wof-preview-checkbox__box" }, isChecked ? renderCheckSvg(10) : null),
                    wp.element.createElement("strong", { className: "wof-preview-checkbox__label" }, field.label || __('Checkbox', 'wooptionsfic')),
                    priceText ? wp.element.createElement("span", { className: "wof-preview-boolean__price" }, priceText) : null));
            }
            if (field.type === 'textarea') {
                const rows = field.rows ? Math.max(1, field.rows) : 4;
                return (wp.element.createElement("div", { className: "wof-preview-textarea-wrap" },
                    wp.element.createElement("textarea", { className: "wof-preview-textarea", readOnly: true, tabIndex: -1, rows: rows, style: {
                            textTransform: field.textTransform && field.textTransform !== 'none' ? field.textTransform : undefined,
                        }, placeholder: field.placeholder || __('Enter text…', 'wooptionsfic') })));
            }
            if (field.type === 'select' || field.type === 'font') {
                const selectedChoice = choices.find(c => Boolean(c.default));
                return (wp.element.createElement("div", { className: "wof-preview-select-control" },
                    wp.element.createElement("select", { "aria-disabled": "true", tabIndex: -1, value: "", onChange: () => undefined },
                        wp.element.createElement("option", { value: "" }, selectedChoice?.label ? choiceLabel(selectedChoice) : __('Choose an option', 'wooptionsfic'))),
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-down-alt2" })));
            }
            if (field.type === 'color_picker') {
                const color = previewColor(field);
                return (wp.element.createElement("div", { className: "wof-preview-color-picker" },
                    wp.element.createElement("span", { className: "wof-preview-color-picker__swatch", style: { background: color } }),
                    wp.element.createElement("span", null,
                        wp.element.createElement("strong", null, color),
                        wp.element.createElement("small", null, __('Click to choose a color', 'wooptionsfic'))),
                    wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-customizer" })));
            }
            if (field.type === 'range')
                return wp.element.createElement("input", { disabled: true, type: "range", min: field.min ?? 0, max: field.max ?? 100 });
            if (field.type === 'file') {
                const maxFiles = Math.max(1, Number(field.maxFiles ?? 1));
                const maxMb = Math.max(1, Number(field.maxFileMb ?? 5));
                return (wp.element.createElement("div", { className: "wof-preview-upload" },
                    wp.element.createElement("div", { className: "wof-preview-upload__picker" },
                        wp.element.createElement("button", { type: "button", className: "wof-preview-upload__button", tabIndex: -1, "aria-disabled": "true" },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "upload" }),
                            __('Upload', 'wooptionsfic')),
                        wp.element.createElement("span", null, __('Click or drag and drop', 'wooptionsfic')),
                        wp.element.createElement("small", null, maxFiles === 1 ? `${maxMb} MB max` : `Up to ${maxFiles} files, ${maxMb} MB each`))));
            }
            if (field.type === 'date_range')
                return wp.element.createElement("div", { className: "wof-preview-date-range" },
                    wp.element.createElement("input", { disabled: true, type: "date" }),
                    wp.element.createElement("span", null, "to"),
                    wp.element.createElement("input", { disabled: true, type: "date" }));
            if (field.type === 'tel') {
                const flagStyle = field.flagStyle ?? 'number_only';
                const country = (field.defaultCountry ?? 'US').toUpperCase();
                const dialCodes = {
                    US: '+1', GB: '+44', CA: '+1', AU: '+61', DE: '+49', FR: '+33', IT: '+39', ES: '+34',
                    NL: '+31', BR: '+55', IN: '+91', CN: '+86', JP: '+81', KR: '+82', MX: '+52', AE: '+971',
                    SA: '+966', SG: '+65', BD: '+880', PK: '+92', ZA: '+27', TR: '+90', SE: '+46', CH: '+41',
                    PL: '+48', AR: '+54', BE: '+32', AT: '+43', NO: '+47', DK: '+45', FI: '+358', IE: '+353',
                    NZ: '+64', PT: '+351', GR: '+30', IL: '+972', HK: '+852', MY: '+60', PH: '+63', ID: '+62',
                    TH: '+66', VN: '+84', EG: '+20', NG: '+234', KE: '+254',
                };
                const dialCode = dialCodes[country] ?? '+1';
                if (flagStyle === 'number_only') {
                    return wp.element.createElement("input", { disabled: true, type: "tel", placeholder: field.placeholder || __('Enter phone number…', 'wooptionsfic') });
                }
                return (wp.element.createElement("div", { className: "wof-preview-tel-wrap" },
                    wp.element.createElement("div", { className: "wof-preview-tel-flag" },
                        renderFlagSvg(country),
                        wp.element.createElement("span", { style: { fontWeight: 600, fontSize: '13px' } }, country),
                        flagStyle === 'number_flag_dialcode' ? wp.element.createElement("span", { style: { color: '#64748b', fontSize: '12px' } }, dialCode) : null,
                        wp.element.createElement("svg", { viewBox: "0 0 20 20", width: "12", height: "12", fill: "#64748b", style: { display: 'block' } },
                            wp.element.createElement("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }))),
                    wp.element.createElement("input", { disabled: true, type: "tel", placeholder: field.placeholder || __('Enter phone number…', 'wooptionsfic') })));
            }
            if (field.type === 'radio') {
                const isTwoCols = field.columns === 'two' || field.columns === 2;
                const isCircle = field.imageStyle === 'circle';
                const listStyle = isTwoCols ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' } : undefined;
                return (wp.element.createElement("div", { className: `wof-preview-radio-list${isTwoCols ? ' wof-preview-radio-list--cols-2' : ''}`, style: listStyle }, choices.slice(0, 4).map((choice) => {
                    const isSelected = Boolean(choice.default ||
                        choice.selected ||
                        (typeof field.default === 'string' && field.default === choice.uuid));
                    return (wp.element.createElement("label", { className: `wof-preview-radio-item${isSelected ? ' is-selected' : ''}`, key: choice.uuid },
                        wp.element.createElement("span", { className: "wof-preview-radio-item__indicator" }),
                        Boolean(choice.imageId || choice.imageUrl) ? (wp.element.createElement("span", { style: {
                                width: '32px',
                                height: '32px',
                                borderRadius: isCircle ? '50%' : '4px',
                                overflow: 'hidden',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: '#f1f5f9',
                                border: '1px solid #d8deea',
                                marginInlineEnd: '6px',
                            } },
                            wp.element.createElement(WooOptionsFic.Components.MediaImage, { attachmentId: choice.imageId, src: choice.imageUrl, alt: "" }))) : null,
                        wp.element.createElement("span", { className: "wof-preview-radio-item__label" }, choice.label),
                        formatChoicePrice(choice.pricing) ? wp.element.createElement("span", { className: "wof-preview-radio-item__price" }, formatChoicePrice(choice.pricing)) : null));
                })));
            }
            if (field.type === 'checkbox_group') {
                const isTwoCols = field.columns === 'two' || field.columns === 2;
                const isCircle = field.imageStyle === 'circle';
                const listStyle = isTwoCols ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' } : undefined;
                return (wp.element.createElement("div", { className: `wof-preview-checkbox-list${isTwoCols ? ' wof-preview-checkbox-list--cols-2' : ''}`, style: listStyle }, choices.slice(0, 4).map((choice) => {
                    const isSelected = Boolean(choice.default ||
                        choice.selected ||
                        (Array.isArray(field.default) && field.default.includes(choice.uuid)) ||
                        (typeof field.default === 'string' && field.default === choice.uuid));
                    return (wp.element.createElement("label", { className: `wof-preview-checkbox-item${isSelected ? ' is-selected' : ''}`, key: choice.uuid },
                        wp.element.createElement("span", { className: "wof-preview-checkbox-item__indicator" }, isSelected ? renderCheckSvg(10) : null),
                        Boolean(choice.imageId || choice.imageUrl) ? (wp.element.createElement("span", { style: {
                                width: '32px',
                                height: '32px',
                                borderRadius: isCircle ? '50%' : '4px',
                                overflow: 'hidden',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: '#f1f5f9',
                                border: '1px solid #d8deea',
                                marginInlineEnd: '6px',
                            } },
                            wp.element.createElement(WooOptionsFic.Components.MediaImage, { attachmentId: choice.imageId, src: choice.imageUrl, alt: "" }))) : null,
                        wp.element.createElement("span", { className: "wof-preview-checkbox-item__label" }, choice.label),
                        formatChoicePrice(choice.pricing) ? wp.element.createElement("span", { className: "wof-preview-checkbox-item__price" }, formatChoicePrice(choice.pricing)) : null));
                })));
            }
            if (field.type === 'segmented') {
                const isVertical = field.type === 'segmented' && field.displayDirection === 'vertical';
                const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
                const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
                const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';
                const btnStyle = {};
                if (hasWidth)
                    btnStyle.minWidth = `${field.choiceWidth}px`;
                if (hasHeight)
                    btnStyle.minHeight = `${field.choiceHeight}px`;
                if (hasRadius)
                    btnStyle.borderRadius = `${field.choiceBorderRadius}px`;
                const wrapStyle = {
                    display: 'flex',
                    flexDirection: isVertical ? 'column' : 'row',
                    flexWrap: isVertical ? 'nowrap' : 'wrap',
                    gap: '8px',
                    alignItems: isVertical ? 'flex-start' : 'center',
                };
                return (wp.element.createElement("div", { style: wrapStyle }, choices.slice(0, 4).map((choice, index) => {
                    const priceText = formatChoicePrice(choice.pricing);
                    const isSelected = Boolean(choice.default) || (index === 0 && !choices.some((c) => c.default));
                    return (wp.element.createElement("span", { key: choice.uuid, style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            minHeight: btnStyle.minHeight ?? '40px',
                            minWidth: btnStyle.minWidth,
                            borderRadius: hasRadius ? `${field.choiceBorderRadius}px` : undefined,
                            border: isSelected ? '1.5px solid var(--wof-preview-primary, #5b4ff5)' : '1px solid var(--wof-preview-border, #d8deea)',
                            background: isSelected ? 'color-mix(in srgb, var(--wof-preview-primary, #5b4ff5) 5%, var(--wof-preview-surface, #fff))' : 'var(--wof-preview-surface, #fff)',
                            color: 'var(--wof-preview-text, #172033)',
                            fontSize: '13px',
                            fontWeight: 550,
                            boxShadow: 'none',
                            cursor: 'default',
                            whiteSpace: 'nowrap',
                        } },
                        Boolean(choice.imageId || choice.imageUrl) ? (wp.element.createElement("span", { style: {
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: '#f1f5f9',
                            } },
                            wp.element.createElement(WooOptionsFic.Components.MediaImage, { attachmentId: choice.imageId, src: choice.imageUrl, alt: "" }))) : null,
                        wp.element.createElement("span", null, choice.label),
                        priceText ? wp.element.createElement("span", { style: { fontSize: '11px', opacity: 0.72 } }, priceText) : null));
                })));
            }
            if (field.type === 'color_swatch') {
                const swatchStyle = {};
                const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
                const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
                const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';
                if (hasWidth)
                    swatchStyle.width = `${field.choiceWidth}px`;
                if (hasHeight)
                    swatchStyle.height = `${field.choiceHeight}px`;
                if (hasRadius)
                    swatchStyle.borderRadius = `${field.choiceBorderRadius}px`;
                return (wp.element.createElement("div", { className: "wof-preview-color-blocks" }, choices.slice(0, 5).map((choice) => {
                    const isSelected = Boolean(choice.default || choice.selected);
                    return (wp.element.createElement("div", { className: `wof-preview-color-block${isSelected ? ' is-selected' : ''}`, key: choice.uuid, style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                        wp.element.createElement("span", { className: "wof-preview-color-block__swatch", style: { background: choice.color || '#ddd', ...swatchStyle, position: 'relative' } }, isSelected ? wp.element.createElement("span", { className: "wof-preview-color-block__check", style: { position: 'absolute', top: '2px', right: '2px', background: '#172033', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', zIndex: 3 } }, renderCheckSvg(10)) : null),
                        wp.element.createElement("small", { style: { minHeight: '1.3em', marginTop: '4px' } }, choice.label),
                        wp.element.createElement("span", { className: "wof-preview-color-block__price", style: { minHeight: '1.3em' } }, formatChoicePrice(choice.pricing)),
                        field.enableQuantity ? (wp.element.createElement("span", { className: "wof-choice-qty-wrap", style: { marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'center', width: '100%' } },
                            wp.element.createElement("input", { disabled: true, type: "number", className: "wof-choice-qty-input", defaultValue: field.minQuantity ?? 1, style: { width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' } }))) : null));
                })));
            }
            if (field.type === 'image_swatch' || field.type === 'product') {
                const thumbStyle = {};
                const hasRadius = field.choiceBorderRadius !== undefined && field.choiceBorderRadius !== null && String(field.choiceBorderRadius).trim() !== '';
                const hasWidth = field.choiceWidth !== undefined && field.choiceWidth !== null && String(field.choiceWidth).trim() !== '';
                const hasHeight = field.choiceHeight !== undefined && field.choiceHeight !== null && String(field.choiceHeight).trim() !== '';
                if (hasWidth)
                    thumbStyle.width = `${field.choiceWidth}px`;
                if (hasHeight)
                    thumbStyle.height = `${field.choiceHeight}px`;
                if (hasRadius)
                    thumbStyle.borderRadius = `${field.choiceBorderRadius}px`;
                return (wp.element.createElement("div", { className: "wof-preview-image-tiles" }, choices.slice(0, 4).map((choice) => {
                    const isSelected = Boolean(choice.default || choice.selected);
                    return (wp.element.createElement("div", { className: `wof-preview-image-tile${isSelected ? ' is-selected' : ''}`, key: choice.uuid, style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                        wp.element.createElement("span", { className: "wof-preview-image-tile__thumb", style: { ...thumbStyle, position: 'relative' } },
                            choice.imageId || choice.imageUrl ? wp.element.createElement(WooOptionsFic.Components.MediaImage, { attachmentId: choice.imageId, src: choice.imageUrl, alt: "" }) : wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "format-image" }),
                            isSelected ? wp.element.createElement("span", { className: "wof-preview-image-tile__check", style: { position: 'absolute', top: '2px', right: '2px', background: '#172033', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', zIndex: 3 } }, renderCheckSvg(10)) : null),
                        wp.element.createElement("small", { style: { minHeight: '1.3em', marginTop: '4px' } }, choice.label),
                        wp.element.createElement("span", { className: "wof-preview-image-tile__price", style: { minHeight: '1.3em' } }, formatChoicePrice(choice.pricing)),
                        field.enableQuantity ? (wp.element.createElement("span", { className: "wof-choice-qty-wrap", style: { marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'center', width: '100%' } },
                            wp.element.createElement("input", { disabled: true, type: "number", className: "wof-choice-qty-input", defaultValue: field.minQuantity ?? 1, style: { width: '52px', height: '26px', fontSize: '12px', textAlign: 'center' } }))) : null));
                })));
            }
            if (field.type === 'repeater')
                return wp.element.createElement("div", { className: "wof-preview-repeater" },
                    wp.element.createElement("div", null,
                        wp.element.createElement("strong", null, "Item 1"),
                        wp.element.createElement("small", null,
                            field.children?.length ?? 0,
                            " fields")),
                    wp.element.createElement("button", { type: "button", disabled: true }, "+ Add item"));
            if (['datetime', 'date', 'time'].includes(field.type)) {
                const mode = field.dateTimeType || (field.type === 'time' ? 'time' : 'date');
                const calendarSvg = (wp.element.createElement("svg", { className: "wof-picker-icon", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                    wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                    wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                    wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                    wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })));
                const clockSvg = (wp.element.createElement("svg", { className: "wof-picker-icon", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                    wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                    wp.element.createElement("polyline", { points: "12 6 12 12 16 14" })));
                const timeExample = field.timeFormat === '24' ? '12:00' : '12:00 PM';
                const dateExample = field.placeholder || (field.dateFormat === 'wp_default' ? 'Jul 30, 2025' : (field.dateFormat || 'DD/MM/YYYY'));
                if (mode === 'date') {
                    return (wp.element.createElement("div", { className: "wof-custom-picker-preview" },
                        wp.element.createElement("div", { className: "wof-custom-picker-input" },
                            calendarSvg,
                            wp.element.createElement("span", { className: "wof-picker-text" }, dateExample))));
                }
                if (mode === 'time') {
                    return (wp.element.createElement("div", { className: "wof-custom-picker-preview" },
                        wp.element.createElement("div", { className: "wof-custom-picker-input" },
                            clockSvg,
                            wp.element.createElement("span", { className: "wof-picker-text" }, field.placeholder || timeExample))));
                }
                return (wp.element.createElement("div", { className: "wof-custom-picker-preview", style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
                    wp.element.createElement("div", { className: "wof-custom-picker-input" },
                        calendarSvg,
                        wp.element.createElement("span", { className: "wof-picker-text" }, dateExample)),
                    wp.element.createElement("div", { className: "wof-custom-picker-input" },
                        clockSvg,
                        wp.element.createElement("span", { className: "wof-picker-text" }, timeExample))));
            }
            if (field.type === 'date_range') {
                const calendarSvg = (wp.element.createElement("svg", { className: "wof-picker-icon", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                    wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                    wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                    wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                    wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })));
                const sampleFormat = field.dateFormat === 'wp_default' ? 'Jul 30, 2025' : (field.dateFormat || 'DD/MM/YYYY');
                const startPlaceholder = field.placeholder || sampleFormat;
                const endPlaceholder = sampleFormat;
                return (wp.element.createElement("div", { className: "wof-custom-daterange-preview", style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                    wp.element.createElement("div", { className: "wof-custom-picker-input", style: { flex: 1 } },
                        calendarSvg,
                        wp.element.createElement("span", { className: "wof-picker-text" }, startPlaceholder)),
                    wp.element.createElement("span", { className: "wof-custom-daterange-preview__sep", style: { color: '#94a3b8', fontSize: '13px', fontWeight: 600 } }, "\u2192"),
                    wp.element.createElement("div", { className: "wof-custom-picker-input", style: { flex: 1 } },
                        calendarSvg,
                        wp.element.createElement("span", { className: "wof-picker-text" }, endPlaceholder))));
            }
            const inputType = {
                password: 'password', tel: 'tel', email: 'email', url: 'url', number: 'number', quantity: 'number', customer_defined_price: 'number',
            };
            const isNum = field.type === 'number';
            const defaultValue = field.default != null && field.default !== '' ? String(field.default) : undefined;
            return (wp.element.createElement("input", { disabled: true, type: inputType[field.type] ?? 'text', value: defaultValue, min: isNum && field.enableMinMax !== false && field.min != null ? String(field.min) : undefined, max: isNum && field.enableMinMax !== false && field.max != null ? String(field.max) : undefined, step: isNum && field.step != null ? String(field.step) : undefined, style: {
                    textTransform: field.textTransform && field.textTransform !== 'none' ? field.textTransform : undefined,
                }, placeholder: defaultValue !== undefined ? undefined : (field.placeholder || __('Enter value…', 'wooptionsfic')) }));
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
            const width = props.field.width || '100%';
            const widthStyle = {
                width: width === '33%' ? 'calc(33.333% - 8px)' : width === '50%' ? 'calc(50% - 8px)' : width === '66%' ? 'calc(66.666% - 8px)' : '100%',
                flex: width === '33%' ? '0 0 calc(33.333% - 8px)' : width === '50%' ? '0 0 calc(50% - 8px)' : width === '66%' ? '0 0 calc(66.666% - 8px)' : '0 0 100%',
                boxSizing: 'border-box',
            };
            const typeLabel = window.WooOptionsFicAdmin?.fieldTypes?.[props.field.type]?.label ?? props.field.type;
            return wp.element.createElement("article", { className: WooOptionsFic.Utils.classNames('wof-canvas-field', props.selected && 'is-selected', props.field.disabled && 'is-disabled', dropEdge === 'before' && 'is-drop-before', dropEdge === 'after' && 'is-drop-after', `wof-canvas-field--width-${width.replace('%', '')}`), style: widthStyle, onDragOver: dragOver, onDragLeave: dragLeave, onDrop: drop, onClick: props.onSelect, "data-field-uuid": props.field.uuid },
                props.selected ? (wp.element.createElement("span", { className: "wof-canvas-field__type-badge" }, typeLabel)) : null,
                wp.element.createElement("div", { className: "wof-canvas-field__toolbar", onClick: (event) => event.stopPropagation() },
                    wp.element.createElement("button", { type: "button", draggable: true, className: "wof-canvas-field__drag-handle", onDragStart: dragStart, onDragEnd: () => setDropEdge(null), "aria-label": __('Drag field', 'wooptionsfic'), title: __('Drag to reorder', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.GripIcon, null)),
                    wp.element.createElement("button", { type: "button", onClick: props.onSelect, "aria-label": __('Field settings', 'wooptionsfic'), title: __('Settings', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-generic" })),
                    wp.element.createElement("button", { type: "button", onClick: props.onDuplicate, "aria-label": __('Duplicate field', 'wooptionsfic'), title: __('Duplicate', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "admin-page" })),
                    wp.element.createElement("button", { type: "button", className: "is-destructive", onClick: props.onDelete, "aria-label": __('Delete field', 'wooptionsfic'), title: __('Delete', 'wooptionsfic') },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "trash" }))),
                wp.element.createElement("div", { className: "wof-canvas-field__copy" },
                    wp.element.createElement("strong", { className: "wof-canvas-field__title" },
                        props.field.label || __('Untitled field', 'wooptionsfic'),
                        props.field.help && props.field.helpTextPosition === 'tooltip' ? (wp.element.createElement("span", { className: "wof-field__tooltip-preview", title: props.field.help },
                            wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                                wp.element.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }),
                                wp.element.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })))) : null),
                    props.field.required ? wp.element.createElement("span", { className: "wof-canvas-field__required" }, __('REQUIRED', 'wooptionsfic')) : null,
                    props.field.help && (props.field.helpTextPosition === 'below_title' || !props.field.helpTextPosition) ? (wp.element.createElement("p", { className: "wof-canvas-field__help-text wof-canvas-field__help-text--below-title" }, props.field.help)) : null,
                    props.field.choices?.length ? (wp.element.createElement("small", { className: "wof-canvas-field__meta" },
                        props.field.choices.length,
                        " ",
                        __('Choices', 'wooptionsfic'))) : null),
                wp.element.createElement("div", { className: "wof-canvas-field__preview" },
                    wp.element.createElement(Builder.FieldPreview, { field: props.field })),
                props.field.help && props.field.helpTextPosition === 'below_field' ? (wp.element.createElement("p", { className: "wof-canvas-field__help-text wof-canvas-field__help-text--below-field" }, props.field.help)) : null);
        }
        function Canvas(props) {
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
            return wp.element.createElement("section", { className: WooOptionsFic.Utils.classNames('wof-builder-canvas', 'is-edit-mode', dragActive && 'is-drag-active') },
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
                            __('Interactive', 'wooptionsfic')))),
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
                                        wp.element.createElement("h1", null, __('WooOptionsFic Product (Preview)', 'wooptionsfic')),
                                        wp.element.createElement("strong", { className: "wof-product-preview-meta__price" }, `20.00 ${window.WooOptionsFicAdmin?.currency || 'USD'}`)),
                                    props.document.fields.length ? wp.element.createElement("div", { className: `wof-canvas-fields is-${props.document.layout.type}`, style: { display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' } },
                                        props.document.fields.map((field, index) => wp.element.createElement(CanvasField, { key: field.uuid, field: field, index: index, count: props.document.fields.length, selected: field.uuid === props.selectedUuid, onSelect: () => props.onSelect(field.uuid), onAdd: props.onAdd, onMove: props.onMove, onDuplicate: () => props.onDuplicate(field), onDelete: () => props.onDelete(field.uuid) })),
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
        const COUNTRY_OPTIONS = [
            { label: 'United States (+1)', value: 'US' },
            { label: 'United Kingdom (+44)', value: 'GB' },
            { label: 'Canada (+1)', value: 'CA' },
            { label: 'Australia (+61)', value: 'AU' },
            { label: 'Germany (+49)', value: 'DE' },
            { label: 'France (+33)', value: 'FR' },
            { label: 'Italy (+39)', value: 'IT' },
            { label: 'Spain (+34)', value: 'ES' },
            { label: 'Netherlands (+31)', value: 'NL' },
            { label: 'Brazil (+55)', value: 'BR' },
            { label: 'India (+91)', value: 'IN' },
            { label: 'China (+86)', value: 'CN' },
            { label: 'Japan (+81)', value: 'JP' },
            { label: 'South Korea (+82)', value: 'KR' },
            { label: 'Mexico (+52)', value: 'MX' },
            { label: 'United Arab Emirates (+971)', value: 'AE' },
            { label: 'Saudi Arabia (+966)', value: 'SA' },
            { label: 'Singapore (+65)', value: 'SG' },
            { label: 'Bangladesh (+880)', value: 'BD' },
            { label: 'Pakistan (+92)', value: 'PK' },
            { label: 'South Africa (+27)', value: 'ZA' },
            { label: 'Turkey (+90)', value: 'TR' },
            { label: 'Sweden (+46)', value: 'SE' },
            { label: 'Switzerland (+41)', value: 'CH' },
            { label: 'Poland (+48)', value: 'PL' },
            { label: 'Argentina (+54)', value: 'AR' },
            { label: 'Belgium (+32)', value: 'BE' },
            { label: 'Austria (+43)', value: 'AT' },
            { label: 'Norway (+47)', value: 'NO' },
            { label: 'Denmark (+45)', value: 'DK' },
            { label: 'Finland (+358)', value: 'FI' },
            { label: 'Ireland (+353)', value: 'IE' },
            { label: 'New Zealand (+64)', value: 'NZ' },
            { label: 'Portugal (+351)', value: 'PT' },
            { label: 'Greece (+30)', value: 'GR' },
            { label: 'Israel (+972)', value: 'IL' },
            { label: 'Hong Kong (+852)', value: 'HK' },
            { label: 'Malaysia (+60)', value: 'MY' },
            { label: 'Philippines (+63)', value: 'PH' },
            { label: 'Indonesia (+62)', value: 'ID' },
            { label: 'Thailand (+66)', value: 'TH' },
            { label: 'Vietnam (+84)', value: 'VN' },
            { label: 'Egypt (+20)', value: 'EG' },
            { label: 'Nigeria (+234)', value: 'NG' },
            { label: 'Kenya (+254)', value: 'KE' },
        ];
        const DATE_FORMAT_OPTIONS = [
            { label: 'MMM DD, YYYY ( Jul 30, 2025 )', value: 'MMM DD, YYYY' },
            { label: 'WordPress Default Date Format', value: 'wp_default' },
            { label: 'DD/MM/YYYY ( 30/07/2025 )', value: 'DD/MM/YYYY' },
            { label: 'MM/DD/YYYY ( 07/30/2025 )', value: 'MM/DD/YYYY' },
            { label: 'YYYY-MM-DD ( 2025-07-30 )', value: 'YYYY-MM-DD' },
            { label: 'DD MMMM, YYYY ( 30 July, 2025 )', value: 'DD MMMM, YYYY' },
            { label: 'D.MM.YYYY ( 30.07.2026 )', value: 'D.MM.YYYY' },
        ];
        const WEEKDAY_OPTIONS = [
            { label: __('Sunday', 'wooptionsfic'), value: 0 },
            { label: __('Monday', 'wooptionsfic'), value: 1 },
            { label: __('Tuesday', 'wooptionsfic'), value: 2 },
            { label: __('Wednesday', 'wooptionsfic'), value: 3 },
            { label: __('Thursday', 'wooptionsfic'), value: 4 },
            { label: __('Friday', 'wooptionsfic'), value: 5 },
            { label: __('Saturday', 'wooptionsfic'), value: 6 },
        ];
        const MONTHLY_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
            label: `${__('Day', 'wooptionsfic')} ${i + 1}`,
            value: i + 1,
        }));
        function DatePickerPopup(props) {
            const containerRef = useRef(null);
            const initialDate = useMemo(() => {
                if (props.value && /^\d{4}-\d{2}-\d{2}$/.test(props.value)) {
                    const parts = props.value.split('-').map(Number);
                    return new Date(parts[0], parts[1] - 1, parts[2]);
                }
                return new Date();
            }, [props.value]);
            const [year, setYear] = useState(initialDate.getFullYear());
            const [month, setMonth] = useState(initialDate.getMonth());
            useEffect(() => {
                const handleDown = (e) => {
                    if (containerRef.current && !containerRef.current.contains(e.target)) {
                        props.onClose();
                    }
                };
                document.addEventListener('mousedown', handleDown);
                return () => document.removeEventListener('mousedown', handleDown);
            }, [props.onClose]);
            const prevMonth = (e) => {
                e.stopPropagation();
                if (month === 0) {
                    setMonth(11);
                    setYear((y) => y - 1);
                }
                else {
                    setMonth((m) => m - 1);
                }
            };
            const nextMonth = (e) => {
                e.stopPropagation();
                if (month === 11) {
                    setMonth(0);
                    setYear((y) => y + 1);
                }
                else {
                    setMonth((m) => m + 1);
                }
            };
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            const firstDayOfWeek = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            const prevMonthDays = new Date(year, month, 0).getDate();
            for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                const d = prevMonthDays - i;
                const prevM = month === 0 ? 11 : month - 1;
                const prevY = month === 0 ? year - 1 : year;
                const mStr = String(prevM + 1).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                cells.push({ day: d, isCurrentMonth: false, dateStr: `${prevY}-${mStr}-${dStr}` });
            }
            for (let d = 1; d <= daysInMonth; d++) {
                const mStr = String(month + 1).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                cells.push({ day: d, isCurrentMonth: true, dateStr: `${year}-${mStr}-${dStr}` });
            }
            const remaining = 7 - (cells.length % 7);
            if (remaining < 7) {
                for (let d = 1; d <= remaining; d++) {
                    const nextM = month === 11 ? 0 : month + 1;
                    const nextY = month === 11 ? year + 1 : year;
                    const mStr = String(nextM + 1).padStart(2, '0');
                    const dStr = String(d).padStart(2, '0');
                    cells.push({ day: d, isCurrentMonth: false, dateStr: `${nextY}-${mStr}-${dStr}` });
                }
            }
            return (wp.element.createElement("div", { className: "wof-datepicker-popover", ref: containerRef },
                wp.element.createElement("div", { className: "wof-cal-pop-header" },
                    wp.element.createElement("button", { type: "button", className: "wof-cal-nav-btn", onClick: prevMonth, "aria-label": __('Previous month', 'wooptionsfic') }, "\u2039"),
                    wp.element.createElement("span", { className: "wof-cal-pop-title" },
                        monthNames[month],
                        " ",
                        year),
                    wp.element.createElement("button", { type: "button", className: "wof-cal-nav-btn", onClick: nextMonth, "aria-label": __('Next month', 'wooptionsfic') }, "\u203A")),
                wp.element.createElement("div", { className: "wof-cal-pop-weekdays" }, weekDays.map((wd) => (wp.element.createElement("span", { key: wd }, wd)))),
                wp.element.createElement("div", { className: "wof-cal-pop-days" }, cells.map((cell, idx) => {
                    const isSelected = props.value === cell.dateStr;
                    return (wp.element.createElement("button", { type: "button", key: idx, className: WooOptionsFic.Utils.classNames('wof-cal-pop-day', !cell.isCurrentMonth && 'is-other-month', isSelected && 'is-selected'), onClick: (e) => {
                            e.stopPropagation();
                            props.onSelect(cell.dateStr);
                        } }, cell.day));
                }))));
        }
        function DatePickerField(props) {
            const [isOpen, setIsOpen] = useState(false);
            return (wp.element.createElement("div", { className: "wof-datepicker-field-wrap" },
                wp.element.createElement("button", { type: "button", className: WooOptionsFic.Utils.classNames('wof-datepicker-field-trigger', isOpen && 'is-open'), onClick: () => setIsOpen(!isOpen) },
                    wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                        wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                        wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                        wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
                    wp.element.createElement("span", { className: WooOptionsFic.Utils.classNames('wof-datepicker-field-val', !props.value && 'is-placeholder') }, props.value || props.placeholder || __('Select date...', 'wooptionsfic')),
                    props.value ? (wp.element.createElement("span", { role: "button", tabIndex: 0, className: "wof-datepicker-field-clear", title: __('Clear date', 'wooptionsfic'), onClick: (e) => {
                            e.stopPropagation();
                            props.onChange('');
                        } }, "\u00D7")) : null),
                isOpen ? (wp.element.createElement(DatePickerPopup, { value: props.value, onSelect: (val) => {
                        props.onChange(val);
                        setIsOpen(false);
                    }, onClose: () => setIsOpen(false) })) : null));
        }
        function MultiSelectDropdown(props) {
            const [isOpen, setIsOpen] = useState(false);
            const containerRef = useRef(null);
            useEffect(() => {
                const handleDown = (e) => {
                    if (containerRef.current && !containerRef.current.contains(e.target)) {
                        setIsOpen(false);
                    }
                };
                document.addEventListener('mousedown', handleDown);
                return () => document.removeEventListener('mousedown', handleDown);
            }, []);
            const selectedLabels = useMemo(() => {
                return props.options
                    .filter((opt) => props.selectedValues.includes(opt.value))
                    .map((opt) => opt.label);
            }, [props.options, props.selectedValues]);
            const displayText = useMemo(() => {
                if (selectedLabels.length === 0)
                    return '';
                if (selectedLabels.length <= 3)
                    return selectedLabels.join(', ');
                return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
            }, [selectedLabels]);
            const toggleOption = (optVal) => {
                if (props.selectedValues.includes(optVal)) {
                    props.onChange(props.selectedValues.filter((v) => v !== optVal));
                }
                else {
                    props.onChange([...props.selectedValues, optVal]);
                }
            };
            const selectAll = () => {
                props.onChange(props.options.map((o) => o.value));
            };
            const clearAll = () => {
                props.onChange([]);
            };
            return (wp.element.createElement("div", { className: "wof-multiselect-container", ref: containerRef },
                wp.element.createElement("button", { type: "button", className: WooOptionsFic.Utils.classNames('wof-multiselect-trigger', isOpen && 'is-open'), onClick: () => setIsOpen(!isOpen), "aria-haspopup": "listbox", "aria-expanded": isOpen },
                    wp.element.createElement("span", { className: WooOptionsFic.Utils.classNames('wof-multiselect-display', !displayText && 'is-placeholder') }, displayText || props.placeholder),
                    wp.element.createElement("svg", { className: WooOptionsFic.Utils.classNames('wof-multiselect-chevron', isOpen && 'is-open'), width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("polyline", { points: "6 9 12 15 18 9" }))),
                isOpen ? (wp.element.createElement("div", { className: "wof-multiselect-dropdown" },
                    wp.element.createElement("div", { className: "wof-multiselect-header" },
                        wp.element.createElement("button", { type: "button", className: "wof-multiselect-link-btn", onClick: selectAll }, __('Select All', 'wooptionsfic')),
                        wp.element.createElement("button", { type: "button", className: "wof-multiselect-link-btn", onClick: clearAll }, __('Clear', 'wooptionsfic'))),
                    wp.element.createElement("div", { className: "wof-multiselect-options", role: "listbox" }, props.options.map((opt) => {
                        const isChecked = props.selectedValues.includes(opt.value);
                        return (wp.element.createElement("label", { key: opt.value, className: WooOptionsFic.Utils.classNames('wof-multiselect-item', isChecked && 'is-checked') },
                            wp.element.createElement("input", { type: "checkbox", checked: isChecked, onChange: () => toggleOption(opt.value) }),
                            wp.element.createElement("span", null, opt.label)));
                    })))) : null));
        }
        function DateFieldInspector(props) {
            const { field, update } = props;
            const [showAddDatePicker, setShowAddDatePicker] = useState(false);
            return (wp.element.createElement("div", { className: "wof-datetime-settings-wrap" },
                wp.element.createElement("div", { className: "wof-field-width-setting wof-datetime-type-setting" },
                    wp.element.createElement("span", { className: "wof-field-width-label" }, __('Type', 'wooptionsfic')),
                    wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Type', 'wooptionsfic') }, [
                        { label: __('Date', 'wooptionsfic'), value: 'date' },
                        { label: __('Date & Time', 'wooptionsfic'), value: 'datetime' },
                        { label: __('Time', 'wooptionsfic'), value: 'time' },
                    ].map((t) => {
                        const isSelected = (field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) === t.value;
                        return (wp.element.createElement("button", { type: "button", key: t.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ dateTimeType: t.value }) }, t.label));
                    }))),
                (field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) !== 'time' ? (wp.element.createElement("div", { className: "wof-datetime-box" },
                    wp.element.createElement(SelectControl, { label: __('Date Format', 'wooptionsfic'), value: field.dateFormat ?? 'DD/MM/YYYY', options: DATE_FORMAT_OPTIONS, onChange: (dateFormat) => update({ dateFormat }) }),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Min Date', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Min Date', 'wooptionsfic') }, [
                                { label: __('None', 'wooptionsfic'), value: 'none' },
                                { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                                { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                            ].map((m) => {
                                const isSelected = (field.minDateType || 'none') === m.value;
                                return (wp.element.createElement("button", { type: "button", key: m.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ minDateType: m.value }) }, m.label));
                            }))),
                        field.minDateType === 'custom' ? (wp.element.createElement("div", { style: { marginTop: '8px' } },
                            wp.element.createElement(DatePickerField, { value: field.minDateCustom ?? '', placeholder: __('Select min date...', 'wooptionsfic'), onChange: (minDateCustom) => update({ minDateCustom }) }))) : null),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Max Date', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Max Date', 'wooptionsfic') }, [
                                { label: __('None', 'wooptionsfic'), value: 'none' },
                                { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                                { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                            ].map((m) => {
                                const isSelected = (field.maxDateType || 'none') === m.value;
                                return (wp.element.createElement("button", { type: "button", key: m.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ maxDateType: m.value }) }, m.label));
                            }))),
                        field.maxDateType === 'custom' ? (wp.element.createElement("div", { style: { marginTop: '8px' } },
                            wp.element.createElement(DatePickerField, { value: field.maxDateCustom ?? '', placeholder: __('Select max date...', 'wooptionsfic'), onChange: (maxDateCustom) => update({ maxDateCustom }) }))) : null),
                    wp.element.createElement(ToggleControl, { label: __('Disable Today', 'wooptionsfic'), checked: Boolean(field.disableToday), onChange: (disableToday) => update({ disableToday }) }),
                    wp.element.createElement(TextControl, { label: __('Disable Next N Days', 'wooptionsfic'), type: "number", min: 0, value: String(field.disableNextNDays ?? 0), help: __('Disable N days after today (e.g. 3 disables tomorrow, day after tomorrow, and one more)', 'wooptionsfic'), onChange: (val) => update({ disableNextNDays: Math.max(0, parseInt(val, 10) || 0) }) }),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label", style: { marginBottom: '8px' } }, __('Disable Specific Dates', 'wooptionsfic')),
                        wp.element.createElement("div", { style: { position: 'relative', display: 'inline-block' } },
                            wp.element.createElement("button", { type: "button", className: "wof-btn-add-date", onClick: () => setShowAddDatePicker(!showAddDatePicker) },
                                wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                                    wp.element.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })),
                                __('Add Date', 'wooptionsfic')),
                            showAddDatePicker ? (wp.element.createElement(DatePickerPopup, { onSelect: (dateStr) => {
                                    const current = Array.isArray(field.disabledDates) ? [...field.disabledDates] : [];
                                    if (!current.includes(dateStr)) {
                                        update({ disabledDates: [...current, dateStr] });
                                    }
                                    setShowAddDatePicker(false);
                                }, onClose: () => setShowAddDatePicker(false) })) : null),
                        Array.isArray(field.disabledDates) && field.disabledDates.length > 0 ? (wp.element.createElement("div", { className: "wof-disabled-dates-list" }, field.disabledDates.map((dateVal, idx) => (wp.element.createElement("div", { key: idx, className: "wof-disabled-date-item" },
                            wp.element.createElement("div", { className: "wof-disabled-date-badge" },
                                wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                                    wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                                    wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                                    wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
                                wp.element.createElement("span", null, dateVal)),
                            wp.element.createElement("button", { type: "button", className: "wof-disabled-date-delete-btn", title: __('Remove date', 'wooptionsfic'), onClick: () => {
                                    const next = [...(field.disabledDates ?? [])];
                                    next.splice(idx, 1);
                                    update({ disabledDates: next });
                                } },
                                wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                                    wp.element.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })))))))) : null),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Disable Weekdays', 'wooptionsfic')),
                        wp.element.createElement(MultiSelectDropdown, { placeholder: __('Select weekdays to disable...', 'wooptionsfic'), options: WEEKDAY_OPTIONS, selectedValues: Array.isArray(field.disabledWeekdays) ? field.disabledWeekdays : [], onChange: (selected) => update({ disabledWeekdays: selected.map(Number) }) })),
                    wp.element.createElement("div", { style: { marginBottom: '4px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Disable Monthly Days', 'wooptionsfic')),
                        wp.element.createElement(MultiSelectDropdown, { placeholder: __('Select monthly days to disable...', 'wooptionsfic'), options: MONTHLY_DAY_OPTIONS, selectedValues: String(field.disabledMonthlyDays || '')
                                .split(',')
                                .map((s) => parseInt(s.trim(), 10))
                                .filter((n) => !isNaN(n)), onChange: (selected) => {
                                const sorted = [...selected].map(Number).sort((a, b) => a - b);
                                update({ disabledMonthlyDays: sorted.join(', ') });
                            } })))) : null,
                (field.dateTimeType || (field.type === 'time' ? 'time' : 'date')) !== 'date' ? (wp.element.createElement("div", { className: "wof-datetime-box" },
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Time Range (Min)', 'wooptionsfic')),
                        renderTimeInput(field.minTime || '12:00 AM', field.timeFormat || '12', (val) => update({ minTime: val }))),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Time Range (Max)', 'wooptionsfic')),
                        renderTimeInput(field.maxTime || '12:00 PM', field.timeFormat || '12', (val) => update({ maxTime: val }))),
                    wp.element.createElement("div", null,
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Time Format', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Time Format', 'wooptionsfic') }, [
                                { label: __('12 Hours', 'wooptionsfic'), value: '12' },
                                { label: __('24 Hours', 'wooptionsfic'), value: '24' },
                            ].map((fmt) => {
                                const isSelected = (field.timeFormat || '12') === fmt.value;
                                return (wp.element.createElement("button", { type: "button", key: fmt.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ timeFormat: fmt.value }) }, fmt.label));
                            })))))) : null));
        }
        function DateRangeFieldInspector(props) {
            const { field, update } = props;
            const [showAddDatePicker, setShowAddDatePicker] = useState(false);
            return (wp.element.createElement("div", { className: "wof-datetime-settings-wrap" },
                wp.element.createElement("div", { className: "wof-datetime-box" },
                    wp.element.createElement(SelectControl, { label: __('Date Format', 'wooptionsfic'), value: field.dateFormat ?? 'DD/MM/YYYY', options: DATE_FORMAT_OPTIONS, onChange: (dateFormat) => update({ dateFormat }) }),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Min Date', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Min Date', 'wooptionsfic') }, [
                                { label: __('None', 'wooptionsfic'), value: 'none' },
                                { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                                { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                            ].map((m) => {
                                const isSelected = (field.minDateType || 'none') === m.value;
                                return (wp.element.createElement("button", { type: "button", key: m.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ minDateType: m.value }) }, m.label));
                            }))),
                        field.minDateType === 'custom' ? (wp.element.createElement("div", { style: { marginTop: '8px' } },
                            wp.element.createElement(DatePickerField, { value: field.minDateCustom ?? '', placeholder: __('Select min date...', 'wooptionsfic'), onChange: (minDateCustom) => update({ minDateCustom }) }))) : null),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Max Date', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Max Date', 'wooptionsfic') }, [
                                { label: __('None', 'wooptionsfic'), value: 'none' },
                                { label: __('Current Day', 'wooptionsfic'), value: 'current_day' },
                                { label: __('Custom', 'wooptionsfic'), value: 'custom' },
                            ].map((m) => {
                                const isSelected = (field.maxDateType || 'none') === m.value;
                                return (wp.element.createElement("button", { type: "button", key: m.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ maxDateType: m.value }) }, m.label));
                            }))),
                        field.maxDateType === 'custom' ? (wp.element.createElement("div", { style: { marginTop: '8px' } },
                            wp.element.createElement(DatePickerField, { value: field.maxDateCustom ?? '', placeholder: __('Select max date...', 'wooptionsfic'), onChange: (maxDateCustom) => update({ maxDateCustom }) }))) : null),
                    wp.element.createElement(ToggleControl, { label: __('Disable Today', 'wooptionsfic'), checked: Boolean(field.disableToday), onChange: (disableToday) => update({ disableToday }) }),
                    wp.element.createElement(TextControl, { label: __('Disable Next N Days', 'wooptionsfic'), type: "number", min: 0, value: String(field.disableNextNDays ?? 0), help: __('Disable N days after today (e.g. 3 disables tomorrow, day after tomorrow, and one more)', 'wooptionsfic'), onChange: (val) => update({ disableNextNDays: Math.max(0, parseInt(val, 10) || 0) }) }),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label", style: { marginBottom: '8px' } }, __('Disable Specific Dates', 'wooptionsfic')),
                        wp.element.createElement("div", { style: { position: 'relative', display: 'inline-block' } },
                            wp.element.createElement("button", { type: "button", className: "wof-btn-add-date", onClick: () => setShowAddDatePicker(!showAddDatePicker) },
                                wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                                    wp.element.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })),
                                __('Add Date', 'wooptionsfic')),
                            showAddDatePicker ? (wp.element.createElement(DatePickerPopup, { onSelect: (dateStr) => {
                                    const current = Array.isArray(field.disabledDates) ? [...field.disabledDates] : [];
                                    if (!current.includes(dateStr)) {
                                        update({ disabledDates: [...current, dateStr] });
                                    }
                                    setShowAddDatePicker(false);
                                }, onClose: () => setShowAddDatePicker(false) })) : null),
                        Array.isArray(field.disabledDates) && field.disabledDates.length > 0 ? (wp.element.createElement("div", { className: "wof-disabled-dates-list" }, field.disabledDates.map((dateVal, idx) => (wp.element.createElement("div", { key: idx, className: "wof-disabled-date-item" },
                            wp.element.createElement("div", { className: "wof-disabled-date-badge" },
                                wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
                                    wp.element.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                                    wp.element.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                                    wp.element.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" })),
                                wp.element.createElement("span", null, dateVal)),
                            wp.element.createElement("button", { type: "button", className: "wof-disabled-date-delete-btn", title: __('Remove date', 'wooptionsfic'), onClick: () => {
                                    const next = [...(field.disabledDates ?? [])];
                                    next.splice(idx, 1);
                                    update({ disabledDates: next });
                                } },
                                wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                                    wp.element.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })))))))) : null),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Disable Weekdays', 'wooptionsfic')),
                        wp.element.createElement(MultiSelectDropdown, { placeholder: __('Select weekdays to disable...', 'wooptionsfic'), options: WEEKDAY_OPTIONS, selectedValues: Array.isArray(field.disabledWeekdays) ? field.disabledWeekdays : [], onChange: (selected) => update({ disabledWeekdays: selected.map(Number) }) })),
                    wp.element.createElement("div", { style: { marginBottom: '14px' } },
                        wp.element.createElement("span", { className: "wof-datetime-label" }, __('Disable Monthly Days', 'wooptionsfic')),
                        wp.element.createElement(MultiSelectDropdown, { placeholder: __('Select monthly days to disable...', 'wooptionsfic'), options: MONTHLY_DAY_OPTIONS, selectedValues: String(field.disabledMonthlyDays || '')
                                .split(',')
                                .map((s) => parseInt(s.trim(), 10))
                                .filter((n) => !isNaN(n)), onChange: (selected) => {
                                const sorted = [...selected].map(Number).sort((a, b) => a - b);
                                update({ disabledMonthlyDays: sorted.join(', ') });
                            } })),
                    wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' } },
                        wp.element.createElement(TextControl, { label: __('Min Days', 'wooptionsfic'), type: "number", min: 0, value: String(field.minDays ?? 0), help: __('Min duration (0 for none)', 'wooptionsfic'), onChange: (val) => update({ minDays: Math.max(0, parseInt(val, 10) || 0) }) }),
                        wp.element.createElement(TextControl, { label: __('Max Days', 'wooptionsfic'), type: "number", min: 0, value: String(field.maxDays ?? 0), help: __('Max duration (0 for none)', 'wooptionsfic'), onChange: (val) => update({ maxDays: Math.max(0, parseInt(val, 10) || 0) }) })),
                    wp.element.createElement(ToggleControl, { label: __('Allow Same Day Selection', 'wooptionsfic'), help: __('Allow start and end date to be on the same day', 'wooptionsfic'), checked: field.allowSameDay !== false, onChange: (allowSameDay) => update({ allowSameDay }) }))));
        }
        function renderTimeInput(value, format, onChange) {
            const is12 = format === '12';
            const match = (value || '').match(/(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i);
            let hours = match ? match[1].padStart(2, '0') : '12';
            let minutes = match ? match[2].padStart(2, '0') : '00';
            let meridiem = (match && match[3] ? match[3].toUpperCase() : 'AM');
            const commit = (h, m, mer) => {
                onChange(is12 ? `${h}:${m} ${mer}` : `${h}:${m}`);
            };
            return (wp.element.createElement("div", { className: "wof-time-input-group" },
                wp.element.createElement("div", { className: "wof-time-spinner-box" },
                    wp.element.createElement("input", { type: "text", maxLength: 2, value: hours, "aria-label": __('Hours', 'wooptionsfic'), onChange: (e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                            commit(v.padStart(2, '0'), minutes, meridiem);
                        } }),
                    wp.element.createElement("span", { className: "wof-time-colon" }, ":"),
                    wp.element.createElement("input", { type: "text", maxLength: 2, value: minutes, "aria-label": __('Minutes', 'wooptionsfic'), onChange: (e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                            commit(hours, v.padStart(2, '0'), meridiem);
                        } })),
                is12 ? (wp.element.createElement("div", { className: "wof-meridiem-group" },
                    wp.element.createElement("button", { type: "button", className: WooOptionsFic.Utils.classNames('wof-meridiem-btn', meridiem === 'AM' && 'is-active'), onClick: () => commit(hours, minutes, 'AM') }, "AM"),
                    wp.element.createElement("button", { type: "button", className: WooOptionsFic.Utils.classNames('wof-meridiem-btn', meridiem === 'PM' && 'is-active'), onClick: () => commit(hours, minutes, 'PM') }, "PM"))) : null));
        }
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
                props.field.type === 'segmented' ? (wp.element.createElement("div", { className: "wof-field-width-setting" },
                    wp.element.createElement("span", { className: "wof-field-width-label" }, __('Display Direction', 'wooptionsfic')),
                    wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Display Direction', 'wooptionsfic') }, ['vertical', 'horizontal'].map((dir) => {
                        const isSelected = (props.field.displayDirection || 'horizontal') === dir;
                        return (wp.element.createElement("button", { type: "button", key: dir, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => props.onChange({ ...props.field, displayDirection: dir }) }, dir === 'horizontal' ? __('Horizontal', 'wooptionsfic') : __('Vertical', 'wooptionsfic')));
                    })))) : null,
                ['radio', 'checkbox_group'].includes(props.field.type) ? (wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' } },
                    wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                        wp.element.createElement("span", { className: "wof-field-width-label" }, __('Columns', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Columns', 'wooptionsfic') }, [
                            { label: __('One', 'wooptionsfic'), value: 'one' },
                            { label: __('Two', 'wooptionsfic'), value: 'two' },
                        ].map((col) => {
                            const isSelected = (props.field.columns || 'one') === col.value;
                            return (wp.element.createElement("button", { type: "button", key: col.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => props.onChange({ ...props.field, columns: col.value }) }, col.label));
                        }))),
                    wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                        wp.element.createElement("span", { className: "wof-field-width-label" }, __('Image Style', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Image Style', 'wooptionsfic') }, [
                            { label: __('Normal', 'wooptionsfic'), value: 'normal' },
                            { label: __('Circle', 'wooptionsfic'), value: 'circle' },
                        ].map((st) => {
                            const isSelected = (props.field.imageStyle || 'normal') === st.value;
                            return (wp.element.createElement("button", { type: "button", key: st.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => props.onChange({ ...props.field, imageStyle: st.value }) }, st.label));
                        }))))) : props.field.type === 'select' ? (wp.element.createElement("div", { style: { marginBottom: '18px' } },
                    wp.element.createElement("div", { className: "wof-field-width-setting", style: { marginBottom: 0 } },
                        wp.element.createElement("span", { className: "wof-field-width-label" }, __('Image Style', 'wooptionsfic')),
                        wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Image Style', 'wooptionsfic') }, [
                            { label: __('Normal', 'wooptionsfic'), value: 'normal' },
                            { label: __('Circle', 'wooptionsfic'), value: 'circle' },
                        ].map((st) => {
                            const isSelected = (props.field.imageStyle || 'normal') === st.value;
                            return (wp.element.createElement("button", { type: "button", key: st.value, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => props.onChange({ ...props.field, imageStyle: st.value }) }, st.label));
                        }))))) : null,
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
                    ['image_swatch', 'product', 'radio', 'checkbox_group', 'segmented', 'select'].includes(props.field.type) ? (wp.element.createElement(ChoiceMediaControl, { choice: choice, required: props.field.type === 'image_swatch', onChange: (patch) => updateChoice(choice.uuid, patch) })) : null,
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
                        wp.element.createElement("button", { type: "button", onClick: props.onDuplicate, "aria-label": __('Duplicate field', 'wooptionsfic'), title: __('Duplicate', 'wooptionsfic') },
                            wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                wp.element.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                                wp.element.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }))),
                        wp.element.createElement("button", { type: "button", className: "is-destructive", onClick: props.onDelete, "aria-label": __('Delete field', 'wooptionsfic'), title: __('Delete', 'wooptionsfic') },
                            wp.element.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                wp.element.createElement("polyline", { points: "3 6 5 6 21 6" }),
                                wp.element.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
                                wp.element.createElement("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
                                wp.element.createElement("line", { x1: "14", y1: "11", x2: "14", y2: "17" }))))),
                wp.element.createElement("div", { className: "wof-inspector-tabs-shell" },
                    canLeft ? wp.element.createElement("button", { type: "button", className: "wof-inspector-tabs-arrow is-left", onClick: () => scrollerRef.current?.scrollBy({ left: -180, behavior: 'smooth' }) },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-left-alt2" })) : null,
                    wp.element.createElement("div", { className: "wof-inspector-tabs", ref: scrollerRef }, visibleTabs.map(([tab, label]) => (wp.element.createElement("button", { type: "button", key: tab, className: props.tab === tab ? 'is-active' : '', onClick: (event) => {
                            props.onTabChange(tab);
                            event.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        } }, label)))),
                    canRight ? wp.element.createElement("button", { type: "button", className: "wof-inspector-tabs-arrow is-right", onClick: () => scrollerRef.current?.scrollBy({ left: 180, behavior: 'smooth' }) },
                        wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "arrow-right-alt2" })) : null),
                wp.element.createElement("div", { className: "wof-inspector-body" },
                    wp.element.createElement("section", { className: "wof-inspector-section" }, props.tab === 'content' ? (wp.element.createElement(wp.element.Fragment, null,
                        wp.element.createElement(TextControl, { label: __('Label', 'wooptionsfic'), value: field.label, onChange: (label) => update({ label }) }),
                        ['paragraph', 'help'].includes(field.type) ? (wp.element.createElement(TextareaControl, { label: __('Content', 'wooptionsfic'), value: field.description || field.help, onChange: (content) => update({ description: content, help: content }) })) : null,
                        wp.element.createElement("div", { className: "wof-field-width-setting" },
                            wp.element.createElement("span", { className: "wof-field-width-label" }, __('Width', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-field-width-group", role: "radiogroup", "aria-label": __('Width', 'wooptionsfic') }, ['33%', '50%', '66%', '100%'].map((w) => {
                                const isSelected = (field.width || '100%') === w;
                                return (wp.element.createElement("button", { type: "button", key: w, role: "radio", "aria-checked": isSelected, className: WooOptionsFic.Utils.classNames('wof-width-btn', isSelected && 'is-active'), onClick: () => update({ width: w }) }, w));
                            }))),
                        Boolean(field.choices) && !['radio', 'checkbox_group', 'select', 'font'].includes(field.type) ? (wp.element.createElement("div", { className: "wof-choice-dimensions-box", style: { padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)', marginBottom: '16px' } },
                            wp.element.createElement("strong", { style: { display: 'block', fontSize: '13px', marginBottom: '8px' } }, __('Choice Item Dimensions & Style', 'wooptionsfic')),
                            wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' } },
                                wp.element.createElement(TextControl, { label: __('Width (px)', 'wooptionsfic'), type: "number", min: 0, value: String(field.choiceWidth ?? ''), placeholder: "Auto", onChange: (choiceWidth) => update({ choiceWidth }) }),
                                wp.element.createElement(TextControl, { label: __('Height (px)', 'wooptionsfic'), type: "number", min: 0, value: String(field.choiceHeight ?? ''), placeholder: "Auto", onChange: (choiceHeight) => update({ choiceHeight }) }),
                                wp.element.createElement(TextControl, { label: __('Radius (px)', 'wooptionsfic'), type: "number", min: 0, value: String(field.choiceBorderRadius ?? ''), placeholder: "Default", onChange: (choiceBorderRadius) => update({ choiceBorderRadius }) })))) : null,
                        'placeholder' in field ? wp.element.createElement(TextControl, { label: __('Placeholder', 'wooptionsfic'), value: field.placeholder ?? '', onChange: (placeholder) => update({ placeholder }) }) : null,
                        ['text', 'textarea'].includes(field.type) ? (wp.element.createElement("div", { className: "wof-text-settings", style: { marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' } },
                            wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' } },
                                wp.element.createElement(TextControl, { label: __('Minimum Character', 'wooptionsfic'), type: "number", min: 0, value: field.minLength ? String(field.minLength) : '', placeholder: "0", onChange: (val) => update({ minLength: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0) }) }),
                                wp.element.createElement(TextControl, { label: __('Maximum Character', 'wooptionsfic'), type: "number", min: 0, value: field.maxLength ? String(field.maxLength) : '', placeholder: "0", onChange: (val) => update({ maxLength: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0) }) })),
                            wp.element.createElement(SelectControl, { label: __('Text Transform', 'wooptionsfic'), value: field.textTransform ?? 'none', options: [
                                    { label: __('None', 'wooptionsfic'), value: 'none' },
                                    { label: __('Uppercase', 'wooptionsfic'), value: 'uppercase' },
                                    { label: __('Lowercase', 'wooptionsfic'), value: 'lowercase' },
                                    { label: __('Capitalize', 'wooptionsfic'), value: 'capitalize' },
                                ], onChange: (textTransform) => update({ textTransform }) }),
                            field.type === 'textarea' ? (wp.element.createElement("div", { style: { marginTop: '12px' } },
                                wp.element.createElement(TextControl, { label: __('Row', 'wooptionsfic'), type: "number", min: 1, max: 50, value: field.rows ? String(field.rows) : '4', placeholder: "4", onChange: (val) => update({ rows: val === '' ? 4 : Math.max(1, parseInt(val, 10) || 4) }) }))) : null)) : null,
                        field.type === 'number' ? (wp.element.createElement("div", { className: "wof-number-settings", style: { marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' } },
                            wp.element.createElement(ToggleControl, { label: __('Enable Min/Max Restriction', 'wooptionsfic'), checked: field.enableMinMax !== false, onChange: (enableMinMax) => update({
                                    enableMinMax,
                                    min: enableMinMax ? (field.min ?? '1') : null,
                                    max: enableMinMax ? (field.max ?? '100') : null,
                                }) }),
                            field.enableMinMax !== false ? (wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' } },
                                wp.element.createElement(TextControl, { label: __('MINIMUM VALUE', 'wooptionsfic'), type: "number", value: field.min != null ? String(field.min) : '1', placeholder: "1", onChange: (min) => update({ min }) }),
                                wp.element.createElement(TextControl, { label: __('MAXIMUM VALUE', 'wooptionsfic'), type: "number", value: field.max != null ? String(field.max) : '100', placeholder: "100", onChange: (max) => update({ max }) }))) : null,
                            wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' } },
                                wp.element.createElement(TextControl, { label: __('STEPS', 'wooptionsfic'), type: "number", value: field.step != null ? String(field.step) : '1', placeholder: "1", onChange: (step) => update({ step }) }),
                                wp.element.createElement(TextControl, { label: __('DEFAULT VALUE', 'wooptionsfic'), type: "number", value: field.default != null && field.default !== '' ? String(field.default) : '', placeholder: "", onChange: (def) => update({ default: def }) })))) : null,
                        field.type === 'tel' ? (wp.element.createElement("div", { className: "wof-phone-settings", style: { marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' } },
                            wp.element.createElement(SelectControl, { label: __('Flag Style', 'wooptionsfic'), value: field.flagStyle ?? 'number_only', options: [
                                    { label: __('Number Only', 'wooptionsfic'), value: 'number_only' },
                                    { label: __('Number Only & Flag', 'wooptionsfic'), value: 'number_flag' },
                                    { label: __('Number Only & Flag and Dial Code', 'wooptionsfic'), value: 'number_flag_dialcode' },
                                ], onChange: (flagStyle) => update({ flagStyle }) }),
                            (field.flagStyle === 'number_flag' || field.flagStyle === 'number_flag_dialcode') ? (wp.element.createElement(SelectControl, { label: __('Default Country', 'wooptionsfic'), value: field.defaultCountry ?? 'US', options: COUNTRY_OPTIONS, onChange: (defaultCountry) => update({ defaultCountry }) })) : null)) : null,
                        ['datetime', 'date', 'time'].includes(field.type) ? (wp.element.createElement(DateFieldInspector, { field: field, update: update })) : null,
                        field.type === 'date_range' ? (wp.element.createElement(DateRangeFieldInspector, { field: field, update: update })) : null,
                        ['color_swatch', 'image_swatch', 'segmented'].includes(field.type) ? (wp.element.createElement("div", { className: "wof-multiple-choice-settings", style: { marginBottom: '16px' } },
                            wp.element.createElement(ToggleControl, { label: __('Allow Multiple Choices', 'wooptionsfic'), help: __('Allow customers to select more than one option.', 'wooptionsfic'), checked: Boolean(field.multiple), onChange: (multiple) => update({ multiple }) }),
                            field.multiple ? (wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' } },
                                wp.element.createElement(TextControl, { label: __('Min Restriction', 'wooptionsfic'), type: "number", min: 0, value: String(field.minChoices ?? ''), placeholder: __('Min', 'wooptionsfic'), onChange: (val) => update({ minChoices: val === '' ? 0 : Math.max(0, Number(val)) }) }),
                                wp.element.createElement(TextControl, { label: __('Max Restriction', 'wooptionsfic'), type: "number", min: 0, value: String(field.maxChoices ?? ''), placeholder: __('Max', 'wooptionsfic'), onChange: (val) => update({ maxChoices: val === '' ? 0 : Math.max(0, Number(val)) }) }))) : null)) : null,
                        field.type === 'checkbox_group' ? (wp.element.createElement("div", { className: "wof-checkbox-restrictions-box", style: { padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)', marginBottom: '16px' } },
                            wp.element.createElement("strong", { style: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' } }, __('Choice Selection Restrictions', 'wooptionsfic')),
                            wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } },
                                wp.element.createElement(TextControl, { label: __('Min Restriction', 'wooptionsfic'), type: "number", min: 0, value: String(field.minChoices ?? ''), placeholder: __('Min', 'wooptionsfic'), onChange: (val) => update({ minChoices: val === '' ? 0 : Math.max(0, Number(val)) }) }),
                                wp.element.createElement(TextControl, { label: __('Max Restriction', 'wooptionsfic'), type: "number", min: 0, value: String(field.maxChoices ?? ''), placeholder: __('Max', 'wooptionsfic'), onChange: (val) => update({ maxChoices: val === '' ? 0 : Math.max(0, Number(val)) }) })))) : null,
                        Boolean(field.choices) && !['segmented', 'radio', 'checkbox_group', 'font', 'select'].includes(field.type) ? (wp.element.createElement("div", { className: "wof-quantity-setting", style: { marginBottom: '16px', padding: '12px', background: 'var(--wof-admin-surface-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--wof-admin-border, #e2e8f0)' } },
                            wp.element.createElement(ToggleControl, { label: __('Enable Quantity', 'wooptionsfic'), help: __('Allow customers to specify quantity for each choice option.', 'wooptionsfic'), checked: Boolean(field.enableQuantity), onChange: (enableQuantity) => update({ enableQuantity }) }),
                            field.enableQuantity ? (wp.element.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' } },
                                wp.element.createElement(TextControl, { label: __('Minimum Quantity', 'wooptionsfic'), type: "number", min: 1, value: String(field.minQuantity ?? 1), placeholder: "1", onChange: (val) => update({ minQuantity: val === '' ? 1 : Math.max(1, Number(val)) }) }),
                                wp.element.createElement(TextControl, { label: __('Maximum Quantity', 'wooptionsfic'), type: "number", min: 1, value: String(field.maxQuantity ?? 100), placeholder: "100", onChange: (val) => update({ maxQuantity: val === '' ? 0 : Math.max(1, Number(val)) }) }))) : null)) : null,
                        field.type === 'color_picker' ? (wp.element.createElement(ChoiceColorControl, { label: __('Default color', 'wooptionsfic'), color: String(field.default ?? '#5B4FF5'), onChange: (color) => update({ default: color }) })) : null,
                        ['checkbox', 'toggle'].includes(field.type) ? (wp.element.createElement(ToggleControl, { label: __('Checked by default', 'wooptionsfic'), checked: Boolean(field.default), onChange: (defaultVal) => update({ default: defaultVal }) })) : null,
                        wp.element.createElement(TextareaControl, { label: __('Help text', 'wooptionsfic'), value: field.help, onChange: (help) => update({ help }) }),
                        wp.element.createElement("div", { className: "wof-help-position-control" },
                            wp.element.createElement("label", { className: "wof-segmented-label" }, __('HELP TEXT POSITION', 'wooptionsfic')),
                            wp.element.createElement("div", { className: "wof-segmented-group" }, [
                                { label: __('Below Title', 'wooptionsfic'), value: 'below_title' },
                                { label: __('Tooltip', 'wooptionsfic'), value: 'tooltip' },
                                { label: __('Below Field', 'wooptionsfic'), value: 'below_field' },
                            ].map(opt => {
                                const isSelected = (field.helpTextPosition ?? 'below_title') === opt.value;
                                return (wp.element.createElement("button", { key: opt.value, type: "button", className: WooOptionsFic.Utils.classNames('wof-segmented-btn', isSelected && 'is-selected'), onClick: () => update({ helpTextPosition: opt.value }) }, opt.label));
                            }))),
                        wp.element.createElement(ToggleControl, { label: __('Required', 'wooptionsfic'), checked: field.required, onChange: (required) => update({ required }) }))) : props.tab === 'choices' ? (wp.element.createElement(ChoiceEditor, { field: field, onChange: props.onFieldChange })) : props.tab === 'pricing' ? (wp.element.createElement(PricingPanel, { field: field, onChange: props.onFieldChange })) : props.tab === 'logic' ? (wp.element.createElement(Builder.LogicEditor, { field: field, allFields: props.document.fields, onChange: props.onFieldChange })) : props.tab === 'style' ? (wp.element.createElement(Builder.StyleStudio, { document: props.document, onChange: props.onDocumentChange })) : (wp.element.createElement(wp.element.Fragment, null,
                        wp.element.createElement(ToggleControl, { label: __('Disable this field', 'wooptionsfic'), checked: field.disabled, onChange: (disabled) => update({ disabled }) }),
                        field.type === 'file' ? (wp.element.createElement(wp.element.Fragment, null,
                            wp.element.createElement(TextControl, { label: __('Allowed extensions', 'wooptionsfic'), value: (field.allowedExtensions ?? []).join(', '), onChange: (value) => update({ allowedExtensions: value.split(',').map((item) => item.trim().replace(/^\./, '')).filter(Boolean) }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum files', 'wooptionsfic'), type: "number", value: String(field.maxFiles ?? 1), onChange: (value) => update({ maxFiles: Math.max(1, Number(value)) }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum file size (MB)', 'wooptionsfic'), type: "number", value: String(field.maxFileMb ?? 5), onChange: (value) => update({ maxFileMb: Math.max(1, Number(value)) }) }))) : null,
                        ['number', 'range', 'quantity', 'customer_defined_price'].includes(field.type) ? (wp.element.createElement(wp.element.Fragment, null,
                            wp.element.createElement(TextControl, { label: __('Minimum', 'wooptionsfic'), value: field.min ?? '', onChange: (value) => update({ min: value || null }) }),
                            wp.element.createElement(TextControl, { label: __('Maximum', 'wooptionsfic'), value: field.max ?? '', onChange: (value) => update({ max: value || null }) }),
                            wp.element.createElement(TextControl, { label: __('Step', 'wooptionsfic'), value: field.step ?? '', onChange: (value) => update({ step: value || null }) }))) : null,
                        wp.element.createElement(TextControl, { label: __('Field UUID', 'wooptionsfic'), value: field.uuid, disabled: true }))))));
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
        function renderTypeIcon(type) {
            switch (type) {
                case 'global':
                    return wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                        wp.element.createElement("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
                        wp.element.createElement("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" }));
                case 'product':
                    return wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("path", { d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" }),
                        wp.element.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
                        wp.element.createElement("path", { d: "M16 10a4 4 0 0 1-8 0" }));
                case 'category':
                    return wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }));
                case 'tag':
                    return wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("path", { d: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" }),
                        wp.element.createElement("line", { x1: "7", y1: "7", x2: "7.01", y2: "7" }));
                case 'variation':
                    return wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                        wp.element.createElement("polyline", { points: "23 4 23 10 17 10" }),
                        wp.element.createElement("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" }));
                default:
                    return wp.element.createElement("span", { className: `dashicons ${assignmentTypeIcon(type)}`, "aria-hidden": "true" });
            }
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
                    wp.element.createElement("span", { className: "wof-assignment-global__icon", "aria-hidden": "true" }, renderTypeIcon('global')),
                    wp.element.createElement("span", null,
                        wp.element.createElement("strong", null, __('All products', 'wooptionsfic')),
                        wp.element.createElement("small", null, selected ? __('Already assigned', 'wooptionsfic') : __('Apply this option set store-wide', 'wooptionsfic'))),
                    wp.element.createElement("span", { className: "wof-assignment-global__status", "aria-hidden": "true" }, selected ? (wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
                        wp.element.createElement("polyline", { points: "20 6 9 17 4 12" }))) : (wp.element.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" },
                        wp.element.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                        wp.element.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" }))))));
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
                    wp.element.createElement("span", { className: "wof-assignment-hero__icon", "aria-hidden": "true" },
                        wp.element.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
                            wp.element.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }))),
                    wp.element.createElement("div", null,
                        wp.element.createElement("h3", null, __('Choose exactly where this option set appears', 'wooptionsfic')),
                        wp.element.createElement("p", null, __('Search and select multiple products, categories, tags, or variations. Product-specific rules take priority over broader category rules.', 'wooptionsfic')))),
                wp.element.createElement("section", { className: "wof-assignment-picker" },
                    wp.element.createElement("div", { className: "wof-assignment-type-tabs", role: "tablist" }, assignmentTypes.map((assignmentType) => (wp.element.createElement("button", { type: "button", role: "tab", key: assignmentType.type, "aria-selected": type === assignmentType.type, className: type === assignmentType.type ? 'is-active' : '', onClick: () => setType(assignmentType.type) },
                        wp.element.createElement("span", { className: "wof-type-tab-icon", "aria-hidden": "true" }, renderTypeIcon(assignmentType.type)),
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
                        wp.element.createElement("div", { className: "wof-assignment-card__visual" }, image ? wp.element.createElement("img", { src: image, alt: "" }) : wp.element.createElement("span", { className: "wof-assignment-visual-icon", "aria-hidden": "true" }, renderTypeIcon(assignment.targetType))),
                        wp.element.createElement("div", { className: "wof-assignment-card__identity" },
                            wp.element.createElement("div", null,
                                wp.element.createElement("strong", null, label),
                                wp.element.createElement("span", { className: "wof-target-type-badge" }, assignmentTypeLabel(assignment.targetType))),
                            wp.element.createElement("small", null, meta)),
                        wp.element.createElement("div", { className: "wof-assignment-card__controls" },
                            wp.element.createElement(SelectControl, { label: __('Mode', 'wooptionsfic'), value: assignment.mode, options: [
                                    { label: __('Include', 'wooptionsfic'), value: 'include' },
                                    { label: __('Exclude', 'wooptionsfic'), value: 'exclude' },
                                ], onChange: (mode) => updateAssignment(index, { mode }) }),
                            wp.element.createElement(TextControl, { type: "number", label: __('Priority', 'wooptionsfic'), value: String(assignment.priority), min: -1000, max: 1000, onChange: (priority) => updateAssignment(index, { priority: Number(priority) }) }),
                            wp.element.createElement("button", { type: "button", className: "wof-assignment-card__remove", onClick: () => setDraft((current) => current.filter((candidate) => candidate !== assignment)), "aria-label": __('Remove assignment', 'wooptionsfic'), title: __('Remove assignment', 'wooptionsfic') },
                                wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                    wp.element.createElement("polyline", { points: "3 6 5 6 21 6" }),
                                    wp.element.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
                                    wp.element.createElement("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
                                    wp.element.createElement("line", { x1: "14", y1: "11", x2: "14", y2: "17" }))))));
                }))) : (wp.element.createElement("div", { className: "wof-assignment-empty" },
                    wp.element.createElement("span", { className: "wof-assignment-empty__icon", "aria-hidden": "true" },
                        wp.element.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
                            wp.element.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }))),
                    wp.element.createElement("h3", null, __('No products assigned yet', 'wooptionsfic')),
                    wp.element.createElement("p", null, __('Use the search above to select one or more targets.', 'wooptionsfic')))),
                wp.element.createElement("div", { className: "wof-modal__actions wof-assignment-actions" },
                    wp.element.createElement(Button, { variant: "secondary", className: "wof-btn-cancel", disabled: saving || props.busy, onClick: props.onClose }, __('Cancel', 'wooptionsfic')),
                    wp.element.createElement(Button, { variant: "primary", className: "wof-btn-save", isBusy: saving || props.busy, disabled: saving || props.busy, onClick: save },
                        saving || props.busy ? (wp.element.createElement("svg", { className: "wof-btn-spinner", width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", "aria-hidden": "true", style: { fill: 'none', stroke: 'currentColor' } },
                            wp.element.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "2.8", strokeDasharray: "31.4 31.4", strokeDashoffset: "10", fill: "none" }))) : (wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { fill: 'none', stroke: 'currentColor' } },
                            wp.element.createElement("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                            wp.element.createElement("polyline", { points: "17 21 17 13 7 13 7 21", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                            wp.element.createElement("polyline", { points: "7 3 7 8 15 8", fill: "none", stroke: "currentColor", strokeWidth: "2" }))),
                        wp.element.createElement("span", null, saving || props.busy ? __('Saving…', 'wooptionsfic') : __('Save assignments', 'wooptionsfic'))))));
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
        function BuilderPage(props) {
            const state = wp.data.useSelect((select) => select(WooOptionsFic.BuilderStore.STORE_KEY).getState(), []);
            const actions = wp.data.useDispatch(WooOptionsFic.BuilderStore.STORE_KEY);
            const [loading, setLoading] = useState(true);
            const [fatal, setFatal] = useState('');
            const [historyOpen, setHistoryOpen] = useState(false);
            const [assignmentOpen, setAssignmentOpen] = useState(false);
            const [revisions, setRevisions] = useState([]);
            const [assignments, setAssignments] = useState([]);
            const [modalBusy, setModalBusy] = useState(false);
            const [deleteUuid, setDeleteUuid] = useState(null);
            const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
            const [publishBusy, setPublishBusy] = useState(false);
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
            const saveNow = useCallback(async (note = 'Manual save') => {
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
                    WooOptionsFic.Toast.error(WooOptionsFic.Utils.errorMessage(reason));
                    throw reason;
                }
                finally {
                    savePromise.current = null;
                }
            }, [state.optionSet, state.document]);
            /* Autosave removed — saves are now manual via "Save draft" button */
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
                setPublishBusy(true);
                try {
                    const saved = state.dirty ? await saveNow('Pre-publish save') : state.optionSet;
                    actions.setSaveStatus('saving');
                    const result = await WooOptionsFic.Api.publishOptionSet(saved.uuid, saved.currentRevision?.contentHash ?? '');
                    actions.saved(result, result.currentRevision?.definition ?? state.document);
                    WooOptionsFic.Toast.success(__('Published. This live revision is now immutable.', 'wooptionsfic'), __('Option Set Published', 'wooptionsfic'));
                }
                catch (reason) {
                    WooOptionsFic.Toast.error(WooOptionsFic.Utils.errorMessage(reason));
                }
                finally {
                    setPublishBusy(false);
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
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "edit" })))),
                    wp.element.createElement("div", { className: "wof-builder-tools" },
                        wp.element.createElement("div", { className: "wof-tool-group wof-history-tools" },
                            wp.element.createElement("button", { type: "button", disabled: !state.history.length, onClick: actions.undo },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "undo" })),
                            wp.element.createElement("button", { type: "button", disabled: !state.future.length, onClick: actions.redo },
                                wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: "redo" }))),
                        wp.element.createElement("div", { className: "wof-tool-group wof-device-switcher" }, ['desktop', 'tablet', 'mobile'].map((device) => wp.element.createElement("button", { type: "button", key: device, className: state.device === device ? 'is-active' : '', onClick: () => actions.setDevice(device) },
                            wp.element.createElement(WooOptionsFic.Components.Dashicon, { name: device === 'desktop' ? 'desktop' : device === 'tablet' ? 'tablet' : 'smartphone' })))),
                        wp.element.createElement(Button, { variant: "tertiary", className: "wof-header-action", onClick: openHistory },
                            wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { fill: 'none', stroke: 'currentColor' } },
                                wp.element.createElement("circle", { cx: "12", cy: "12", r: "9", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                                wp.element.createElement("polyline", { points: "12 7 12 12 15 15", fill: "none", stroke: "currentColor", strokeWidth: "2" })),
                            __('History', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "tertiary", className: "wof-header-action", onClick: openAssignments },
                            wp.element.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", style: { fill: 'none', stroke: 'currentColor' } },
                                wp.element.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
                                wp.element.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", fill: "none", stroke: "currentColor", strokeWidth: "2" })),
                            __('Assignments', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "secondary", className: "wof-header-action wof-header-save", isBusy: state.saveStatus === 'saving', onClick: () => saveNow('Manual save').then(() => WooOptionsFic.Toast.success(__('Draft saved.', 'wooptionsfic'))).catch(() => undefined) }, state.saveStatus === 'saving' ? __('Saving…', 'wooptionsfic') : __('Save draft', 'wooptionsfic')),
                        wp.element.createElement(Button, { variant: "primary", className: "wof-header-publish", isBusy: publishBusy, disabled: state.errors.length > 0 || publishBusy, onClick: publish }, publishBusy ? __('Publishing…', 'wooptionsfic') : __('Publish', 'wooptionsfic')))),
                wp.element.createElement("div", { className: "wof-builder-workspace" },
                    wp.element.createElement(Builder.ElementsPanel, { onAdd: addField, onOpenStyle: () => { actions.selectField(null); actions.setInspectorTab('style'); } }),
                    wp.element.createElement(Builder.Canvas, { document: state.document, selectedUuid: state.selectedUuid, device: state.device, onSelect: (uuid) => { actions.selectField(uuid); actions.setInspectorTab('content'); }, onAdd: addField, onMove: actions.moveField, onDuplicate: (field) => addField(WooOptionsFic.FieldFactory.duplicate(field)), onDelete: setDeleteUuid }),
                    wp.element.createElement(Builder.Inspector, { field: selectedField, document: state.document, tab: state.inspectorTab, onTabChange: actions.setInspectorTab, onFieldChange: (field) => actions.replaceField(field.uuid, field), onDocumentChange: actions.updateDocument, onDuplicate: duplicateSelected, onDelete: () => selectedField && setDeleteUuid(selectedField.uuid) })),
                wp.element.createElement("div", { className: WooOptionsFic.Utils.classNames('wof-diagnostics-drawer', diagnosticsOpen && 'is-open') },
                    wp.element.createElement("button", { type: "button", className: "wof-diagnostics-toggle", onClick: () => setDiagnosticsOpen(!diagnosticsOpen) },
                        wp.element.createElement("span", { className: state.errors.length ? 'is-error' : state.warnings.length ? 'is-warn' : 'is-good', "aria-hidden": "true" }, state.errors.length ? (wp.element.createElement("svg", { width: "11", height: "11", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round" },
                            wp.element.createElement("line", { x1: "3", y1: "3", x2: "13", y2: "13" }),
                            wp.element.createElement("line", { x1: "13", y1: "3", x2: "3", y2: "13" }))) : state.warnings.length ? (wp.element.createElement("svg", { width: "11", height: "11", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("path", { d: "M8 2L14.5 13H1.5L8 2z" }),
                            wp.element.createElement("line", { x1: "8", y1: "7", x2: "8", y2: "10" }),
                            wp.element.createElement("circle", { cx: "8", cy: "12", r: ".6", fill: "currentColor", stroke: "none" }))) : (wp.element.createElement("svg", { width: "11", height: "11", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("polyline", { points: "2,8 6.5,12.5 14,4" })))),
                        wp.element.createElement("strong", null, __('Preflight diagnostics', 'wooptionsfic')),
                        wp.element.createElement("small", null,
                            state.errors.length ? `${state.errors.length} ${__('errors', 'wooptionsfic')}` : __('Ready to publish', 'wooptionsfic'),
                            state.warnings.length ? ` · ${state.warnings.length} ${__('warnings', 'wooptionsfic')}` : ''),
                        wp.element.createElement("b", { className: "wof-diagnostics-chevron", "aria-hidden": "true" }, diagnosticsOpen ? (wp.element.createElement("svg", { width: "10", height: "10", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("polyline", { points: "3,10 8,5 13,10" }))) : (wp.element.createElement("svg", { width: "10", height: "10", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round" },
                            wp.element.createElement("polyline", { points: "3,6 8,11 13,6" }))))),
                    diagnosticsOpen ? wp.element.createElement("div", { className: "wof-diagnostics-content" },
                        wp.element.createElement("div", { className: "wof-diagnostics-section" },
                            wp.element.createElement("h3", null,
                                wp.element.createElement("span", { className: "wof-diag-section-icon wof-diag-icon-error", "aria-hidden": "true" },
                                    wp.element.createElement("svg", { width: "9", height: "9", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round" },
                                        wp.element.createElement("line", { x1: "3", y1: "3", x2: "13", y2: "13" }),
                                        wp.element.createElement("line", { x1: "13", y1: "3", x2: "3", y2: "13" }))),
                                __('Errors', 'wooptionsfic'),
                                state.errors.length ? wp.element.createElement("em", { className: "wof-diag-count" }, state.errors.length) : null),
                            state.errors.length ? wp.element.createElement("ul", null, state.errors.map((issue, index) => wp.element.createElement("li", { key: `${issue.code}-${index}` },
                                wp.element.createElement("span", { className: "wof-issue-icon is-error", "aria-label": "error" },
                                    wp.element.createElement("svg", { width: "9", height: "9", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", "aria-hidden": "true" },
                                        wp.element.createElement("line", { x1: "3", y1: "3", x2: "13", y2: "13" }),
                                        wp.element.createElement("line", { x1: "13", y1: "3", x2: "3", y2: "13" }))),
                                wp.element.createElement("code", null, issue.code),
                                wp.element.createElement("small", null, issue.path ?? issue.fieldUuid ?? '')))) : wp.element.createElement("p", { className: "wof-diag-ok" },
                                wp.element.createElement("span", { "aria-hidden": "true" },
                                    wp.element.createElement("svg", { width: "11", height: "11", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" },
                                        wp.element.createElement("polyline", { points: "2,8 6.5,12.5 14,4" }))),
                                __('No blocking errors.', 'wooptionsfic'))),
                        wp.element.createElement("div", { className: "wof-diagnostics-section" },
                            wp.element.createElement("h3", null,
                                wp.element.createElement("span", { className: "wof-diag-section-icon wof-diag-icon-warn", "aria-hidden": "true" },
                                    wp.element.createElement("svg", { width: "9", height: "9", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" },
                                        wp.element.createElement("path", { d: "M8 2L14.5 13H1.5L8 2z" }),
                                        wp.element.createElement("line", { x1: "8", y1: "7", x2: "8", y2: "10" }),
                                        wp.element.createElement("circle", { cx: "8", cy: "12", r: ".6", fill: "currentColor", stroke: "none" }))),
                                __('Warnings', 'wooptionsfic'),
                                state.warnings.length ? wp.element.createElement("em", { className: "wof-diag-count is-warn" }, state.warnings.length) : null),
                            state.warnings.length ? wp.element.createElement("ul", null, state.warnings.map((issue, index) => wp.element.createElement("li", { key: `${issue.code}-${index}` },
                                wp.element.createElement("span", { className: "wof-issue-icon is-warn", "aria-label": "warning" },
                                    wp.element.createElement("svg", { width: "9", height: "9", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
                                        wp.element.createElement("path", { d: "M8 2L14.5 13H1.5L8 2z" }),
                                        wp.element.createElement("line", { x1: "8", y1: "7", x2: "8", y2: "10" }),
                                        wp.element.createElement("circle", { cx: "8", cy: "12", r: ".6", fill: "currentColor", stroke: "none" }))),
                                wp.element.createElement("code", null, issue.code),
                                wp.element.createElement("small", null, issue.path ?? issue.fieldUuid ?? '')))) : wp.element.createElement("p", { className: "wof-diag-ok" },
                                wp.element.createElement("span", { "aria-hidden": "true" },
                                    wp.element.createElement("svg", { width: "11", height: "11", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" },
                                        wp.element.createElement("polyline", { points: "2,8 6.5,12.5 14,4" }))),
                                __('No warnings.', 'wooptionsfic'))),
                        wp.element.createElement("div", { className: "wof-config-size" },
                            wp.element.createElement("span", { className: "wof-config-size-icon", "aria-hidden": "true" },
                                wp.element.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" },
                                    wp.element.createElement("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
                                    wp.element.createElement("path", { d: "M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5" }),
                                    wp.element.createElement("path", { d: "M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9" }),
                                    wp.element.createElement("path", { d: "M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" }))),
                            wp.element.createElement("h3", null, __('Config size', 'wooptionsfic')),
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
                        WooOptionsFic.Toast.success(__('A new draft was created from that revision.', 'wooptionsfic'));
                    }
                    finally {
                        setModalBusy(false);
                    } } }) : null,
                assignmentOpen ? wp.element.createElement(Builder.AssignmentsModal, { assignments: assignments, busy: modalBusy, onClose: () => setAssignmentOpen(false), onSave: async (nextAssignments) => { setModalBusy(true); try {
                        const response = await WooOptionsFic.Api.saveAssignments(state.optionSet.uuid, nextAssignments);
                        setAssignments(response.items);
                        setAssignmentOpen(false);
                        WooOptionsFic.Toast.success(__('Product assignments saved.', 'wooptionsfic'));
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