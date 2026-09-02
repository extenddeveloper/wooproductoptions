<?php
/**
 * Scalar field type.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Definition\Type;

use DateTimeImmutable;

final class ScalarFieldType extends AbstractFieldType {
	public function __construct(
		private readonly string $type_key,
		private readonly string $value_kind = 'string'
	) {
	}

	public function key(): string {
		return $this->type_key;
	}

	public function normalize_definition(array $definition): array {
		$normalized = $this->base_definition($definition);
		$normalized['placeholder'] = self::plain_text((string) ($definition['placeholder'] ?? ''), 200);
		$normalized['min']         = $this->decimal_or_null($definition['min'] ?? null);
		$normalized['max']         = $this->decimal_or_null($definition['max'] ?? null);
		$normalized['step']        = $this->decimal_or_null($definition['step'] ?? null);
		$normalized['maxLength']   = max(0, min(10000, (int) ($definition['maxLength'] ?? 0)));
		$normalized['privacyMode'] = 'secret' === $this->value_kind;
		if ('tel' === $this->type_key) {
			$flag_style = (string) ($definition['flagStyle'] ?? 'number_only');
			$normalized['flagStyle']      = in_array($flag_style, ['number_only', 'number_flag', 'number_flag_dialcode'], true) ? $flag_style : 'number_only';
			$normalized['defaultCountry'] = self::plain_text((string) ($definition['defaultCountry'] ?? 'US'), 10);
		}
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): mixed {
		if (is_array($value) && 'date_range' !== $this->value_kind) {
			if ('tel' === $this->value_kind && isset($value['number'])) {
				$dial = ! empty($value['dial']) ? (string) $value['dial'] : '';
				$num  = (string) $value['number'];
				return preg_replace('/[^\d+().\-\s]/u', '', trim($dial . ' ' . $num)) ?? '';
			}
			return '';
		}

		return match ($this->value_kind) {
			'integer'    => $this->normalize_integer($value),
			'decimal'    => $this->normalize_decimal($value),
			'email'      => strtolower(trim((string) $value)),
			'url'        => trim((string) $value),
			'tel'        => preg_replace('/[^\d+().\-\s]/u', '', (string) $value) ?? '',
			'date'       => trim((string) $value),
			'time'       => trim((string) $value),
			'datetime'   => trim((string) $value),
			'date_range' => $this->normalize_date_range($value),
			'color'      => strtoupper(trim((string) $value)),
			default      => $this->normalize_string($value, $definition),
		};
	}

	public function validate(mixed $value, array $definition): array {
		$errors = [];
		$empty  = null === $value || '' === $value || ([] === $value);
		if (! empty($definition['required']) && $empty) {
			return [['code' => 'required', 'params' => []]];
		}
		if ($empty) {
			return [];
		}

		return match ($this->value_kind) {
			'email'      => $this->validate_email((string) $value),
			'url'        => $this->validate_url((string) $value),
			'integer'    => $this->validate_number((string) $value, $definition, true),
			'decimal'    => $this->validate_number((string) $value, $definition, false),
			'date'       => $this->validate_date((string) $value),
			'time'       => $this->validate_time((string) $value),
			'datetime'   => $this->validate_datetime((string) $value),
			'date_range' => $this->validate_date_range(is_array($value) ? $value : []),
			'color'      => $this->validate_color((string) $value),
			default      => $this->validate_string((string) $value, $definition),
		};
	}

	public function format_value(mixed $value, array $definition): string {
		if ('date_range' === $this->value_kind && is_array($value)) {
			return trim(($value['start'] ?? '') . ' → ' . ($value['end'] ?? ''));
		}
		return is_scalar($value) ? (string) $value : '';
	}

	public function accepts_customer_value(): bool {
		return true;
	}

	private function decimal_or_null(mixed $value): ?string {
		if (null === $value || '' === $value || ! is_numeric($value)) {
			return null;
		}
		return (string) round((float) $value, 4);
	}

	private function normalize_string(mixed $value, array $definition): string {
		$max = (int) ($definition['maxLength'] ?? 0);
		return self::plain_text((string) $value, $max > 0 ? $max : 5000);
	}

	private function normalize_integer(mixed $value): string {
		if (is_numeric($value)) {
			return (string) (int) $value;
		}
		return '';
	}

	private function normalize_decimal(mixed $value): string {
		if (! is_numeric($value)) {
			return '';
		}
		return (string) round((float) $value, 4);
	}

	private function normalize_date_range(mixed $value): array {
		if (! is_array($value)) {
			return ['start' => '', 'end' => ''];
		}
		return [
			'start' => trim((string) ($value['start'] ?? '')),
			'end'   => trim((string) ($value['end'] ?? '')),
		];
	}

	private function validate_email(string $value): array {
		return is_email($value) ? [] : [['code' => 'invalid_email', 'params' => []]];
	}

	private function validate_url(string $value): array {
		return 1 === preg_match('/\Ahttps?:\/\/[^\s<>"#%{}|\\^~`]+\z/i', $value)
			? []
			: [['code' => 'invalid_url', 'params' => []]];
	}

	private function validate_number(string $value, array $definition, bool $integer_only): array {
		$errors = [];
		if ($integer_only && 1 !== preg_match('/\A-?\d+\z/', $value)) {
			return [['code' => 'invalid_number', 'params' => []]];
		}
		if (! is_numeric($value)) {
			return [['code' => 'invalid_number', 'params' => []]];
		}
		$numeric = (float) $value;
		if (null !== ($definition['min'] ?? null) && $numeric < (float) $definition['min']) {
			$errors[] = ['code' => 'below_minimum', 'params' => ['minimum' => (string) $definition['min']]];
		}
		if (null !== ($definition['max'] ?? null) && $numeric > (float) $definition['max']) {
			$errors[] = ['code' => 'above_maximum', 'params' => ['maximum' => (string) $definition['max']]];
		}
		return $errors;
	}

	private function validate_date(string $value): array {
		return false !== DateTimeImmutable::createFromFormat('Y-m-d', $value)
			? []
			: [['code' => 'invalid_date', 'params' => []]];
	}

	private function validate_time(string $value): array {
		return 1 === preg_match('/\A\d{2}:\d{2}(?::\d{2})?\z/', $value)
			? []
			: [['code' => 'invalid_time', 'params' => []]];
	}

	private function validate_datetime(string $value): array {
		return 1 === preg_match('/\A\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?\z/', $value)
			? []
			: [['code' => 'invalid_datetime', 'params' => []]];
	}

	private function validate_date_range(array $value): array {
		$start = (string) ($value['start'] ?? '');
		$end   = (string) ($value['end'] ?? '');
		if ('' === $start || '' === $end) {
			return [['code' => 'incomplete_date_range', 'params' => []]];
		}
		$d_start = DateTimeImmutable::createFromFormat('Y-m-d', $start);
		$d_end   = DateTimeImmutable::createFromFormat('Y-m-d', $end);
		if (! $d_start || ! $d_end) {
			return [['code' => 'invalid_date_range', 'params' => []]];
		}
		if ($d_end < $d_start) {
			return [['code' => 'invalid_date_range_order', 'params' => []]];
		}
		return [];
	}

	private function validate_color(string $value): array {
		return 1 === preg_match('/\A#[0-9A-F]{6}\z/', $value)
			? []
			: [['code' => 'invalid_color', 'params' => []]];
	}

	private function validate_string(string $value, array $definition): array {
		$errors = [];
		$max    = (int) ($definition['maxLength'] ?? 0);
		if ($max > 0 && mb_strlen($value) > $max) {
			$errors[] = ['code' => 'too_long', 'params' => ['maximum' => $max]];
		}
		return $errors;
	}
}
