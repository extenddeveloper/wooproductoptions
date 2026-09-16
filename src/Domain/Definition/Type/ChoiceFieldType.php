<?php
/**
 * Choice field type.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Definition\Type;

use WooOptionsFic\Domain\Support\Uuid;

final class ChoiceFieldType extends AbstractFieldType {
	public function __construct(
		private readonly string $type_key,
		private readonly bool $multiple = false
	) {
	}

	public function key(): string {
		return $this->type_key;
	}

	public function normalize_definition(array $definition): array {
		$normalized = $this->base_definition($definition);
		$choices    = [];

		foreach ((array) ($definition['choices'] ?? []) as $choice) {
			if (! is_array($choice)) {
				continue;
			}
			$uuid = (string) ($choice['uuid'] ?? '');
			if (! Uuid::is_valid($uuid)) {
				$uuid = Uuid::v4();
			}
			$image_id  = max(0, (int) ($choice['imageId'] ?? 0));
			$image_url = $this->safe_asset_url((string) ($choice['imageUrl'] ?? ''));
			if ($image_id > 0 && function_exists('wp_get_attachment_image_url')) {
				$resolved_image = wp_get_attachment_image_url($image_id, 'thumbnail');
				if (is_string($resolved_image) && '' !== $resolved_image) {
					$image_url = esc_url_raw($resolved_image);
				}
			}

			$is_product_type = 'product' === $this->type_key;
			$choice_entry = [
				'uuid'              => strtolower($uuid),
				'label'             => self::plain_text((string) ($choice['label'] ?? 'Choice'), 200),
				'description'       => self::plain_text((string) ($choice['description'] ?? ''), 500),
				'adminLabel'        => self::plain_text((string) ($choice['adminLabel'] ?? ''), 200),
				'color'             => $this->safe_color((string) ($choice['color'] ?? '')),
				'imageId'           => $image_id,
				'imageUrl'          => $image_url,
				'disabled'          => ! empty($choice['disabled']),
				'default'           => ! empty($choice['default']),
				'pricing'           => self::pricing(is_array($choice['pricing'] ?? null) ? $choice['pricing'] : []),
				'quantityEnabled'   => ! empty($choice['quantityEnabled']),
				'linkedProductId'   => max(0, (int) ($choice['linkedProductId'] ?? 0)),
				'linkedVariationId' => max(0, (int) ($choice['linkedVariationId'] ?? 0)),
				'linkedQuantity'    => max(1, min(100, (int) ($choice['linkedQuantity'] ?? 1))),
				'preview'           => is_array($choice['preview'] ?? null) ? $choice['preview'] : [],
			];
			if ($is_product_type) {
				$choice_entry['productId']           = max(0, (int) ($choice['productId'] ?? 0));
				$choice_entry['isVariable']          = ! empty($choice['isVariable']);
				$choice_entry['selectedVariationIds'] = array_values(
					array_unique(
						array_filter(
							array_map('absint', (array) ($choice['selectedVariationIds'] ?? []))
						)
					)
				);
				$raw_info = is_array($choice['productInfo'] ?? null) ? $choice['productInfo'] : [];
				$choice_entry['productInfo'] = [
					'price'        => self::plain_text((string) ($raw_info['price'] ?? ''), 50),
					'regularPrice' => self::plain_text((string) ($raw_info['regularPrice'] ?? ''), 50),
					'salePrice'    => self::plain_text((string) ($raw_info['salePrice'] ?? ''), 50),
					'image'        => esc_url_raw((string) ($raw_info['image'] ?? '')),
					'isVariable'   => ! empty($raw_info['isVariable']),
					'variations'   => [],
				];
				if ($choice_entry['productId'] > 0 && empty($choice_entry['linkedProductId'])) {
					$choice_entry['linkedProductId'] = $choice_entry['productId'];
				}
				$prod_price = (string) ($choice_entry['productInfo']['salePrice'] ?: ($choice_entry['productInfo']['price'] ?: ''));
				if ('' === $prod_price && $choice_entry['productId'] > 0 && function_exists('wc_get_product')) {
					$wc_p = wc_get_product($choice_entry['productId']);
					if ($wc_p) {
						$prod_price = (string) $wc_p->get_price();
						$choice_entry['productInfo']['price'] = $prod_price;
					}
				}
				if ('' !== $prod_price && '0' !== $prod_price && ('none' === ($choice_entry['pricing']['strategy'] ?? 'none') || '0' === ($choice_entry['pricing']['amount'] ?? '0'))) {
					$choice_entry['pricing']['strategy'] = 'fixed';
					$choice_entry['pricing']['amount']   = $prod_price;
				}
			}
			$choices[] = $choice_entry;
		}

		$is_multiple = ! empty($definition['multiple']) || $this->multiple;

		$normalized['choices']            = $choices;
		$normalized['multiple']           = $is_multiple;
		$normalized['minChoices']         = max(0, (int) ($definition['minChoices'] ?? 0));
		$normalized['maxChoices']         = max(0, (int) ($definition['maxChoices'] ?? 0));
		$normalized['updateProductImage'] = 'image_swatch' === $this->type_key && ! empty($definition['updateProductImage']);
		$supports_choice_dimensions       = ! in_array($this->type_key, ['radio', 'checkbox_group', 'select', 'font'], true);
		$normalized['choiceWidth']        = $supports_choice_dimensions ? self::plain_text((string) ($definition['choiceWidth'] ?? ''), 20) : '';
		$normalized['choiceHeight']       = $supports_choice_dimensions ? self::plain_text((string) ($definition['choiceHeight'] ?? ''), 20) : '';
		$normalized['choiceBorderRadius'] = $supports_choice_dimensions ? self::plain_text((string) ($definition['choiceBorderRadius'] ?? ''), 20) : '';
		$normalized['enableQuantity']     = ! in_array($this->type_key, ['segmented', 'radio', 'checkbox_group', 'font', 'select'], true) && ! empty($definition['enableQuantity']);
		$normalized['minQuantity']        = max(1, (int) ($definition['minQuantity'] ?? 1));
		$normalized['maxQuantity']        = max(0, (int) ($definition['maxQuantity'] ?? 100));
		$normalized['displayDirection']   = 'segmented' === $this->type_key && 'vertical' === (string) ($definition['displayDirection'] ?? '') ? 'vertical' : 'horizontal';
		$normalized['columns']            = in_array($this->type_key, ['radio', 'checkbox_group'], true) && in_array((string) ($definition['columns'] ?? ''), ['2', 'two'], true) ? 'two' : 'one';
		$normalized['imageStyle']         = $this->normalize_image_style((string) ($definition['imageStyle'] ?? ''));
		if ('product' === $this->type_key) {
			$normalized['mergeVariationProducts'] = ! empty($definition['mergeVariationProducts']);
		}
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): mixed {
		$allowed     = array_column((array) ($definition['choices'] ?? []), 'uuid');
		$is_multiple = ! empty($definition['multiple']) || $this->multiple;

		if ($is_multiple) {
			$raw_items  = is_array($value) ? $value : ('' === (string) $value ? [] : [$value]);
			$normalized = [];
			foreach ($raw_items as $item) {
				if (is_array($item) && isset($item['choice'])) {
					$uuid = (string) $item['choice'];
					if (in_array($uuid, $allowed, true)) {
						$normalized[] = $uuid;
					}
				} elseif (is_scalar($item)) {
					$uuid = (string) $item;
					if (in_array($uuid, $allowed, true)) {
						$normalized[] = $uuid;
					}
				}
			}
			return array_values(array_unique($normalized));
		}

		if (is_array($value)) {
			if (isset($value['choice'])) {
				$value = (string) $value['choice'];
			} elseif (! empty($value)) {
				$value = (string) reset($value);
			} else {
				$value = '';
			}
		}
		$value = is_scalar($value) ? (string) $value : '';
		return in_array($value, $allowed, true) ? $value : '';
	}

	public function validate(mixed $value, array $definition): array {
		$errors      = [];
		$is_multiple = ! empty($definition['multiple']) || $this->multiple;
		$selected    = $is_multiple ? (array) $value : ('' === (string) $value ? [] : [(string) $value]);
		$choices     = [];
		foreach ((array) ($definition['choices'] ?? []) as $choice) {
			$choices[(string) ($choice['uuid'] ?? '')] = $choice;
		}

		if (! empty($definition['required']) && [] === $selected) {
			$errors[] = ['code' => 'required', 'params' => []];
		}
		if ((int) ($definition['minChoices'] ?? 0) > count($selected)) {
			$errors[] = ['code' => 'too_few_choices', 'params' => ['minimum' => (int) $definition['minChoices']]];
		}
		if ((int) ($definition['maxChoices'] ?? 0) > 0 && (int) $definition['maxChoices'] < count($selected)) {
			$errors[] = ['code' => 'too_many_choices', 'params' => ['maximum' => (int) $definition['maxChoices']]];
		}

		foreach ($selected as $choice_uuid) {
			if (! isset($choices[$choice_uuid])) {
				$errors[] = ['code' => 'unknown_choice', 'params' => ['choice' => $choice_uuid]];
			} elseif (! empty($choices[$choice_uuid]['disabled'])) {
				$errors[] = ['code' => 'disabled_choice', 'params' => ['choice' => $choice_uuid]];
			}
		}
		return $errors;
	}

	public function format_value(mixed $value, array $definition): string {
		$is_multiple = ! empty($definition['multiple']) || $this->multiple;
		$selected    = $is_multiple ? (array) $value : ('' === (string) $value ? [] : [(string) $value]);
		$labels      = [];
		foreach ((array) ($definition['choices'] ?? []) as $choice) {
			if (in_array((string) ($choice['uuid'] ?? ''), $selected, true)) {
				$labels[] = (string) ($choice['label'] ?? '');
			}
		}
		return implode(', ', $labels);
	}

	public function accepts_customer_value(): bool {
		return true;
	}

	private function safe_color(string $value): string {
		$value = strtoupper(trim($value));
		return 1 === preg_match('/\A#[0-9A-F]{6}\z/', $value) ? $value : '';
	}

	private function safe_asset_url(string $value): string {
		$value = trim($value);
		// Imported definitions may only retain same-site, root-relative assets.
		// The admin media picker persists an attachment ID, which is resolved late.
		return 1 === preg_match('#\A/(?!/)[^\s<>"\']+\z#', $value) ? $value : '';
	}

	private function normalize_image_style(string $value): string {
		// Radio, checkbox, select support circle vs normal.
		if (in_array($this->type_key, ['radio', 'checkbox_group', 'select'], true)) {
			return 'circle' === $value ? 'circle' : 'normal';
		}
		// Product, image swatch and color swatch support overlay display styles.
		if (in_array($this->type_key, ['product', 'image_swatch', 'color_swatch'], true)) {
			return in_array($value, ['overlay', 'only_image'], true) ? $value : 'default';
		}
		return 'normal';
	}
}
