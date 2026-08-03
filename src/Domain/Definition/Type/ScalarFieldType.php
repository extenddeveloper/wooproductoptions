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
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): mixed {
		if (is_array($value) && 'date_range' !== $this->value_kind) {
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
		if (! empty($definition['required']) && self::is_empty($value)) {
			$errors[] = ['code' => 'required', 'params' => []];
			return $errors;
		}
		if (self::is_empty($value)) {
			return [];
		}

		if (in_array($this->value_kind, ['integer', 'decimal'], true)) {
			if (! is_string($value) || 1 !== preg_match('/\A-?\d+(?:\.\d+)?\z/', $value)) {
				$errors[] = ['code' => 'invalid_number', 'params' => []];
				return $errors;
			}
			if (null !== ($definition['min'] ?? null) && $this->compare_decimals($value, (string) $definition['min']) < 0) {
				$errors[] = ['code' => 'below_minimum', 'params' => ['minimum' => $definition['min']]];
			}
			if (null !== ($definition['max'] ?? null) && $this->compare_decimals($value, (string) $definition['max']) > 0) {
				$errors[] = ['code' => 'above_maximum', 'params' => ['maximum' => $definition['max']]];
			}
		}

		if ('email' === $this->value_kind && false === filter_var($value, FILTER_VALIDATE_EMAIL)) {
			$errors[] = ['code' => 'invalid_email', 'params' => []];
		}
		if ('url' === $this->value_kind && false === filter_var($value, FILTER_VALIDATE_URL)) {
			$errors[] = ['code' => 'invalid_url', 'params' => []];
		}
		if ('color' === $this->value_kind && 1 !== preg_match('/\A#[0-9A-F]{6}\z/', (string) $value)) {
			$errors[] = ['code' => 'invalid_color', 'params' => []];
		}
		if ('date' === $this->value_kind && ! $this->valid_date((string) $value, '!Y-m-d')) {
			$errors[] = ['code' => 'invalid_date', 'params' => []];
		}
		if ('time' === $this->value_kind && 1 !== preg_match('/\A(?:[01]\d|2[0-3]):[0-5]\d\z/', (string) $value)) {
			$errors[] = ['code' => 'invalid_time', 'params' => []];
		}
		if ('datetime' === $this->value_kind && ! $this->valid_date((string) $value, '!Y-m-d\TH:i')) {
			$errors[] = ['code' => 'invalid_datetime', 'params' => []];
		}
		if ('date_range' === $this->value_kind) {
			$start = (string) ($value['start'] ?? '');
			$end   = (string) ($value['end'] ?? '');
			if (! $this->valid_date($start, '!Y-m-d') || ! $this->valid_date($end, '!Y-m-d') || $start > $end) {
				$errors[] = ['code' => 'invalid_date_range', 'params' => []];
			}
		}

		if (is_string($value)) {
			$length = self::length($value);
			$max     = (int) ($definition['maxLength'] ?? 0);
			if ($max > 0 && $length > $max) {
				$errors[] = ['code' => 'too_long', 'params' => ['maximum' => $max]];
			}
			$minimum_length = (int) (($definition['validation']['minLength'] ?? 0));
			if ($minimum_length > 0 && $length < $minimum_length) {
				$errors[] = ['code' => 'too_short', 'params' => ['minimum' => $minimum_length]];
			}
		}

		return $errors;
	}

	public function format_value(mixed $value, array $definition): string {
		if ('secret' === $this->value_kind) {
			return self::is_empty($value) ? '' : '••••••••';
		}
		if (is_array($value)) {
			return implode(' – ', array_map('strval', $value));
		}
		return (string) $value;
	}

	public function accepts_customer_value(): bool {
		return true;
	}

	private function normalize_string(mixed $value, array $definition): string {
		$string  = is_scalar($value) ? (string) $value : '';
		$string  = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $string) ?? '';
		$maximum = (int) ($definition['maxLength'] ?? 0);
		$maximum = $maximum > 0 ? min($maximum, 10000) : 10000;
		return self::substring(trim($string), 0, $maximum);
	}

	private function normalize_integer(mixed $value): string {
		$value = trim((string) $value);
		return 1 === preg_match('/\A-?\d+\z/', $value) ? (string) (int) $value : '';
	}

	private function normalize_decimal(mixed $value): string {
		$value = str_replace(',', '.', trim((string) $value));
		return 1 === preg_match('/\A-?\d+(?:\.\d{1,6})?\z/', $value) ? $value : '';
	}

	/**
	 * @return array{start:string,end:string}
	 */
	private function normalize_date_range(mixed $value): array {
		$value = is_array($value) ? $value : [];
		return [
			'start' => trim((string) ($value['start'] ?? '')),
			'end'   => trim((string) ($value['end'] ?? '')),
		];
	}

	private function decimal_or_null(mixed $value): ?string {
		if (null === $value || '' === $value) {
			return null;
		}
		$normalized = $this->normalize_decimal($value);
		return '' === $normalized ? null : $normalized;
	}

	private function compare_decimals(string $left, string $right): int {
		$normalize = static function (string $value): array {
			$negative = str_starts_with($value, '-');
			$value    = ltrim($value, '+-');
			[$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
			$whole    = ltrim($whole, '0') ?: '0';
			$fraction = rtrim(str_pad($fraction, 6, '0'), '0');
			return [$negative, $whole, $fraction];
		};

		[$left_negative, $left_whole, $left_fraction]    = $normalize($left);
		[$right_negative, $right_whole, $right_fraction] = $normalize($right);
		if ($left_negative !== $right_negative) {
			return $left_negative ? -1 : 1;
		}
		$sign = $left_negative ? -1 : 1;
		if (strlen($left_whole) !== strlen($right_whole)) {
			return (strlen($left_whole) <=> strlen($right_whole)) * $sign;
		}
		$whole_compare = strcmp($left_whole, $right_whole);
		if (0 !== $whole_compare) {
			return $whole_compare * $sign;
		}
		return strcmp(str_pad($left_fraction, 6, '0'), str_pad($right_fraction, 6, '0')) * $sign;
	}

	private function valid_date(string $value, string $format): bool {
		$date = DateTimeImmutable::createFromFormat($format, $value);
		$errors = DateTimeImmutable::getLastErrors();
		return false !== $date
			&& (false === $errors || (0 === $errors['warning_count'] && 0 === $errors['error_count']));
	}
}
