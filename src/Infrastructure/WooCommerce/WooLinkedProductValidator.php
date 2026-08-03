<?php
/**
 * WooCommerce product/variation stock validation.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Infrastructure\WooCommerce;

use WooOptionsFic\Application\LinkedProductValidator;

final class WooLinkedProductValidator implements LinkedProductValidator {
	public function validate(array $compiled, array $values, int $parent_product_id, int $cart_quantity): array {
		$errors = [];
		$items  = [];
		foreach ((array) ($compiled['fields'] ?? []) as $field) {
			if ('product' !== ($field['type'] ?? '')) {
				continue;
			}
			$field_uuid = (string) ($field['uuid'] ?? '');
			$selected   = is_array($values[$field_uuid] ?? null)
				? $values[$field_uuid]
				: (empty($values[$field_uuid]) ? [] : [$values[$field_uuid]]);
			foreach ((array) ($field['choices'] ?? []) as $choice) {
				if (! in_array((string) ($choice['uuid'] ?? ''), $selected, true)) {
					continue;
				}
				$product_id   = (int) ($choice['linkedProductId'] ?? 0);
					$variation_id = (int) ($choice['linkedVariationId'] ?? 0);
					$lookup_id    = $variation_id > 0 ? $variation_id : $product_id;
					$product      = $lookup_id > 0 ? wc_get_product($lookup_id) : false;
					$invalid_variation = $variation_id > 0
						&& (! $product instanceof \WC_Product_Variation || (int) $product->get_parent_id() !== $product_id);
					if (! $product
						|| $product_id <= 0
						|| $product_id === $parent_product_id
						|| $invalid_variation
						|| 'publish' !== $product->get_status()
					) {
					$errors[] = ['code' => 'linked_product_unavailable', 'fieldUuid' => $field_uuid, 'choiceUuid' => $choice['uuid'] ?? ''];
					continue;
				}
				$quantity = max(1, (int) ($choice['linkedQuantity'] ?? 1)) * max(1, $cart_quantity);
				if (! $product->is_purchasable() || ! $product->is_in_stock() || ! $product->has_enough_stock($quantity)) {
					$errors[] = ['code' => 'linked_product_stock', 'fieldUuid' => $field_uuid, 'choiceUuid' => $choice['uuid'] ?? ''];
					continue;
				}
				$items[] = [
					'productId'   => $product_id,
					'variationId' => $variation_id,
					'quantity'    => max(1, (int) ($choice['linkedQuantity'] ?? 1)),
					'fieldUuid'   => $field_uuid,
					'choiceUuid'  => (string) ($choice['uuid'] ?? ''),
					'label'       => (string) ($choice['label'] ?? $product->get_name()),
				];
			}
		}
		return ['valid' => [] === $errors, 'errors' => $errors, 'items' => $items];
	}
}
