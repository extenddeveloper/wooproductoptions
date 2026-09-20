<?php
/**
 * Deterministic price engine.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Pricing;

use RuntimeException;
use WooOptionsFic\Domain\Pricing\Formula\Evaluator;
use WooOptionsFic\Domain\Rule\RuleEngine;

final class PriceEngine {
	public function __construct(
		private readonly RuleEngine $rules,
		private readonly Evaluator $formulas
	) {
	}

	/**
	 * @param array<string, mixed> $compiled Configuration.
	 * @param array<string, mixed> $values Normalized values.
	 * @param array<string, mixed> $context Price context.
	 * @return array<string, mixed>
	 */
	public function calculate(array $compiled, array $values, array $context): array {
		$currency   = strtoupper((string) ($context['currency'] ?? 'USD'));
		$scale      = max(0, min(6, (int) ($context['currencyScale'] ?? 2)));
		$base       = Money::from_decimal((string) ($context['basePrice'] ?? '0'), $currency, $scale);
		$quantity   = max(1, (int) ($context['quantity'] ?? 1));
		$states     = $this->rules->resolve_field_states($compiled, $values, $context);
		$lines      = [];
		$adjustment = Money::from_minor(0, $currency, $scale);
		$supplemental_adjustment = Money::from_minor(0, $currency, $scale);
		$override   = null;
		$warnings   = [];

		foreach ((array) ($compiled['fields'] ?? []) as $field) {
			$uuid  = (string) ($field['uuid'] ?? '');
			$state = $states[$uuid] ?? ['visible' => true, 'enabled' => true];
			if (empty($state['visible']) || empty($state['enabled'])) {
				continue;
			}

			$value   = $values[$uuid] ?? null;
			$result  = $this->field_contributions($field, $value, $base, $quantity, $values, $context, $currency, $scale);
			foreach ($result['lines'] as $line) {
				$applies_to_adjustment = ! isset($line['_applyToAdjustment']) || ! empty($line['_applyToAdjustment']);
				unset($line['_applyToAdjustment']);
				$lines[] = $line;
				$line_money = Money::from_minor((int) $line['rounded']['minor'], $currency, $scale);
				$adjustment = $adjustment->add($line_money);
				if ($applies_to_adjustment) {
					$supplemental_adjustment = $supplemental_adjustment->add($line_money);
				}
			}
			if (isset($result['override'])) {
				if (null !== $override) {
					throw new RuntimeException('wooptionsfic_multiple_price_overrides');
				}
				$override = $result['override'];
			}
			$warnings = array_merge($warnings, $result['warnings']);
		}

		$unit = $override instanceof Money
			? $override->add($supplemental_adjustment)
			: $base->add($adjustment);
		if ($unit->minor() < 0 && empty($context['allowNegativeTotal'])) {
			$warnings[] = ['code' => 'negative_total_clamped', 'params' => []];
			$unit       = Money::from_minor(0, $currency, $scale);
		}

		return [
			'base'          => $base->to_array(),
			'contributions' => $lines,
			'adjustment'    => $adjustment->to_array(),
			'unitPrice'     => $unit->to_array(),
			'quantity'      => $quantity,
			'extendedTotal' => $unit->multiply_integer($quantity)->to_array(),
			'warnings'      => $warnings,
			'revisionUuid'  => (string) ($compiled['revisionUuid'] ?? ''),
			'revisionHash'  => (string) ($compiled['contentHash'] ?? ''),
		];
	}

	/**
	 * @param array<string, mixed> $field Field.
	 * @param array<string, mixed> $values Values.
	 * @param array<string, mixed> $context Context.
	 * @return array{lines:list<array<string,mixed>>,override:?Money,warnings:list<array<string,mixed>>}
	 */
	private function field_contributions(
		array $field,
		mixed $value,
		Money $base,
		int $quantity,
		array $values,
		array $context,
		string $currency,
		int $scale
	): array {
		$lines      = [];
		$warnings   = [];
		$override   = null;
		$field_type = (string) ($field['type'] ?? '');
		$pricing    = is_array($field['pricing'] ?? null) ? $field['pricing'] : ['strategy' => 'none'];
		$strategy   = (string) ($pricing['strategy'] ?? 'none');

		if ('customer_defined_price' === $field_type && '' !== (string) $value) {
			$override = Money::from_decimal((string) $value, $currency, $scale);
			$lines[]  = $this->line(
				$field,
				'customer_defined_price',
				$override->subtract($base),
				['entered' => (string) $value],
				$override->subtract($base)->to_decimal(),
				false
			);
		} elseif ('fixed' === $strategy && ! $this->empty($value)) {
			$money   = Money::from_decimal((string) ($pricing['amount'] ?? '0'), $currency, $scale);
			$lines[] = $this->line($field, $strategy, $money, [], $money->to_decimal());
		} elseif ('percentage' === $strategy && ! $this->empty($value)) {
			$money   = $base->percentage((string) ($pricing['percent'] ?? '0'));
			$lines[] = $this->line($field, $strategy, $money, ['base' => $base->to_decimal()], $money->to_decimal());
		} elseif ('per_character' === $strategy && is_string($value)) {
			$length  = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
			$unit    = Money::from_decimal((string) ($pricing['amount'] ?? '0'), $currency, $scale);
			$money   = $unit->multiply_integer($length);
			$lines[] = $this->line($field, $strategy, $money, ['characters' => $length], $money->to_decimal());
		} elseif ('per_unit' === $strategy && is_scalar($value) && '' !== (string) $value) {
			$decimal = Decimal::from_string((string) $value)
				->multiply(Decimal::from_string((string) ($pricing['amount'] ?? '0')));
			$money   = Money::from_decimal($decimal->to_string(false), $currency, $scale);
			$lines[] = $this->line($field, $strategy, $money, ['units' => (string) $value], $decimal->to_string());
		} elseif ('setup' === $strategy && ! $this->empty($value)) {
			$total    = Decimal::from_string((string) ($pricing['amount'] ?? '0'));
			$per_unit = $total->divide(Decimal::from_int($quantity));
			$money    = Money::from_decimal($per_unit->to_string(false), $currency, $scale);
			$lines[]  = $this->line($field, $strategy, $money, ['cartQuantity' => $quantity], $per_unit->to_string());
			if ($money->multiply_integer($quantity)->minor() !== Money::from_decimal($total->to_string(false), $currency, $scale)->minor()) {
				$warnings[] = ['code' => 'setup_fee_rounding', 'params' => ['quantity' => $quantity]];
			}
		} elseif ('tiered' === $strategy && is_scalar($value) && '' !== (string) $value) {
			$amount = $this->tier_amount((string) $value, (array) ($pricing['tiers'] ?? []));
			$money  = Money::from_decimal($amount, $currency, $scale);
			$lines[]= $this->line($field, $strategy, $money, ['value' => (string) $value], $amount);
		} elseif ('formula' === $strategy) {
			$expression = (string) ($pricing['expression'] ?? '0');
			$rows       = 'repeater' === ($field['type'] ?? '')
				? array_values(
					array_map(
						static fn (mixed $row): array => is_array($row['values'] ?? null) ? $row['values'] : [],
						(array) $value
					)
				)
				: [];
			$decimal    = $this->formulas->evaluate(
				$expression,
				[
					'base_price' => $base->to_decimal(),
					'quantity'   => $quantity,
					'fields'     => $values,
					'weight'     => (string) ($context['weight'] ?? '0'),
					'width'      => (string) ($context['width'] ?? '0'),
					'height'     => (string) ($context['height'] ?? '0'),
					'length'     => (string) ($context['length'] ?? '0'),
				],
				$rows
			);
			$money      = Money::from_decimal($decimal->to_string(false), $currency, $scale);
			if ('unit_price' === ($pricing['mode'] ?? 'adjustment')) {
				$override = $money;
				$delta    = $money->subtract($base);
				$lines[]  = $this->line(
					$field,
					$strategy,
					$delta,
					['expression' => $expression, 'mode' => 'unit_price'],
					$decimal->to_string(),
					false
				);
			} else {
				$lines[] = $this->line($field, $strategy, $money, ['expression' => $expression], $decimal->to_string());
			}
		}

		if (isset($field['choices']) && is_array($field['choices'])) {
			$selected = is_array($value) ? array_values(array_map('strval', $value)) : ('' === (string) $value ? [] : [(string) $value]);
			$selected_labels = [];

			foreach ($field['choices'] as $choice) {
				$choice_uuid = (string) ($choice['uuid'] ?? '');
				if (! in_array($choice_uuid, $selected, true)) {
					continue;
				}

				$choice_label = trim((string) ($choice['label'] ?? ''));
				$choice_pricing = is_array($choice['pricing'] ?? null) ? $choice['pricing'] : [];
				$choice_strategy = (string) ($choice_pricing['strategy'] ?? 'none');
				// Always initialize so it is defined for the 'fixed' block below,
				// even when this choice belongs to a non-product field type.
				$selected_var_id = 0;

				if ('product' === $field_type) {
					$pid = (int) ($choice['productId'] ?? ($choice['linkedProductId'] ?? 0));
					if (('' === $choice_label || 'Choice' === $choice_label) && $pid > 0 && function_exists('wc_get_product')) {
						$wc_p = wc_get_product($pid);
						if ($wc_p) {
							$choice_label = wp_strip_all_tags($wc_p->get_name());
						}
					}
					if ('' === $choice_label) {
						$choice_label = __('Product', 'wooptionsfic');
					}
					$product_price = '';
					$selected_var_id = (int) ($context['productVariations'][$choice_uuid] ?? 0);
					if ($selected_var_id > 0 && function_exists('wc_get_product')) {
						$var_prod = wc_get_product($selected_var_id);
						if ($var_prod) {
							$product_price = (string) $var_prod->get_price();
							$var_attrs = method_exists($var_prod, 'get_variation_attributes') ? $var_prod->get_variation_attributes() : [];
							$clean_attrs = [];
							if (! empty($var_attrs)) {
								foreach ($var_attrs as $attr_k => $attr_v) {
									if ('' !== (string) $attr_v) {
										$attr_lbl = function_exists('wc_attribute_label') ? wc_attribute_label(str_replace('attribute_', '', (string) $attr_k)) : (string) $attr_k;
										$clean_attrs[] = $attr_lbl . ': ' . $attr_v;
									}
								}
							}
							if (! empty($clean_attrs)) {
								$choice_label .= ' (' . implode(', ', $clean_attrs) . ')';
							} else {
								$var_name = $var_prod->get_name();
								if ($var_name) {
									$choice_label .= ' (' . $var_name . ')';
								}
							}
						}
					}
					// Fallback to choice productInfo variations array if wc_get_product didn't return a price
					if ('' === $product_price && $selected_var_id > 0 && ! empty($choice['productInfo']['variations']) && is_array($choice['productInfo']['variations'])) {
						foreach ($choice['productInfo']['variations'] as $v) {
							if ((int) ($v['id'] ?? 0) === $selected_var_id) {
								$product_price = (string) (((isset($v['salePrice']) && '' !== (string) $v['salePrice']) ? $v['salePrice'] : ($v['price'] ?? '')) ?? '');
								if (! empty($v['label'])) {
									$choice_label .= ' (' . $v['label'] . ')';
									$display_label = $this->choice_line_label($field, $choice_label);
								}
								break;
							}
						}
					}
					if ('' === $product_price) {
						$product_id = (int) ($choice['productId'] ?? ($choice['linkedProductId'] ?? 0));
						if ($product_id > 0 && function_exists('wc_get_product')) {
							$wc_prod = wc_get_product($product_id);
							if ($wc_prod) {
								$product_price = (string) $wc_prod->get_price();
								if ('' === $product_price && $wc_prod->is_type('variable') && method_exists($wc_prod, 'get_variation_price')) {
									$product_price = (string) $wc_prod->get_variation_price('min');
								}
							}
						}
					}
					if ('' === $product_price) {
						$pinfo = is_array($choice['productInfo'] ?? null) ? $choice['productInfo'] : [];
						$product_price = (string) (((isset($pinfo['salePrice']) && '' !== (string) $pinfo['salePrice']) ? $pinfo['salePrice'] : ($pinfo['price'] ?? '')) ?? '');
						if ('' === $product_price && ! empty($pinfo['variations']) && is_array($pinfo['variations'])) {
							foreach ($pinfo['variations'] as $v) {
								$vp = (string) (((isset($v['salePrice']) && '' !== (string) $v['salePrice']) ? $v['salePrice'] : ($v['price'] ?? '')) ?? '');
								if ('' !== $vp) {
									$product_price = $vp;
									break;
								}
							}
						}
					}
					if ('' === $product_price) {
						$product_price = (string) ($choice_pricing['amount'] ?? '0');
					}

					if ('' !== $product_price && is_numeric($product_price)) {
						$choice_strategy = 'fixed';
						$choice_pricing['amount'] = $product_price;
					}
				}

				$qty_multiplier = 1;
				$qty_val = $context['choiceQuantities'][$choice_uuid] ?? null;
				if (! empty($field['enableQuantity'])) {
					$qty_multiplier = ! empty($qty_val) ? max(1, (int) $qty_val) : 1;
				}

				$choice_display_label = $choice_label;
				if (! empty($field['enableQuantity'])) {
					$choice_display_label = sprintf('%s Count: %d,', $choice_label, $qty_multiplier);
				}

				$selected_labels[] = $choice_display_label;
				$display_label = $this->choice_line_label($field, $choice_display_label);

				if ('fixed' === $choice_strategy) {
					$raw_amount = (string) ($choice_pricing['amount'] ?? '0');
					// Guard against non-numeric config values that would crash Decimal::from_string().
					if ('' === $raw_amount || ! is_numeric($raw_amount)) {
						$raw_amount = '0';
					}
					$money = Money::from_decimal($raw_amount, $currency, $scale);
					// Use multiply_integer() — Money::multiply() does not exist on this class.
					if ($qty_multiplier > 1) {
						$money = $money->multiply_integer($qty_multiplier);
					}
					$line_meta = ['choiceUuid' => $choice_uuid, 'choiceLabel' => $choice_display_label];
					if ($selected_var_id > 0) {
						$line_meta['variationId'] = $selected_var_id;
					}
					$line = $this->line($field, 'choice_fixed', $money, $line_meta, $money->to_decimal());
					$line['label'] = $display_label;
					$lines[] = $line;
				} elseif ('percentage' === $choice_strategy) {
					$money = $base->percentage((string) ($choice_pricing['percent'] ?? '0'));
					if ($qty_multiplier > 1) {
						$money = $money->multiply_integer($qty_multiplier);
					}
					$line = $this->line($field, 'choice_percentage', $money, ['choiceUuid' => $choice_uuid, 'choiceLabel' => $choice_display_label], $money->to_decimal());
					$line['label'] = $display_label;
					$lines[] = $line;
				} elseif ('none' === $strategy || 'none' === $choice_strategy) {
					// Itemized breakdown should still identify selected dropdown/radio choices,
					// even when that choice does not alter the price.
					$money = Money::from_minor(0, $currency, $scale);
					$line = $this->line($field, 'choice_none', $money, ['choiceUuid' => $choice_uuid, 'choiceLabel' => $choice_display_label], '0');
					$line['label'] = $display_label;
					$lines[] = $line;
				}
			}

			// A field-level adjustment on a dropdown or radio group should name the
			// selected choice instead of showing an ambiguous field-only row.
			if ([] !== $selected_labels && 'none' !== $strategy && 'product' !== $field_type) {
				$selection_label = (string) ($field['label'] ?? '');
				if ('' !== $selection_label) {
					$selection_label .= ': ';
				}
				$selection_label .= implode(', ', $selected_labels);
				foreach ($lines as &$line) {
					if ((string) ($line['sourceUuid'] ?? '') === (string) ($field['uuid'] ?? '')
						&& ! str_starts_with((string) ($line['strategy'] ?? ''), 'choice_')
					) {
						$line['label'] = $selection_label;
					}
				}
				unset($line);
			}
		}

		if ('repeater' === $field_type && is_array($value)) {
			foreach ($value as $row_index => $row) {
				$row_values = is_array($row['values'] ?? null) ? $row['values'] : [];
				foreach ((array) ($field['children'] ?? []) as $child) {
					$child_uuid = (string) ($child['uuid'] ?? '');
					$child_result = $this->field_contributions(
						$child,
						$row_values[$child_uuid] ?? null,
						$base,
						$quantity,
						$values,
						$context,
						$currency,
						$scale
					);
					foreach ($child_result['lines'] as $child_line) {
						$child_line['label'] = (string) ($field['label'] ?? '') . ' #' . ($row_index + 1) . ' / ' . $child_line['label'];
						$lines[]             = $child_line;
					}
				}
			}
		}

		return ['lines' => $lines, 'override' => $override, 'warnings' => $warnings];
	}

	private function choice_line_label(array $field, string $choice_label): string {
		$field_label = trim((string) ($field['label'] ?? ''));
		$choice_label = trim($choice_label);
		if ('' === $field_label) {
			return $choice_label;
		}
		if ('' === $choice_label) {
			return $field_label;
		}
		return $field_label . ': ' . $choice_label;
	}

	/**
	 * @param array<string, mixed> $field Field.
	 * @param array<string, mixed> $operands Operands.
	 * @return array<string, mixed>
	 */
	private function line(
		array $field,
		string $strategy,
		Money $money,
		array $operands,
		string $unrounded,
		bool $apply_to_adjustment = true
	): array {
		return [
			'sourceUuid' => (string) ($field['uuid'] ?? ''),
			'label'      => (string) ($field['label'] ?? ''),
			'strategy'   => $strategy,
			'operands'   => $operands,
			'unrounded'  => $unrounded,
			'rounded'    => $money->to_array(),
			'_applyToAdjustment' => $apply_to_adjustment,
		];
	}

	/**
	 * @param list<array<string,mixed>> $tiers Tiers.
	 */
	private function tier_amount(string $value, array $tiers): string {
		$number = Decimal::from_string($value);
		$amount = '0';
		usort(
			$tiers,
			static fn (array $a, array $b): int => Decimal::from_string((string) ($a['min'] ?? '0'))
				->compare(Decimal::from_string((string) ($b['min'] ?? '0')))
		);
		foreach ($tiers as $tier) {
			if ($number->compare(Decimal::from_string((string) ($tier['min'] ?? '0'))) >= 0) {
				$amount = (string) ($tier['amount'] ?? '0');
			}
		}
		return $amount;
	}

	private function empty(mixed $value): bool {
		return null === $value || '' === $value || [] === $value || false === $value;
	}
}
