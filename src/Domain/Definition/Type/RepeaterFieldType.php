<?php
/**
 * First-class repeatable section.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Definition\Type;

use WooOptionsFic\Domain\Definition\FieldTypeRegistry;
use WooOptionsFic\Domain\Support\Uuid;

final class RepeaterFieldType extends AbstractFieldType {
	public function __construct(
		private readonly FieldTypeRegistry $registry,
		private readonly int $maximum_rows = 25
	) {
	}

	public function key(): string {
		return 'repeater';
	}

	public function normalize_definition(array $definition): array {
		$normalized                = $this->base_definition($definition);
		$limit                     = max(1, min(100, $this->maximum_rows));
		$normalized['minRows']     = max(0, min($limit, (int) ($definition['minRows'] ?? 0)));
		$normalized['defaultRows'] = max($normalized['minRows'], min($limit, (int) ($definition['defaultRows'] ?? 1)));
		$normalized['maxRows']     = max($normalized['defaultRows'], min($limit, (int) ($definition['maxRows'] ?? 10)));
		$normalized['rowTitle']    = self::plain_text((string) ($definition['rowTitle'] ?? 'Item {index}'), 100);
		$normalized['children']    = [];

		foreach ((array) ($definition['children'] ?? []) as $child) {
			if (! is_array($child) || 'repeater' === ($child['type'] ?? '')) {
				continue;
			}
			$type = $this->registry->get((string) ($child['type'] ?? ''));
			if ($type) {
				$normalized['children'][] = $type->normalize_definition($child);
			}
		}
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): array {
		if (is_array($value) && isset($value['rows']) && is_array($value['rows'])) {
			$value = $value['rows'];
		}
		$rows = [];
		foreach ((array) $value as $row_key => $row) {
			if (! is_array($row)) {
				continue;
			}
			$row_uuid = (string) ($row['rowUuid'] ?? $row_key);
			if (! Uuid::is_valid($row_uuid)) {
				$row_uuid = Uuid::v4();
			}
			$source = is_array($row['values'] ?? null) ? $row['values'] : $row;
			$values = [];
			foreach ((array) ($definition['children'] ?? []) as $child) {
				$type = $this->registry->get((string) ($child['type'] ?? ''));
				$uuid = (string) ($child['uuid'] ?? '');
				if ($type && '' !== $uuid) {
					$values[$uuid] = $type->normalize_value($source[$uuid] ?? null, $child);
				}
			}
			$rows[] = ['rowUuid' => strtolower($row_uuid), 'values' => $values];
			if (count($rows) >= (int) ($definition['maxRows'] ?? 10)) {
				break;
			}
		}
		return $rows;
	}

	public function validate(mixed $value, array $definition): array {
		$rows   = (array) $value;
		$errors = [];
		$count  = count($rows);

		if ($count < (int) ($definition['minRows'] ?? 0)) {
			$errors[] = ['code' => 'too_few_rows', 'params' => ['minimum' => (int) $definition['minRows']]];
		}
		if ($count > (int) ($definition['maxRows'] ?? 10)) {
			$errors[] = ['code' => 'too_many_rows', 'params' => ['maximum' => (int) $definition['maxRows']]];
		}

		foreach ($rows as $row_index => $row) {
			$row_values = is_array($row['values'] ?? null) ? $row['values'] : [];
			foreach ((array) ($definition['children'] ?? []) as $child) {
				$type = $this->registry->get((string) ($child['type'] ?? ''));
				$uuid = (string) ($child['uuid'] ?? '');
				if (! $type || '' === $uuid) {
					continue;
				}
				foreach ($type->validate($row_values[$uuid] ?? null, $child) as $error) {
					$error['params']['row']   = $row_index + 1;
					$error['params']['field'] = $uuid;
					$errors[]                 = $error;
				}
			}
		}
		return $errors;
	}

	public function format_value(mixed $value, array $definition): string {
		$count = count((array) $value);
		return $count . (1 === $count ? ' item' : ' items');
	}

	public function accepts_customer_value(): bool {
		return true;
	}
}
