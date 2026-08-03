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
		$classes        = 'wof-field wof-field--' . sanitize_html_class($type);
		echo '<div class="' . esc_attr($classes) . '" data-wof-field="' . esc_attr($uuid) . '" data-wof-type="' . esc_attr($type) . '"';
		if ('image_swatch' === $type && ! empty($field['updateProductImage'])) {
			echo ' data-wof-update-product-image="1"';
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
		} elseif (in_array($type, ['radio', 'segmented', 'color_swatch', 'image_swatch', 'product', 'checkbox_group'], true)) {
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
		$multiple = ! empty($field['multiple']) || in_array($type, ['checkbox_group', 'product'], true);
		$input    = $multiple ? 'checkbox' : 'radio';
		$group    = $multiple ? $name . '[]' : $name;
		echo '<div class="wof-choice-grid" role="group" aria-label="' . esc_attr((string) $field['label']) . '">';
		foreach ((array) ($field['choices'] ?? []) as $choice) {
			$choice_uuid = (string) ($choice['uuid'] ?? '');
			$id          = 'wof-' . $field['uuid'] . '-' . $choice_uuid;
			$checked     = ! empty($choice['default']);
			echo '<label class="wof-choice" for="' . esc_attr($id) . '">';
			echo '<input id="' . esc_attr($id) . '" type="' . esc_attr($input) . '" name="' . esc_attr($group) . '" value="' . esc_attr($choice_uuid) . '"';
			echo checked($checked, true, false) . disabled(! empty($choice['disabled']), true, false);
			if ('image_swatch' === $type && ! empty($field['updateProductImage'])) {
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
			echo '<span class="wof-choice__price">' . esc_html($this->choice_price_text((array) $choice)) . '</span></span>';
			echo '<span class="wof-choice__check" aria-hidden="true">✓</span></label>';
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
		$html_type = $type_map[$type] ?? 'text';
		echo '<input id="wof-' . esc_attr($uuid) . '" type="' . esc_attr($html_type) . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) ($field['default'] ?? '')) . '"';
		echo ' placeholder="' . esc_attr((string) ($field['placeholder'] ?? '')) . '"';
		echo $this->input_attributes($field, $description_id) . '>';
		if ('range' === $type) {
			echo '<output class="wof-range-output" data-wof-range-output>—</output>';
		}
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
	 * @param array<string,mixed> $field Field.
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
	private function choice_price_text(array $choice): string {
		$pricing  = (array) ($choice['pricing'] ?? []);
		$strategy = (string) ($pricing['strategy'] ?? 'none');
		if ('fixed' === $strategy && '0' !== (string) ($pricing['amount'] ?? '0')) {
			return ' (+' . (string) $pricing['amount'] . ')';
		}
		if ('percentage' === $strategy && '0' !== (string) ($pricing['percent'] ?? '0')) {
			return ' (+' . (string) $pricing['percent'] . '%)';
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
