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
			$choices[] = [
				'uuid'              => strtolower($uuid),
				'label'             => self::plain_text((string) ($choice['label'] ?? 'Choice'), 200),
				'description'       => self::plain_text((string) ($choice['description'] ?? ''), 500),
				'adminLabel'        => self::plain_text((string) ($choice['adminLabel'] ?? ''), 200),
				'color'             => $this->safe_color((string) ($choice['color'] ?? '')),
				'imageId'           => max(0, (int) ($choice['imageId'] ?? 0)),
				'imageUrl'          => $this->safe_asset_url((string) ($choice['imageUrl'] ?? '')),
				'disabled'          => ! empty($choice['disabled']),
				'default'           => ! empty($choice['default']),
				'pricing'           => self::pricing(is_array($choice['pricing'] ?? null) ? $choice['pricing'] : []),
				'quantityEnabled'   => ! empty($choice['quantityEnabled']),
				'linkedProductId'   => max(0, (int) ($choice['linkedProductId'] ?? 0)),
				'linkedVariationId' => max(0, (int) ($choice['linkedVariationId'] ?? 0)),
				'linkedQuantity'    => max(1, min(100, (int) ($choice['linkedQuantity'] ?? 1))),
				'preview'           => is_array($choice['preview'] ?? null) ? $choice['preview'] : [],
			];
		}

		$normalized['choices']    = $choices;
		$normalized['multiple']   = $this->multiple;
		$normalized['minChoices'] = max(0, (int) ($definition['minChoices'] ?? 0));
		$normalized['maxChoices'] = max(0, (int) ($definition['maxChoices'] ?? 0));
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): mixed {
		$allowed = array_column((array) ($definition['choices'] ?? []), 'uuid');

		if ($this->multiple) {
			$values = is_array($value) ? $value : ('' === (string) $value ? [] : [$value]);
			$values = array_values(array_unique(array_map('strval', $values)));
			return array_values(array_intersect($allowed, $values));
		}

		$value = is_scalar($value) ? (string) $value : '';
		return in_array($value, $allowed, true) ? $value : '';
	}

	public function validate(mixed $value, array $definition): array {
		$errors   = [];
		$selected = $this->multiple ? (array) $value : ('' === (string) $value ? [] : [(string) $value]);
		$choices  = [];
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
		$selected = $this->multiple ? (array) $value : ('' === (string) $value ? [] : [(string) $value]);
		$labels   = [];
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
}
