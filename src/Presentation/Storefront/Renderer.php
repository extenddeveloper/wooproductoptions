<?php
/**
 * Accessible server-rendered configurator baseline.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Presentation\Storefront;

use WooOptionsFic\Application\AnalyticsService;
use WooOptionsFic\Application\QuoteService;
use WooOptionsFic\Domain\Support\Uuid;
use WooOptionsFic\Infrastructure\WooCommerce\ProductContext;
use WooOptionsFic\Infrastructure\WordPress\SessionGuard;

final class Renderer {
	/** @var array<int,bool> */
	private array $rendered_products = [];

	public function __construct(
		private readonly QuoteService $quotes,
		private readonly ProductContext $products,
		private readonly SessionGuard $sessions,
		private readonly AnalyticsService $analytics
	) {
	}

	public function render_for_current_product(): void {
		global $product;
		if (! $product instanceof \WC_Product) {
			return;
		}
		$this->render((int) $product->get_id());
	}

	public function render_block(array $attributes = []): string {
		$product_id = max(0, (int) ($attributes['productId'] ?? get_the_ID()));
		ob_start();
		$this->render($product_id);
		return (string) ob_get_clean();
	}

	public function render(int $product_id): void {
		if ($product_id <= 0 || isset($this->rendered_products[$product_id])) {
			return;
		}
		try {
			$context = $this->products->make(
				$product_id,
				0,
				1,
				get_current_user_id(),
				$this->sessions->session_hash()
			);
			$config = $this->quotes->configuration($context);
		} catch (\Throwable) {
			return;
		}
		if (! is_array($config) || [] === (array) ($config['fields'] ?? [])) {
			return;
		}
		$this->rendered_products[$product_id] = true;

		wp_enqueue_script('wooptionsfic-storefront');
		wp_enqueue_style('wooptionsfic-storefront');
		$this->enqueue_typography_font((array) ($config['style']['typography'] ?? []));

		$token  = $this->sessions->issue($product_id, (string) $config['revisionUuid']);
		$tokens = (array) ($config['style']['tokens'] ?? []);
		$style  = $this->css_variables($tokens, (array) ($config['style']['typography'] ?? []));
		$payload= [
			'configuration' => $config,
			'token'         => $token,
			'currency'      => (string) $context['currency'],
			'currencyScale' => (int) $context['currencyScale'],
			'basePrice'     => (string) $context['basePrice'],
		];

		$layout = in_array(($config['layout']['type'] ?? ''), ['stack', 'inline', 'grid', 'accordion', 'tabs', 'wizard'], true)
			? (string) $config['layout']['type']
			: 'stack';
		$show_price_breakdown = ! empty($config['settings']['showPriceBreakdown']);
		$sticky_summary       = ! empty($config['settings']['stickySummary']);
		$save_enabled         = ! empty($config['settings']['saveEnabled']);

		echo '<section class="wof-configurator wof-layout--' . esc_attr($layout) . '" data-wof-root data-layout="' . esc_attr($layout) . '" data-product-id="' . esc_attr((string) $product_id) . '"';
		echo ' data-revision="' . esc_attr((string) $config['revisionUuid']) . '"';
		echo ' data-show-price-breakdown="' . ($show_price_breakdown ? '1' : '0') . '"';
		echo ' data-sticky-summary="' . ($sticky_summary ? '1' : '0') . '"';
		echo ' data-save-enabled="' . ($save_enabled ? '1' : '0') . '"';
		echo ' style="' . esc_attr($style) . '">';
		echo '<div class="wof-configurator__grid">';
		if ($sticky_summary) {
			$this->render_summary($show_price_breakdown, true);
		}
		echo '<div class="wof-fields" data-wof-fields aria-live="off">';
		foreach ((array) $config['fields'] as $field) {
			if (is_array($field)) {
				$this->render_field($field);
			}
		}
		echo '</div>';
		if (! $sticky_summary) {
			$this->render_summary($show_price_breakdown, false);
		}
		echo '</div>';
		echo '<div class="wof-errors" data-wof-errors role="alert" tabindex="-1" hidden></div>';
		echo '<details class="wof-customer-actions" data-wof-save-panel' . ($save_enabled ? '' : ' hidden') . '>';
		echo '<summary>' . esc_html__('Save this configuration', 'wooptionsfic') . '</summary>';
		echo '<div class="wof-customer-actions__body"><label>' . esc_html__('Configuration name', 'wooptionsfic');
		echo '<input type="text" maxlength="191" value="' . esc_attr__('My configuration', 'wooptionsfic') . '" data-wof-save-name></label>';
		echo '<button type="button" class="wof-button" data-wof-save>' . esc_html__('Save', 'wooptionsfic') . '</button>';
		if (! empty($config['settings']['shareEnabled'])) {
			echo '<button type="button" class="wof-button wof-button--quiet" data-wof-share hidden>' . esc_html__('Create share link', 'wooptionsfic') . '</button>';
		}
		echo '<p data-wof-save-status aria-live="polite"></p><div class="wof-share-link" data-wof-share-link hidden>';
		echo '<input type="url" readonly aria-label="' . esc_attr__('Share link', 'wooptionsfic') . '">';
		echo '<button type="button" class="wof-button wof-button--quiet" data-wof-copy-share>' . esc_html__('Copy', 'wooptionsfic') . '</button></div>';
		echo '</div></details>';
		echo '<input type="hidden" name="wooptionsfic_token" value="' . esc_attr($token) . '">';
		echo '<input type="hidden" name="wooptionsfic_revision" value="' . esc_attr((string) $config['revisionUuid']) . '">';
		echo '<input type="hidden" name="wooptionsfic_selection_json" value="" data-wof-selection-json>';
		echo '<script type="application/json" data-wof-config>';
		echo wp_json_encode($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES);
		echo '</script>';
		echo '</section>';

		$this->analytics->record(
			'view',
			[
				'productId'     => $product_id,
				'optionSetUuid' => (string) ($config['setUuid'] ?? ''),
				'revisionUuid'  => (string) ($config['revisionUuid'] ?? ''),
			]
		);
	}

	private function render_summary(bool $show_price_breakdown, bool $sticky): void {
		$summary_class = $sticky ? 'wof-summary is-sticky' : 'wof-summary';
		echo '<aside class="' . esc_attr($summary_class) . '" data-wof-summary aria-live="polite">';
		echo '<div class="wof-summary__status" data-wof-status>';
		echo '<span class="wof-status-dot" aria-hidden="true"></span>';
		echo '<span>' . esc_html__('Ready for your choices', 'wooptionsfic') . '</span>';
		echo '</div>';
		echo '<div class="wof-summary__rows" data-wof-summary-rows' . ($show_price_breakdown ? '' : ' hidden') . '></div>';
		echo '<div class="wof-summary__total"><span>' . esc_html__('Configured price', 'wooptionsfic') . '</span>';
		echo '<strong data-wof-total>—</strong></div>';
		echo '<small>' . esc_html__('Server-confirmed total, before shipping.', 'wooptionsfic') . '</small>';
		echo '</aside>';
	}

	/**
	 * @param array<string,mixed> $field Field definition.
	 */
	private function render_field(array $field, string $name_prefix = 'wooptionsfic_selection'): void {
		$type = (string) ($field['type'] ?? '');
		$uuid = (string) ($field['uuid'] ?? '');
		if ('' === $uuid) {
			return;
		}
		if (in_array($type, ['heading', 'paragraph', 'help', 'separator', 'spacer'], true)) {
			$this->render_content($field);
			return;
		}
		if (in_array($type, ['formula', 'calculated'], true)) {
			echo '<div class="wof-field wof-field--calculated" data-wof-field="' . esc_attr($uuid) . '">';
			echo '<span class="wof-field__label">' . esc_html((string) $field['label']) . '</span>';
			echo '<output data-wof-calculated="' . esc_attr($uuid) . '">—</output></div>';
			return;
		}

		$description_id = 'wof-description-' . str_replace('-', '', $uuid);
		$required       = ! empty($field['required']);
		$width          = (string) ($field['width'] ?? '100%');
		if (! in_array($width, ['33%', '50%', '66%', '100%'], true)) {
			$width = '100%';
		}
		$classes        = 'wof-field wof-field--' . sanitize_html_class($type);
		$classes       .= ' wof-field--width-' . str_replace('%', '', $width);

		echo '<div class="' . esc_attr($classes) . '" data-wof-field="' . esc_attr($uuid) . '" data-wof-type="' . esc_attr($type) . '"';
		if ('image_swatch' === $type && ! empty($field['updateProductImage'])) {
			echo ' data-wof-update-product-image="1"';
		}
		if (! empty($field['minChoices'])) {
			echo ' data-wof-min-choices="' . esc_attr((string) $field['minChoices']) . '"';
		}
		if (! empty($field['maxChoices'])) {
			echo ' data-wof-max-choices="' . esc_attr((string) $field['maxChoices']) . '"';
		}
		echo '>';

		if (! in_array($type, ['checkbox', 'toggle'], true)) {
			echo '<label class="wof-field__label" for="wof-' . esc_attr($uuid) . '">';
			echo esc_html((string) ($field['label'] ?? __('Option', 'wooptionsfic')));
			if ($required) {
				echo ' <span class="wof-required" aria-hidden="true">*</span><span class="screen-reader-text">' . esc_html__('required', 'wooptionsfic') . '</span>';
			}
			echo '</label>';
		}
		if ('' !== (string) ($field['description'] ?? '')) {
			echo '<p class="wof-field__description" id="' . esc_attr($description_id) . '">' . esc_html((string) $field['description']) . '</p>';
		}

		$name = $name_prefix . '[' . $uuid . ']';
		if (in_array($type, ['select', 'font'], true)) {
			$this->render_select($field, $name, $description_id);
		} elseif ('color_swatch' === $type) {
			$this->render_color_swatches($field, $name, $description_id);
		} elseif ('image_swatch' === $type) {
			$this->render_image_swatches($field, $name, $description_id);
		} elseif ('radio' === $type) {
			$this->render_radio_list($field, $name, $description_id);
		} elseif ('checkbox_group' === $type) {
			$this->render_checkbox_list($field, $name, $description_id);
		} elseif (in_array($type, ['segmented', 'product'], true)) {
			$this->render_choices($field, $name, $description_id);
		} elseif (in_array($type, ['checkbox', 'toggle'], true)) {
			$this->render_boolean($field, $name, $description_id);
		} elseif ('file' === $type) {
			$this->render_upload($field, $name, $description_id);
		} elseif ('repeater' === $type) {
			$this->render_repeater($field, $name);
		} elseif ('color_picker' === $type) {
			$this->render_color_picker($field, $name, $description_id);
		} else {
			$this->render_scalar($field, $name, $description_id);
		}

		if ('' !== (string) ($field['help'] ?? '')) {
			echo '<p class="wof-field__help">' . esc_html((string) $field['help']) . '</p>';
		}
		echo '<p class="wof-field__error" data-wof-field-error aria-live="polite"></p>';
		echo '</div>';
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_select(array $field, string $name, string $description_id): void {
		$uuid = (string) $field['uuid'];
		echo '<select id="wof-' . esc_attr($uuid) . '" name="' . esc_attr($name) . '"';
		echo $this->input_attributes($field, $description_id) . '>';
		echo '<option value="">' . esc_html__('Choose an option', 'wooptionsfic') . '</option>';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$selected = ! empty($choice['default']) || (string) ($field['default'] ?? '') === (string) ($choice['uuid'] ?? '');
			echo '<option value="' . esc_attr((string) $choice['uuid']) . '"' . selected($selected, true, false);
			echo disabled(! empty($choice['disabled']), true, false) . '>';
			echo esc_html((string) $choice['label'] . $this->choice_price_text((array) $choice));
			echo '</option>';
		}
		echo '</select>';
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_choices(array $field, string $name, string $description_id): void {
		$type     = (string) $field['type'];
		$multiple = ! empty($field['multiple']) || 'product' === $type;
		$input    = $multiple ? 'checkbox' : 'radio';
		$group    = $multiple ? $name . '[]' : $name;
		$choice_item_style = '';
		if (isset($field['choiceWidth']) && '' !== (string) $field['choiceWidth']) {
			$choice_item_style .= 'min-width:' . esc_attr((string) $field['choiceWidth']) . 'px;';
		}
		if (isset($field['choiceHeight']) && '' !== (string) $field['choiceHeight']) {
			$choice_item_style .= 'min-height:' . esc_attr((string) $field['choiceHeight']) . 'px;';
		}
		if (isset($field['choiceBorderRadius']) && '' !== (string) $field['choiceBorderRadius']) {
			$choice_item_style .= 'border-radius:' . esc_attr((string) $field['choiceBorderRadius']) . 'px;';
		}

		// Determine display direction for segmented (button choices) field.
		$is_vertical     = 'segmented' === $type && 'vertical' === (string) ($field['displayDirection'] ?? 'horizontal');
		$grid_class      = 'wof-choice-grid';
		if ($is_vertical) {
			$grid_class .= ' wof-choice-grid--vertical';
		}
		$dir_attr = $is_vertical ? ' data-direction="vertical"' : '';

		echo '<div class="' . esc_attr($grid_class) . '" role="group" aria-label="' . esc_attr((string) $field['label']) . '"' . $dir_attr . '>';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid  = (string) ($choice['uuid'] ?? '');
			$id           = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked      = ! empty($choice['default']);
			$label_class  = 'segmented' === $type ? 'wof-choice wof-choice--btn' : 'wof-choice';
			echo '<label class="' . esc_attr($label_class) . '" for="' . esc_attr($id) . '"' . ('' !== $choice_item_style ? ' style="' . $choice_item_style . '"' : '') . '>';
			echo '<input id="' . esc_attr($id) . '" type="' . esc_attr($input) . '" name="' . esc_attr($group) . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			echo ' aria-describedby="' . esc_attr($description_id) . '">';
			if ('color_swatch' === $type && '' !== (string) ($choice['color'] ?? '')) {
				echo '<span class="wof-choice__swatch" style="--wof-swatch:' . esc_attr((string) $choice['color']) . '" aria-hidden="true"></span>';
			}
			$image_html = '';
			if ((int) ($choice['imageId'] ?? 0) > 0) {
				$image_html = (string) wp_get_attachment_image((int) $choice['imageId'], 'thumbnail', false, ['class' => 'wof-choice__image', 'alt' => '']);
			}
			if ('' === $image_html && '' !== (string) ($choice['imageUrl'] ?? '')) {
				$image_html = '<img class="wof-choice__image" src="' . esc_url((string) $choice['imageUrl']) . '" alt="">';
			}
			echo wp_kses_post($image_html);
			echo '<span class="wof-choice__body"><strong>' . esc_html((string) $choice['label']) . '</strong>';
			if ('' !== (string) ($choice['description'] ?? '')) {
				echo '<small>' . esc_html((string) $choice['description']) . '</small>';
			}
			echo '<span class="wof-choice__price">' . esc_html($this->choice_price_text((array) $choice)) . '</span>';
			if (! empty($field['enableQuantity'])) {
				$min_qty = max(1, (int) ($field['minQuantity'] ?? 1));
				$max_qty = ! empty($field['maxQuantity']) ? max($min_qty, (int) $field['maxQuantity']) : 9999;
				echo '<span class="wof-choice-qty-wrap" onclick="event.stopPropagation();"><input type="number" class="wof-choice-qty-input" name="' . esc_attr($name . '_qty[' . $choice_uuid . ']') . '" value="' . esc_attr((string) $min_qty) . '" min="' . esc_attr((string) $min_qty) . '" max="' . esc_attr((string) $max_qty) . '" aria-label="' . esc_attr__('Quantity', 'wooptionsfic') . '"></span>';
			}
			echo '</span>';
			echo '<span class="wof-choice__check" aria-hidden="true"><svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></span></label>';
		}
		echo '</div>';
	}

	/**
	 * Render color swatches as color blocks with label + price below.
	 *
	 * @param array<string,mixed> $field Field.
	 */
	private function render_color_swatches(array $field, string $name, string $description_id): void {
		$multiple = ! empty($field['multiple']);
		$input    = $multiple ? 'checkbox' : 'radio';
		$group    = $multiple ? $name . '[]' : $name;
		$swatch_style = '';
		if (isset($field['choiceWidth']) && '' !== (string) $field['choiceWidth']) {
			$swatch_style .= 'width:' . esc_attr((string) $field['choiceWidth']) . 'px;';
		}
		if (isset($field['choiceHeight']) && '' !== (string) $field['choiceHeight']) {
			$swatch_style .= 'height:' . esc_attr((string) $field['choiceHeight']) . 'px;';
		}
		if (isset($field['choiceBorderRadius']) && '' !== (string) $field['choiceBorderRadius']) {
			$swatch_style .= 'border-radius:' . esc_attr((string) $field['choiceBorderRadius']) . 'px;';
		}

		echo '<div class="wof-swatches" role="group" aria-label="' . esc_attr((string) $field['label']) . '">';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid = (string) ($choice['uuid'] ?? '');
			$id          = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked     = ! empty($choice['default']);
			$color       = (string) ($choice['color'] ?? '#ddd');
			echo '<label class="wof-swatch-item" for="' . esc_attr($id) . '">';
			echo '<input id="' . esc_attr($id) . '" type="' . esc_attr($input) . '" name="' . esc_attr($group) . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			echo ' aria-describedby="' . esc_attr($description_id) . '">';
			echo '<span class="wof-swatch-item__color" style="background:' . esc_attr($color) . ';' . $swatch_style . '" aria-hidden="true">';
			echo '<span class="wof-swatch-item__check" aria-hidden="true"><svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></span>';
			echo '</span>';
			echo '<span class="wof-swatch-item__label">' . esc_html((string) $choice['label']) . '</span>';
			$price_text = $this->choice_price_text((array) $choice, false);
			echo '<span class="wof-swatch-item__price">' . ('' !== $price_text ? esc_html($price_text) : '&nbsp;') . '</span>';
			if (! empty($field['enableQuantity'])) {
				$min_qty = max(1, (int) ($field['minQuantity'] ?? 1));
				$max_qty = ! empty($field['maxQuantity']) ? max($min_qty, (int) $field['maxQuantity']) : 9999;
				echo '<span class="wof-choice-qty-wrap" onclick="event.stopPropagation();"><input type="number" class="wof-choice-qty-input" name="' . esc_attr($name . '_qty[' . $choice_uuid . ']') . '" value="' . esc_attr((string) $min_qty) . '" min="' . esc_attr((string) $min_qty) . '" max="' . esc_attr((string) $max_qty) . '" aria-label="' . esc_attr__('Quantity', 'wooptionsfic') . '"></span>';
			}
			echo '</label>';
		}
		echo '</div>';
	}

	/**
	 * Render image swatches as thumbnail tiles with label + price below.
	 *
	 * @param array<string,mixed> $field Field.
	 */
	private function render_image_swatches(array $field, string $name, string $description_id): void {
		$multiple = ! empty($field['multiple']);
		$input    = $multiple ? 'checkbox' : 'radio';
		$group    = $multiple ? $name . '[]' : $name;
		$thumb_style = '';
		if (isset($field['choiceWidth']) && '' !== (string) $field['choiceWidth']) {
			$thumb_style .= 'width:' . esc_attr((string) $field['choiceWidth']) . 'px;';
		}
		if (isset($field['choiceHeight']) && '' !== (string) $field['choiceHeight']) {
			$thumb_style .= 'height:' . esc_attr((string) $field['choiceHeight']) . 'px;';
		}
		if (isset($field['choiceBorderRadius']) && '' !== (string) $field['choiceBorderRadius']) {
			$thumb_style .= 'border-radius:' . esc_attr((string) $field['choiceBorderRadius']) . 'px;overflow:hidden;';
		}

		echo '<div class="wof-image-swatches" role="group" aria-label="' . esc_attr((string) $field['label']) . '">';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid = (string) ($choice['uuid'] ?? '');
			$id          = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked     = ! empty($choice['default']);
			echo '<label class="wof-image-swatch-item" for="' . esc_attr($id) . '">';
			echo '<input id="' . esc_attr($id) . '" type="' . esc_attr($input) . '" name="' . esc_attr($group) . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			if (! empty($field['updateProductImage'])) {
				$product_image_url = '';
				if ((int) ($choice['imageId'] ?? 0) > 0) {
					$resolved = wp_get_attachment_image_url((int) $choice['imageId'], 'woocommerce_single');
					if (! is_string($resolved) || '' === $resolved) {
						$resolved = wp_get_attachment_image_url((int) $choice['imageId'], 'full');
					}
					$product_image_url = is_string($resolved) ? $resolved : '';
				}
				if ('' === $product_image_url) {
					$product_image_url = (string) ($choice['imageUrl'] ?? '');
				}
				if ('' !== $product_image_url) {
					echo ' data-wof-product-image-url="' . esc_url($product_image_url) . '"';
				}
			}
			echo ' aria-describedby="' . esc_attr($description_id) . '">';
			echo '<span class="wof-image-swatch-item__thumb" style="' . $thumb_style . '" aria-hidden="true">';
			$image_html = '';
			if ((int) ($choice['imageId'] ?? 0) > 0) {
				$image_html = (string) wp_get_attachment_image((int) $choice['imageId'], 'thumbnail', false, ['class' => 'wof-image-swatch-item__img', 'alt' => '']);
			}
			if ('' === $image_html && '' !== (string) ($choice['imageUrl'] ?? '')) {
				$image_html = '<img class="wof-image-swatch-item__img" src="' . esc_url((string) $choice['imageUrl']) . '" alt="">';
			}
			if ('' !== $image_html) {
				echo wp_kses_post($image_html);
			} else {
				echo '<svg class="wof-image-swatch-item__placeholder" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 5.5h15v13h-15zM7.5 15l3.2-3.5 2.4 2.3 1.9-2 2.5 3.2M9 9.2h.01" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>';
			}
			echo '<span class="wof-image-swatch-item__check" aria-hidden="true"><svg viewBox="0 0 20 20" width="11" height="11" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></span>';
			echo '</span>';
			echo '<span class="wof-image-swatch-item__label">' . esc_html((string) $choice['label']) . '</span>';
			$price_text = $this->choice_price_text((array) $choice, false);
			echo '<span class="wof-image-swatch-item__price">' . ('' !== $price_text ? esc_html($price_text) : '&nbsp;') . '</span>';
			if (! empty($field['enableQuantity'])) {
				$min_qty = max(1, (int) ($field['minQuantity'] ?? 1));
				$max_qty = ! empty($field['maxQuantity']) ? max($min_qty, (int) $field['maxQuantity']) : 9999;
				echo '<span class="wof-choice-qty-wrap" onclick="event.stopPropagation();"><input type="number" class="wof-choice-qty-input" name="' . esc_attr($name . '_qty[' . $choice_uuid . ']') . '" value="' . esc_attr((string) $min_qty) . '" min="' . esc_attr((string) $min_qty) . '" max="' . esc_attr((string) $max_qty) . '" aria-label="' . esc_attr__('Quantity', 'wooptionsfic') . '"></span>';
			}
			echo '</label>';
		}
		echo '</div>';
	}

	/**
	 * Render radio field as a vertical list with standard radio buttons.
	 *
	 * @param array<string,mixed> $field Field.
	 */
	private function render_radio_list(array $field, string $name, string $description_id): void {
		$is_two_cols  = in_array((string) ($field['columns'] ?? 'one'), ['two', '2'], true);
		$list_class   = 'wof-radio-list' . ($is_two_cols ? ' wof-radio-list--cols-2' : '');
		$col_attr     = $is_two_cols ? ' data-columns="2"' : '';
		$image_style  = (string) ($field['imageStyle'] ?? 'normal');
		$img_base_cls = 'circle' === $image_style ? 'wof-choice-img wof-choice-img--circle' : 'wof-choice-img';

		echo '<div class="' . esc_attr($list_class) . '" role="radiogroup" aria-label="' . esc_attr((string) $field['label']) . '"' . $col_attr . '>';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid = (string) ($choice['uuid'] ?? '');
			$id          = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked     = ! empty($choice['default']) || (string) ($field['default'] ?? '') === $choice_uuid;
			echo '<label class="wof-radio-item" for="' . esc_attr($id) . '">';
			echo '<input id="' . esc_attr($id) . '" type="radio" name="' . esc_attr($name) . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			echo ' aria-describedby="' . esc_attr($description_id) . '">';

			$image_html = '';
			if ((int) ($choice['imageId'] ?? 0) > 0) {
				$image_html = (string) wp_get_attachment_image((int) $choice['imageId'], 'thumbnail', false, ['class' => $img_base_cls, 'alt' => '']);
			}
			if ('' === $image_html && '' !== (string) ($choice['imageUrl'] ?? '')) {
				$image_html = '<img class="' . esc_attr($img_base_cls) . '" src="' . esc_url((string) $choice['imageUrl']) . '" alt="">';
			}
			if ('' !== $image_html) {
				echo wp_kses_post($image_html);
			}

			echo '<span class="wof-radio-item__label">' . esc_html((string) $choice['label']) . '</span>';
			$price_text = $this->choice_price_text((array) $choice, false);
			if ('' !== $price_text) {
				echo '<span class="wof-radio-item__price">' . esc_html($price_text) . '</span>';
			}
			echo '</label>';
		}
		echo '</div>';
	}

	/**
	 * Render checkbox group as a vertical list with standard checkboxes.
	 *
	 * @param array<string,mixed> $field Field.
	 */
	private function render_checkbox_list(array $field, string $name, string $description_id): void {
		$is_two_cols  = in_array((string) ($field['columns'] ?? 'one'), ['two', '2'], true);
		$list_class   = 'wof-checkbox-list' . ($is_two_cols ? ' wof-checkbox-list--cols-2' : '');
		$col_attr     = $is_two_cols ? ' data-columns="2"' : '';
		$image_style  = (string) ($field['imageStyle'] ?? 'normal');
		$img_base_cls = 'circle' === $image_style ? 'wof-choice-img wof-choice-img--circle' : 'wof-choice-img';

		echo '<div class="' . esc_attr($list_class) . '" role="group" aria-label="' . esc_attr((string) $field['label']) . '"' . $col_attr . '>';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid = (string) ($choice['uuid'] ?? '');
			$id          = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked     = ! empty($choice['default']);
			echo '<label class="wof-checkbox-item" for="' . esc_attr($id) . '">';
			echo '<input id="' . esc_attr($id) . '" type="checkbox" name="' . esc_attr($name . '[]') . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			echo ' aria-describedby="' . esc_attr($description_id) . '">';

			$image_html = '';
			if ((int) ($choice['imageId'] ?? 0) > 0) {
				$image_html = (string) wp_get_attachment_image((int) $choice['imageId'], 'thumbnail', false, ['class' => $img_base_cls, 'alt' => '']);
			}
			if ('' === $image_html && '' !== (string) ($choice['imageUrl'] ?? '')) {
				$image_html = '<img class="' . esc_attr($img_base_cls) . '" src="' . esc_url((string) $choice['imageUrl']) . '" alt="">';
			}
			if ('' !== $image_html) {
				echo wp_kses_post($image_html);
			}

			echo '<span class="wof-checkbox-item__label">' . esc_html((string) $choice['label']) . '</span>';
			$price_text = $this->choice_price_text((array) $choice, false);
			if ('' !== $price_text) {
				echo '<span class="wof-checkbox-item__price">' . esc_html($price_text) . '</span>';
			}
			echo '</label>';
		}
		echo '</div>';
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_boolean(array $field, string $name, string $description_id): void {
		$uuid = (string) $field['uuid'];
		echo '<label class="wof-boolean" for="wof-' . esc_attr($uuid) . '">';
		echo '<input id="wof-' . esc_attr($uuid) . '" type="checkbox" name="' . esc_attr($name) . '" value="1"';
		echo checked(! empty($field['default']), true, false) . $this->input_attributes($field, $description_id) . '>';
		echo '<span class="wof-boolean__control" aria-hidden="true"></span>';
		echo '<span><strong>' . esc_html((string) $field['label']) . '</strong>';
		if ('' !== (string) ($field['description'] ?? '')) {
			echo '<small>' . esc_html((string) $field['description']) . '</small>';
		}
		echo '</span></label>';
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_color_picker(array $field, string $name, string $description_id): void {
		$uuid  = (string) $field['uuid'];
		$value = strtoupper((string) ($field['default'] ?? '#5B4FF5'));
		if (1 !== preg_match('/\A#[0-9A-F]{6}\z/', $value)) {
			$value = '#5B4FF5';
		}
		echo '<div class="wof-color-picker" data-wof-color-picker>';
		echo '<input id="wof-' . esc_attr($uuid) . '" type="color" name="' . esc_attr($name) . '" value="' . esc_attr($value) . '" data-wof-color-input';
		echo $this->input_attributes($field, $description_id) . '>';
		echo '<span class="wof-color-picker__value"><strong data-wof-color-value>' . esc_html($value) . '</strong><small>' . esc_html__('Click to choose a color', 'wooptionsfic') . '</small></span>';
		echo '<svg class="wof-color-picker__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2.1-.82 2.1-1.72 0-.55-.28-1.02-.28-1.52 0-.82.67-1.49 1.49-1.49h1.22A3.97 3.97 0 0 0 20.5 11.8 8.3 8.3 0 0 0 12 3.5Zm-4.1 9.05a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm1.7-4.1a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm4.3-.7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm3.1 3.25a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" fill="currentColor"/></svg>';
		echo '</div>';
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_scalar(array $field, string $name, string $description_id): void {
		$type_map = [
			'textarea' => 'textarea', 'password' => 'password', 'tel' => 'tel', 'email' => 'email',
			'url' => 'url', 'number' => 'number', 'range' => 'range', 'quantity' => 'number',
			'date' => 'date', 'time' => 'time', 'datetime' => 'datetime-local',
			'customer_defined_price' => 'number', 'color_picker' => 'color', 'text' => 'text',
		];
		$type = (string) ($field['type'] ?? 'text');
		$uuid = (string) $field['uuid'];
		if ('textarea' === $type) {
			echo '<textarea id="wof-' . esc_attr($uuid) . '" name="' . esc_attr($name) . '" placeholder="' . esc_attr((string) ($field['placeholder'] ?? '')) . '"';
			echo $this->input_attributes($field, $description_id) . '>' . esc_textarea((string) ($field['default'] ?? '')) . '</textarea>';
			return;
		}
		if ('date_range' === $type) {
			echo '<div class="wof-date-range"><input type="date" name="' . esc_attr($name . '[start]') . '" aria-label="' . esc_attr__('Start date', 'wooptionsfic') . '">';
			echo '<span aria-hidden="true">→</span><input type="date" name="' . esc_attr($name . '[end]') . '" aria-label="' . esc_attr__('End date', 'wooptionsfic') . '"></div>';
			return;
		}
		if ('tel' === $type) {
			$flag_style      = (string) ($field['flagStyle'] ?? 'number_only');
			$default_country = strtoupper((string) ($field['defaultCountry'] ?? 'US'));
			if ('number_only' !== $flag_style) {
				$countries    = $this->country_definitions();
				$curr_country = $countries[$default_country] ?? $countries['US'];
				$dial_code    = $curr_country['dial'];
				$flag_svg     = $this->country_flag_svg($default_country);

				echo '<div class="wof-phone-field-wrap" data-wof-phone-wrap>';
				echo '<div class="wof-phone-picker" data-wof-phone-picker>';
				echo '<span class="wof-phone-picker__display" data-wof-phone-display>';
				echo '<span class="wof-phone-picker__flag" data-wof-flag-slot>' . $flag_svg . '</span>';
				echo '<span class="wof-phone-picker__code" data-wof-country-slot>' . esc_html($default_country) . '</span>';
				if ('number_flag_dialcode' === $flag_style) {
					echo '<span class="wof-phone-picker__dial" data-wof-dial-slot>' . esc_html($dial_code) . '</span>';
				}
				echo '<svg class="wof-phone-picker__chevron" viewBox="0 0 20 20" width="12" height="12" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
				echo '</span>';
				echo '<select class="wof-phone-country-select" name="' . esc_attr($name . '[country]') . '" aria-label="' . esc_attr__('Select country', 'wooptionsfic') . '" data-wof-phone-select>';
				foreach ($countries as $code => $info) {
					echo '<option value="' . esc_attr($code) . '" data-dial="' . esc_attr($info['dial']) . '"' . selected($code, $default_country, false) . '>';
					echo esc_html($info['name'] . ' (' . $info['dial'] . ')');
					echo '</option>';
				}
				echo '</select>';
				echo '</div>';
				echo '<input id="wof-' . esc_attr($uuid) . '" type="tel" name="' . esc_attr($name . '[number]') . '" value="' . esc_attr((string) ($field['default'] ?? '')) . '" class="wof-phone-number-input"';
				echo ' placeholder="' . esc_attr((string) ($field['placeholder'] ?? __('Enter phone number…', 'wooptionsfic'))) . '"';
				echo $this->input_attributes($field, $description_id) . '>';
				echo '</div>';
				return;
			}
		}
		$html_type = $type_map[$type] ?? 'text';
		echo '<input id="wof-' . esc_attr($uuid) . '" type="' . esc_attr($html_type) . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) ($field['default'] ?? '')) . '"';
		echo ' placeholder="' . esc_attr((string) ($field['placeholder'] ?? '')) . '"';
		echo $this->input_attributes($field, $description_id) . '>';
		if ('range' === $type) {
			echo '<output class="wof-range-output" data-wof-range-output>—</output>';
		}
	}

	public function country_definitions(): array {
		return [
			'US' => ['name' => 'United States', 'dial' => '+1'],
			'GB' => ['name' => 'United Kingdom', 'dial' => '+44'],
			'CA' => ['name' => 'Canada', 'dial' => '+1'],
			'AU' => ['name' => 'Australia', 'dial' => '+61'],
			'DE' => ['name' => 'Germany', 'dial' => '+49'],
			'FR' => ['name' => 'France', 'dial' => '+33'],
			'IT' => ['name' => 'Italy', 'dial' => '+39'],
			'ES' => ['name' => 'Spain', 'dial' => '+34'],
			'NL' => ['name' => 'Netherlands', 'dial' => '+31'],
			'BR' => ['name' => 'Brazil', 'dial' => '+55'],
			'IN' => ['name' => 'India', 'dial' => '+91'],
			'CN' => ['name' => 'China', 'dial' => '+86'],
			'JP' => ['name' => 'Japan', 'dial' => '+81'],
			'KR' => ['name' => 'South Korea', 'dial' => '+82'],
			'MX' => ['name' => 'Mexico', 'dial' => '+52'],
			'AE' => ['name' => 'United Arab Emirates', 'dial' => '+971'],
			'SA' => ['name' => 'Saudi Arabia', 'dial' => '+966'],
			'SG' => ['name' => 'Singapore', 'dial' => '+65'],
			'BD' => ['name' => 'Bangladesh', 'dial' => '+880'],
			'PK' => ['name' => 'Pakistan', 'dial' => '+92'],
			'ZA' => ['name' => 'South Africa', 'dial' => '+27'],
			'TR' => ['name' => 'Turkey', 'dial' => '+90'],
			'SE' => ['name' => 'Sweden', 'dial' => '+46'],
			'CH' => ['name' => 'Switzerland', 'dial' => '+41'],
			'PL' => ['name' => 'Poland', 'dial' => '+48'],
			'AR' => ['name' => 'Argentina', 'dial' => '+54'],
			'BE' => ['name' => 'Belgium', 'dial' => '+32'],
			'AT' => ['name' => 'Austria', 'dial' => '+43'],
			'NO' => ['name' => 'Norway', 'dial' => '+47'],
			'DK' => ['name' => 'Denmark', 'dial' => '+45'],
			'FI' => ['name' => 'Finland', 'dial' => '+358'],
			'IE' => ['name' => 'Ireland', 'dial' => '+353'],
			'NZ' => ['name' => 'New Zealand', 'dial' => '+64'],
			'PT' => ['name' => 'Portugal', 'dial' => '+351'],
			'GR' => ['name' => 'Greece', 'dial' => '+30'],
			'IL' => ['name' => 'Israel', 'dial' => '+972'],
			'HK' => ['name' => 'Hong Kong', 'dial' => '+852'],
			'MY' => ['name' => 'Malaysia', 'dial' => '+60'],
			'PH' => ['name' => 'Philippines', 'dial' => '+63'],
			'ID' => ['name' => 'Indonesia', 'dial' => '+62'],
			'TH' => ['name' => 'Thailand', 'dial' => '+66'],
			'VN' => ['name' => 'Vietnam', 'dial' => '+84'],
			'EG' => ['name' => 'Egypt', 'dial' => '+20'],
			'NG' => ['name' => 'Nigeria', 'dial' => '+234'],
			'KE' => ['name' => 'Kenya', 'dial' => '+254'],
		];
	}

	public function country_flag_svg(string $country): string {
		$country = strtoupper(trim($country));
		return match ($country) {
			'BD' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#006A4E" rx="2"/><circle cx="9" cy="7" r="4.2" fill="#F42A41"/></svg>',
			'US' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#B22234" rx="2"/><rect y="2.1" width="20" height="2" fill="#FFFFFF"/><rect y="6.3" width="20" height="2" fill="#FFFFFF"/><rect y="10.5" width="20" height="2" fill="#FFFFFF"/><rect width="8" height="7.2" fill="#3C3B6E"/><circle cx="4" cy="3.6" r="1.5" fill="#FFFFFF"/></svg>',
			'GB' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#012169" rx="2"/><path d="M0 0L20 14M20 0L0 14" stroke="#FFFFFF" stroke-width="2.5"/><path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" stroke-width="1.2"/><path d="M10 0v14M0 7h20" stroke="#FFFFFF" stroke-width="4"/><path d="M10 0v14M0 7h20" stroke="#C8102E" stroke-width="2.2"/></svg>',
			'CA' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#D80027" rx="2"/><rect x="5" width="10" height="14" fill="#FFFFFF"/><polygon points="10,2.5 11,5.5 13.5,5 12,7 13.5,8.5 11,8 10.5,11 9.5,11 9,8 6.5,8.5 8,7 6.5,5 9,5.5" fill="#D80027"/></svg>',
			'AU' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#00008B" rx="2"/><circle cx="14" cy="4" r="1" fill="#FFFFFF"/><circle cx="16" cy="7" r="1" fill="#FFFFFF"/><circle cx="13" cy="10" r="1" fill="#FFFFFF"/></svg>',
			'DE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#000000" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#DD0000"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/></svg>',
			'FR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#002654" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FFFFFF"/><rect x="13.4" width="6.6" height="14" fill="#CE1126"/></svg>',
			'IT' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#009246" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FFFFFF"/><rect x="13.4" width="6.6" height="14" fill="#CE2B37"/></svg>',
			'ES' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="3.5" fill="#AA151B" rx="2"/><rect y="3.5" width="20" height="7" fill="#F1BF00"/><rect y="10.5" width="20" height="3.5" fill="#AA151B"/></svg>',
			'NL' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#AE1C28" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#21468B"/></svg>',
			'BR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#009C3B" rx="2"/><polygon points="10,2 18,7 10,12 2,7" fill="#FEDF00"/><circle cx="10" cy="7" r="2.5" fill="#002776"/></svg>',
			'IN' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#FF9933" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#138808"/><circle cx="10" cy="7" r="1.8" fill="#000080"/></svg>',
			'CN' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#DE2910" rx="2"/><polygon points="4,2.5 4.6,4.2 6.2,4.2 4.9,5.2 5.4,6.8 4,5.8 2.6,6.8 3.1,5.2 1.8,4.2 3.4,4.2" fill="#FFDE00"/></svg>',
			'JP' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#FFFFFF" rx="2"/><circle cx="10" cy="7" r="4" fill="#BC002D"/></svg>',
			'KR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#FFFFFF" rx="2"/><circle cx="10" cy="7" r="3.5" fill="#CD2E3A"/><path d="M10 7a3.5 3.5 0 0 1 0 3.5 3.5 3.5 0 0 0 0-7z" fill="#0047A0"/></svg>',
			'MX' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#006847" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FFFFFF"/><rect x="13.4" width="6.6" height="14" fill="#CE1126"/><circle cx="10" cy="7" r="1.5" fill="#8B5A2B"/></svg>',
			'AE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect y="0" width="20" height="4.66" fill="#00732F" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#000000"/><rect width="5" height="14" fill="#FF0000"/></svg>',
			'SA' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#006C35" rx="2"/><rect x="4" y="6.2" width="12" height="1.6" fill="#FFFFFF"/></svg>',
			'SG' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="7" fill="#ED2939" rx="2"/><rect y="7" width="20" height="7" fill="#FFFFFF"/><circle cx="4.5" cy="3.5" r="2.2" fill="#FFFFFF"/><circle cx="5.2" cy="3.5" r="1.8" fill="#ED2939"/></svg>',
			'PK' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="5" height="14" fill="#FFFFFF" rx="2"/><rect x="5" width="15" height="14" fill="#01411C"/><circle cx="12" cy="7" r="3.2" fill="#FFFFFF"/><circle cx="13" cy="6.4" r="2.7" fill="#01411C"/></svg>',
			'ZA' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="7" fill="#E03C31" rx="2"/><rect y="7" width="20" height="7" fill="#001489"/><polygon points="0,0 8,7 0,14" fill="#000000"/><path d="M0 0l8.5 7-8.5 7h3l7-5.5v-3l-7-5.5z" fill="#FFB81C"/><path d="M8 5.5h12v3h-12z" fill="#007749"/></svg>',
			'TR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#E30A17" rx="2"/><circle cx="8" cy="7" r="3.5" fill="#FFFFFF"/><circle cx="9" cy="7" r="2.8" fill="#E30A17"/><polygon points="12.5,5.5 13.5,7 15,7 13.8,8 14.2,9.5 13,8.5 11.8,9.5 12.2,8 11,7 12.5,7" fill="#FFFFFF"/></svg>',
			'SE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#005293" rx="2"/><rect x="6" width="3" height="14" fill="#FECB00"/><rect y="5.5" width="20" height="3" fill="#FECB00"/></svg>',
			'CH' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#D52B1E" rx="2"/><rect x="8.5" y="3" width="3" height="8" fill="#FFFFFF"/><rect x="6" y="5.5" width="8" height="3" fill="#FFFFFF"/></svg>',
			'PL' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="7" fill="#FFFFFF" rx="2"/><rect y="7" width="20" height="7" fill="#DC143C"/></svg>',
			'AR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#74ACDF" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#74ACDF"/><circle cx="10" cy="7" r="1.6" fill="#F6B40E"/></svg>',
			'BE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#000000" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FDDA24"/><rect x="13.4" width="6.6" height="14" fill="#EF3340"/></svg>',
			'AT' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#ED2939" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#ED2939"/></svg>',
			'NO' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#BA0C2F" rx="2"/><rect x="5.5" width="4" height="14" fill="#FFFFFF"/><rect y="5" width="20" height="4" fill="#FFFFFF"/><rect x="6.5" width="2" height="14" fill="#00205B"/><rect y="6" width="20" height="2" fill="#00205B"/></svg>',
			'DK' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#C60C30" rx="2"/><rect x="6" width="2.5" height="14" fill="#FFFFFF"/><rect y="5.7" width="20" height="2.5" fill="#FFFFFF"/></svg>',
			'FI' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#FFFFFF" rx="2"/><rect x="6" width="3" height="14" fill="#002F6C"/><rect y="5.5" width="20" height="3" fill="#002F6C"/></svg>',
			'IE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#169B62" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FFFFFF"/><rect x="13.4" width="6.6" height="14" fill="#FF883E"/></svg>',
			'NZ' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#00247D" rx="2"/><circle cx="14" cy="4" r="1.1" fill="#CC142B"/><circle cx="16.5" cy="7" r="1.1" fill="#CC142B"/><circle cx="13" cy="10" r="1.1" fill="#CC142B"/></svg>',
			'PT' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="8" height="14" fill="#046A38" rx="2"/><rect x="8" width="12" height="14" fill="#DA291C"/><circle cx="8" cy="7" r="2.5" fill="#FFE900"/></svg>',
			'GR' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#0D5EAF" rx="2"/><rect y="1.5" width="20" height="1.5" fill="#FFFFFF"/><rect y="4.6" width="20" height="1.5" fill="#FFFFFF"/><rect y="7.7" width="20" height="1.5" fill="#FFFFFF"/><rect y="10.8" width="20" height="1.5" fill="#FFFFFF"/><rect width="7.5" height="7.7" fill="#0D5EAF"/><rect x="3" width="1.5" height="7.7" fill="#FFFFFF"/><rect y="3.1" width="7.5" height="1.5" fill="#FFFFFF"/></svg>',
			'IL' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#FFFFFF" rx="2"/><rect y="1.5" width="20" height="2" fill="#0038B8"/><rect y="10.5" width="20" height="2" fill="#0038B8"/><polygon points="10,4.5 12,8 8,8" stroke="#0038B8" stroke-width="0.7" fill="none"/><polygon points="10,9 12,5.5 8,5.5" stroke="#0038B8" stroke-width="0.7" fill="none"/></svg>',
			'HK' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#C8102E" rx="2"/><circle cx="10" cy="7" r="3" fill="#FFFFFF"/></svg>',
			'MY' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#CC0000" rx="2"/><rect y="2" width="20" height="2" fill="#FFFFFF"/><rect y="6" width="20" height="2" fill="#FFFFFF"/><rect y="10" width="20" height="2" fill="#FFFFFF"/><rect width="10" height="8" fill="#010066"/><circle cx="5" cy="4" r="2.5" fill="#FFCC00"/><circle cx="5.8" cy="4" r="2.1" fill="#010066"/></svg>',
			'PH' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="7" fill="#0038A8" rx="2"/><rect y="7" width="20" height="7" fill="#CE1126"/><polygon points="0,0 8,7 0,14" fill="#FFFFFF"/><circle cx="2.8" cy="7" r="1.3" fill="#FCD116"/></svg>',
			'ID' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="7" fill="#CE1126" rx="2"/><rect y="7" width="20" height="7" fill="#FFFFFF"/></svg>',
			'TH' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#A51931" rx="2"/><rect y="2.3" width="20" height="9.4" fill="#F4F5F8"/><rect y="4.6" width="20" height="4.8" fill="#2D2A4A"/></svg>',
			'VN' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" fill="#DA251D" rx="2"/><polygon points="10,3.5 11.2,7.2 14.8,7.2 11.9,9.4 13,13 10,10.8 7,13 8.1,9.4 5.2,7.2 8.8,7.2" fill="#FFFF00"/></svg>',
			'EG' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4.66" fill="#CE1126" rx="2"/><rect y="4.66" width="20" height="4.66" fill="#FFFFFF"/><rect y="9.33" width="20" height="4.67" fill="#000000"/><circle cx="10" cy="7" r="1.3" fill="#C09A3E"/></svg>',
			'NG' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="6.6" height="14" fill="#008751" rx="2"/><rect x="6.6" width="6.8" height="14" fill="#FFFFFF"/><rect x="13.4" width="6.6" height="14" fill="#008751"/></svg>',
			'KE' => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="4" fill="#000000" rx="2"/><rect y="4" width="20" height="1" fill="#FFFFFF"/><rect y="5" width="20" height="4" fill="#922529"/><rect y="9" width="20" height="1" fill="#FFFFFF"/><rect y="10" width="20" height="4" fill="#006600"/><ellipse cx="10" cy="7" rx="2" ry="3.5" fill="#922529"/><ellipse cx="10" cy="7" rx="0.5" ry="3.5" fill="#FFFFFF"/></svg>',
			default => '<svg class="wof-flag-svg" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true"><rect width="20" height="14" rx="2" fill="#334155"/><text x="10" y="10" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7" font-weight="700" fill="#FFFFFF" text-anchor="middle">' . esc_html(substr($country, 0, 2)) . '</text></svg>',
		};
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function render_upload(array $field, string $name, string $description_id): void {
		$maximum_files = max(1, min(10, (int) ($field['maxFiles'] ?? 1)));
		$maximum_mb    = max(1, min(50, (int) ($field['maxFileMb'] ?? 5)));
		$uuid          = (string) ($field['uuid'] ?? '');
		$input_id      = 'wof-upload-' . $uuid;

		echo '<div class="wof-upload" data-wof-upload data-max-files="' . esc_attr((string) $maximum_files) . '" data-max-file-mb="' . esc_attr((string) $maximum_mb) . '">';
		echo '<input type="hidden" name="' . esc_attr($name . '[]') . '" value="" data-wof-upload-ref data-wof-upload-template>';
		echo '<div class="wof-upload__surface">';
		echo '<div class="wof-upload__picker">';
		echo '<input id="' . esc_attr($input_id) . '" class="wof-upload__input" type="file" data-wof-upload-input aria-describedby="' . esc_attr($description_id) . '" accept="' . esc_attr($this->accept_extensions((array) ($field['allowedExtensions'] ?? []))) . '"';
		echo $maximum_files > 1 ? ' multiple' : '';
		echo '>';
		echo '<span class="wof-upload__button" aria-hidden="true">';
		echo '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.25A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		echo esc_html__('Upload', 'wooptionsfic') . '</span>';
		echo '<span class="wof-upload__hint">' . esc_html__('Click or drag and drop', 'wooptionsfic') . '</span>';
		echo '<small class="wof-upload__limit">' . sprintf(esc_html__('Up to %1$d file(s), %2$d MB each', 'wooptionsfic'), $maximum_files, $maximum_mb) . '</small>';
		echo '</div>';
		echo '<div class="wof-upload__list" data-wof-upload-list aria-live="polite"></div>';
		echo '</div>';
		echo '</div>';
	}

	/**
	 * @param array<string,mixed> $field Repeater.
	 */
	private function render_repeater(array $field, string $name): void {
		$count = max((int) ($field['minRows'] ?? 0), (int) ($field['defaultRows'] ?? 1));
		echo '<div class="wof-repeater" data-wof-repeater data-min="' . esc_attr((string) ($field['minRows'] ?? 0)) . '" data-max="' . esc_attr((string) ($field['maxRows'] ?? 10)) . '">';
		echo '<div data-wof-repeater-rows>';
		for ($index = 0; $index < $count; ++$index) {
			$this->render_repeater_row($field, $name, Uuid::v4(), $index + 1);
		}
		echo '</div><button type="button" class="wof-button wof-button--quiet" data-wof-add-row>＋ ' . esc_html__('Add another', 'wooptionsfic') . '</button>';
		echo '<div class="screen-reader-text" aria-live="polite" data-wof-repeater-live></div></div>';
	}

	/**
	 * @param array<string,mixed> $field Repeater.
	 */
	private function render_repeater_row(array $field, string $name, string $row_uuid, int $number): void {
		$title = str_replace('{index}', (string) $number, (string) ($field['rowTitle'] ?? __('Item {index}', 'wooptionsfic')));
		echo '<fieldset class="wof-repeater__row" data-wof-row="' . esc_attr($row_uuid) . '"><legend>' . esc_html($title) . '</legend>';
		echo '<div class="wof-repeater__actions"><button type="button" class="wof-icon-button" data-wof-move-row="up" aria-label="' . esc_attr__('Move up', 'wooptionsfic') . '">↑</button>';
		echo '<button type="button" class="wof-icon-button" data-wof-move-row="down" aria-label="' . esc_attr__('Move down', 'wooptionsfic') . '">↓</button>';
		echo '<button type="button" class="wof-icon-button" data-wof-remove-row aria-label="' . esc_attr__('Remove row', 'wooptionsfic') . '">×</button></div>';
		$prefix = $name . '[rows][' . $row_uuid . '][values]';
		foreach ((array) ($field['children'] ?? []) as $child) {
			if (is_array($child)) {
				$this->render_field($child, $prefix);
			}
		}
		echo '</fieldset>';
	}

	/**
	 * @param array<string,mixed> $field Content field.
	 */
	private function render_content(array $field): void {
		$type    = (string) $field['type'];
		$content = (string) ($field['content'] ?? $field['label'] ?? '');
		if ('heading' === $type) {
			echo '<h3 class="wof-content-heading">' . esc_html($content) . '</h3>';
		} elseif (in_array($type, ['paragraph', 'help'], true)) {
			echo '<div class="wof-content wof-content--' . esc_attr($type) . '">' . wp_kses_post($content) . '</div>';
		} elseif ('separator' === $type) {
			echo '<hr class="wof-separator">';
		} else {
			echo '<div class="wof-spacer" aria-hidden="true"></div>';
		}
	}

	/**
	 * @param array<string,mixed> $field Field.
	 */
	private function input_attributes(array $field, string $description_id): string {
		$attributes = '';
		if (! empty($field['required'])) {
			$attributes .= ' aria-required="true"';
		}
		if (! empty($field['disabled'])) {
			$attributes .= ' disabled';
		}
		if ('' !== (string) ($field['description'] ?? '')) {
			$attributes .= ' aria-describedby="' . esc_attr($description_id) . '"';
		}
		foreach (['min', 'max', 'step'] as $key) {
			if (null !== ($field[$key] ?? null) && '' !== (string) $field[$key]) {
				$attributes .= ' ' . $key . '="' . esc_attr((string) $field[$key]) . '"';
			}
		}
		if ((int) ($field['maxLength'] ?? 0) > 0) {
			$attributes .= ' maxlength="' . esc_attr((string) $field['maxLength']) . '"';
		}
		return $attributes;
	}

	/**
	 * @param array<string,mixed> $choice Choice.
	 */
	private function choice_price_text(array $choice, bool $parentheses = true): string {
		$pricing  = (array) ($choice['pricing'] ?? []);
		$strategy = (string) ($pricing['strategy'] ?? 'none');
		$currency = function_exists('get_woocommerce_currency_symbol')
			? html_entity_decode((string) get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8')
			: '';
		if ('' === $currency && function_exists('get_woocommerce_currency')) {
			$currency = (string) get_woocommerce_currency();
		}
		if ('' === $currency) {
			$currency = '$';
		}
		if ('fixed' === $strategy && '0' !== (string) ($pricing['amount'] ?? '0')) {
			$raw = trim((string) ($pricing['amount'] ?? '0'));
			$is_negative = str_starts_with($raw, '-');
			$clean = $is_negative ? substr($raw, 1) : (str_starts_with($raw, '+') ? substr($raw, 1) : $raw);
			$prefix = $is_negative ? '-' : '+';
			$text = $prefix . $currency . $clean;
			return $parentheses ? ' (' . $text . ')' : $text;
		}
		if ('percentage' === $strategy && '0' !== (string) ($pricing['percent'] ?? '0')) {
			$raw = trim((string) ($pricing['percent'] ?? '0'));
			$is_negative = str_starts_with($raw, '-');
			$clean = $is_negative ? substr($raw, 1) : (str_starts_with($raw, '+') ? substr($raw, 1) : $raw);
			$prefix = $is_negative ? '-' : '+';
			$text = $prefix . $clean . '%';
			return $parentheses ? ' (' . $text . ')' : $text;
		}
		return '';
	}

	/**
	 * @param list<string> $extensions Extensions.
	 */
	private function accept_extensions(array $extensions): string {
		return implode(',', array_map(static fn (string $extension): string => '.' . sanitize_key($extension), $extensions));
	}

	/**
	 * @param array<string,mixed> $tokens Tokens.
	 * @param array<string,mixed> $typography Typography.
	 */
	private function css_variables(array $tokens, array $typography): string {
		$css = [];
		foreach ($tokens as $key => $value) {
			if (is_string($value) && 1 === preg_match('/\A(?:#[0-9A-Fa-f]{6}|currentColor|Canvas|transparent)\z/', $value)) {
				$css[] = '--wof-' . strtolower((string) preg_replace('/([a-z])([A-Z])/', '$1-$2', $key)) . ':' . $value;
			}
		}

		$family = (string) ($typography['family'] ?? 'inherit');
		$css[] = '--wof-font:' . $this->font_stack($family);
		$css[] = '--wof-label-weight:' . max(400, min(800, (int) ($typography['labelWeight'] ?? 650)));
		$css[] = '--wof-body-weight:' . max(300, min(700, (int) ($typography['bodyWeight'] ?? 450)));
		$css[] = '--wof-font-size:' . max(16, min(24, (int) ($typography['desktopSize'] ?? 16))) . 'px';
		$css[] = '--wof-line-height:' . max(1.2, min(2.0, (float) ($typography['lineHeight'] ?? 1.5)));
		return implode(';', $css);
	}

	private function font_stack(string $family): string {
		return match ($family) {
			'Inter'             => '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'Manrope'           => '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'Poppins'           => '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'Outfit'            => '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'Plus Jakarta Sans' => '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			'Roboto'            => '"Roboto", Arial, sans-serif',
			'system-ui'         => 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			default             => 'inherit',
		};
	}

	private function enqueue_typography_font(array $typography): void {
		$family = (string) ($typography['family'] ?? 'inherit');
		$queries = [
			'Inter'             => 'Inter:wght@300;400;500;600;700;800',
			'Manrope'           => 'Manrope:wght@300;400;500;600;700;800',
			'Poppins'           => 'Poppins:wght@300;400;500;600;700;800',
			'Outfit'            => 'Outfit:wght@300;400;500;600;700;800',
			'Plus Jakarta Sans' => 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800',
			'Roboto'            => 'Roboto:wght@300;400;500;600;700;800',
		];
		if (! isset($queries[$family])) {
			return;
		}
		$handle = 'wooptionsfic-font-' . sanitize_key($family);
		$url = 'https://fonts.googleapis.com/css2?family=' . $queries[$family] . '&display=swap';
		wp_enqueue_style($handle, $url, [], null);
	}
}
