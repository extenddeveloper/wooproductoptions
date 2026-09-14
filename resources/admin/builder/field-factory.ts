namespace WooOptionsFic.FieldFactory {
  const choiceTypes = new Set(['select', 'radio', 'checkbox_group', 'segmented', 'color_swatch', 'image_swatch', 'product', 'font']);

  export function emptyPricing(): WooOptionsFic.PricingDefinition {
    return { strategy: 'none', amount: '0', percent: '0', mode: 'adjustment' };
  }

  export function choice(label: string, index = 0): WooOptionsFic.ChoiceDefinition {
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

  export function create(type: string): WooOptionsFic.FieldDefinition {
    const manifest = window.WooOptionsFicAdmin.fieldTypes[type];
    const label = manifest?.label ?? 'Field';
    const field: WooOptionsFic.FieldDefinition = {
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
      if (type === 'image_swatch') field.updateProductImage = false;
      if (['radio', 'checkbox_group', 'select'].includes(type)) {
        field.columns = 'one';
        field.imageStyle = 'normal';
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

  export function duplicate(field: WooOptionsFic.FieldDefinition): WooOptionsFic.FieldDefinition {
    const copy = WooOptionsFic.Utils.clone(field);
    const remap = (item: WooOptionsFic.FieldDefinition): WooOptionsFic.FieldDefinition => ({
      ...item,
      uuid: WooOptionsFic.Utils.uuid(),
      label: item === copy ? `${item.label} copy` : item.label,
      choices: item.choices?.map((choiceItem) => ({ ...choiceItem, uuid: WooOptionsFic.Utils.uuid() })),
      children: item.children?.map(remap),
    });
    return remap(copy);
  }
}
