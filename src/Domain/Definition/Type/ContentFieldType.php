<?php
/**
 * Static content field type.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Definition\Type;

final class ContentFieldType extends AbstractFieldType {
	public function __construct(private readonly string $type_key) {
	}

	public function key(): string {
		return $this->type_key;
	}

	public function normalize_definition(array $definition): array {
		$normalized            = $this->base_definition($definition);
		$normalized['content'] = (string) ($definition['content'] ?? '');
		if (isset($definition['height'])) {
			$normalized['height'] = (int) $definition['height'];
		}
		if (isset($definition['color']) && '' !== (string) $definition['color']) {
			$normalized['color'] = sanitize_hex_color((string) $definition['color']) ?: (string) $definition['color'];
		}
		return $normalized;
	}

	public function normalize_value(mixed $value, array $definition): null {
		return null;
	}

	public function validate(mixed $value, array $definition): array {
		return [];
	}

	public function format_value(mixed $value, array $definition): string {
		return '';
	}

	public function accepts_customer_value(): bool {
		return false;
	}
}
