<?php
/**
 * Field type manifest.
 *
 * @package WooOptionsFic
 */

defined('ABSPATH') || exit;

return [
	'select'                 => ['group' => 'choice', 'label' => __('Dropdown', 'wooptionsfic'), 'multiple' => false],
	'radio'                  => ['group' => 'choice', 'label' => __('Radio group', 'wooptionsfic'), 'multiple' => false],
	'checkbox_group'         => ['group' => 'choice', 'label' => __('Checkbox group', 'wooptionsfic'), 'multiple' => true],
	'checkbox'               => ['group' => 'boolean', 'label' => __('Checkbox', 'wooptionsfic')],
	'toggle'                 => ['group' => 'boolean', 'label' => __('Switch', 'wooptionsfic')],
	'segmented'              => ['group' => 'choice', 'label' => __('Button choices', 'wooptionsfic'), 'multiple' => false],
	'color_swatch'           => ['group' => 'choice', 'label' => __('Color swatches', 'wooptionsfic'), 'multiple' => false],
	'image_swatch'           => ['group' => 'choice', 'label' => __('Image choices', 'wooptionsfic'), 'multiple' => false],
	'product'                => ['group' => 'choice', 'label' => __('Product choices', 'wooptionsfic'), 'multiple' => true],
	'text'                   => ['group' => 'scalar', 'label' => __('Text', 'wooptionsfic'), 'value' => 'string'],
	'textarea'               => ['group' => 'scalar', 'label' => __('Textarea', 'wooptionsfic'), 'value' => 'string'],
	'password'               => ['group' => 'scalar', 'label' => __('Private text', 'wooptionsfic'), 'value' => 'secret'],
	'tel'                    => ['group' => 'scalar', 'label' => __('Telephone', 'wooptionsfic'), 'value' => 'tel'],
	'email'                  => ['group' => 'scalar', 'label' => __('Email', 'wooptionsfic'), 'value' => 'email'],
	'url'                    => ['group' => 'scalar', 'label' => __('URL', 'wooptionsfic'), 'value' => 'url'],
	'number'                 => ['group' => 'scalar', 'label' => __('Number', 'wooptionsfic'), 'value' => 'decimal'],
	'range'                  => ['group' => 'scalar', 'label' => __('Range', 'wooptionsfic'), 'value' => 'decimal'],
	'quantity'               => ['group' => 'scalar', 'label' => __('Option quantity', 'wooptionsfic'), 'value' => 'integer'],
	'date'                   => ['group' => 'scalar', 'label' => __('Date', 'wooptionsfic'), 'value' => 'date'],
	'date_range'             => ['group' => 'scalar', 'label' => __('Date range', 'wooptionsfic'), 'value' => 'date_range'],
	'time'                   => ['group' => 'scalar', 'label' => __('Time', 'wooptionsfic'), 'value' => 'time'],
	'datetime'               => ['group' => 'scalar', 'label' => __('Date and time', 'wooptionsfic'), 'value' => 'datetime'],
	'customer_defined_price' => ['group' => 'scalar', 'label' => __('Customer-defined price', 'wooptionsfic'), 'value' => 'decimal'],
	'color_picker'           => ['group' => 'scalar', 'label' => __('Color picker', 'wooptionsfic'), 'value' => 'color'],
	'file'                   => ['group' => 'upload', 'label' => __('Private file upload', 'wooptionsfic')],
	'font'                   => ['group' => 'choice', 'label' => __('Font choice', 'wooptionsfic'), 'multiple' => false],
	'formula'                => ['group' => 'calculated', 'label' => __('Formula output', 'wooptionsfic')],
	'calculated'             => ['group' => 'calculated', 'label' => __('Calculated value', 'wooptionsfic')],
	'repeater'               => ['group' => 'repeater', 'label' => __('Repeatable section', 'wooptionsfic')],
	'heading'                => ['group' => 'content', 'label' => __('Heading', 'wooptionsfic')],
	'paragraph'              => ['group' => 'content', 'label' => __('Paragraph', 'wooptionsfic')],
	'help'                   => ['group' => 'content', 'label' => __('Help content', 'wooptionsfic')],
	'separator'              => ['group' => 'content', 'label' => __('Separator', 'wooptionsfic')],
	'spacer'                 => ['group' => 'content', 'label' => __('Spacer', 'wooptionsfic')],
];
