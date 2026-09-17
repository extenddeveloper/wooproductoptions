<?php
/**
 * Extensible field type registry.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Definition;

use InvalidArgumentException;
use WooOptionsFic\Domain\Definition\Type\BooleanFieldType;
use WooOptionsFic\Domain\Definition\Type\CalculatedFieldType;
use WooOptionsFic\Domain\Definition\Type\ChoiceFieldType;
use WooOptionsFic\Domain\Definition\Type\ContentFieldType;
use WooOptionsFic\Domain\Definition\Type\RepeaterFieldType;
use WooOptionsFic\Domain\Definition\Type\ScalarFieldType;
use WooOptionsFic\Domain\Definition\Type\UploadFieldType;

final class FieldTypeRegistry {
	/** @var array<string, FieldType> */
	private array $types = [];

	public function __construct(private readonly int $maximum_repeater_rows = 25) {
		$this->register_defaults();
	}

	public function register(FieldType $type): void {
		$key = $type->key();
		if ('' === $key || isset($this->types[$key])) {
			throw new InvalidArgumentException('wooptionsfic_duplicate_field_type');
		}
		$this->types[$key] = $type;
	}

	public function get(string $key): ?FieldType {
		return $this->types[$key] ?? null;
	}

	/**
	 * @return array<string, FieldType>
	 */
	public function all(): array {
		return $this->types;
	}

	private function register_defaults(): void {
		foreach ([
			['select', false], ['radio', false], ['checkbox_group', true],
			['segmented', false], ['color_swatch', false], ['image_swatch', false],
			['product', true], ['font', false],
		] as [$key, $multiple]) {
			$this->register(new ChoiceFieldType($key, $multiple));
		}

		$this->register(new BooleanFieldType('checkbox'));
		$this->register(new BooleanFieldType('toggle'));

		foreach ([
			['text', 'string'], ['textarea', 'string'], ['password', 'secret'],
			['tel', 'tel'], ['email', 'email'], ['url', 'url'], ['number', 'decimal'],
			['range', 'decimal'], ['quantity', 'integer'], ['date', 'date'],
			['date_range', 'date_range'], ['time', 'time'], ['datetime', 'datetime'],
			['customer_defined_price', 'decimal'], ['color_picker', 'color'],
		] as [$key, $kind]) {
			$this->register(new ScalarFieldType($key, $kind));
		}

		foreach (['heading', 'paragraph', 'help', 'separator', 'spacer', 'content', 'modal'] as $key) {
			$this->register(new ContentFieldType($key));
		}

		$this->register(new UploadFieldType());
		$this->register(new CalculatedFieldType('formula'));
		$this->register(new CalculatedFieldType('calculated'));
		$this->register(new RepeaterFieldType($this, max(1, min(100, $this->maximum_repeater_rows))));
	}
}
