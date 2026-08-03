<?php
/**
 * Bundled template catalog.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Application;

use JsonException;
use RuntimeException;

final class TemplateService {
	public function __construct(private readonly OptionSetService $option_sets) {
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	public function list(): array {
		$manifest = $this->manifest();
		return array_values(
			array_map(
				static fn (array $item): array => [
					'slug'        => (string) $item['slug'],
					'name'        => (string) $item['name'],
					'description' => (string) $item['description'],
					'icon'        => (string) ($item['icon'] ?? 'screenoptions'),
					'category'    => (string) ($item['category'] ?? 'commerce'),
					'fieldCount'  => (int) ($item['fieldCount'] ?? 0),
				],
				$manifest
			)
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	public function load(string $slug): array {
		$slug = sanitize_key($slug);
		foreach ($this->manifest() as $item) {
			if ($slug !== $item['slug']) {
				continue;
			}
			$file = WOOPTIONSFIC_PATH . 'templates/' . $slug . '.json';
			if (! is_readable($file)) {
				throw new RuntimeException('wooptionsfic_template_file_missing');
			}
			try {
				$data = json_decode((string) file_get_contents($file), true, 64, JSON_THROW_ON_ERROR);
			} catch (JsonException) {
				throw new ValidationException('wooptionsfic_template_invalid', [['code' => 'template_json_invalid']]);
			}
			if (! is_array($data) || ! is_array($data['optionSet']['definition'] ?? null)) {
				throw new ValidationException('wooptionsfic_template_invalid', [['code' => 'template_schema_invalid']]);
			}
			return $data;
		}
		throw new NotFoundException('wooptionsfic_template_not_found');
	}

	/**
	 * @return array<string,mixed>
	 */
	public function import(string $slug, int $user_id): array {
		$template = $this->load($slug);
		return $this->option_sets->import(
			(array) $template['optionSet']['definition'],
			(string) ($template['optionSet']['title'] ?? ''),
			$user_id
		);
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	private function manifest(): array {
		$file = WOOPTIONSFIC_PATH . 'templates/manifest.php';
		$data = is_readable($file) ? require $file : [];
		return is_array($data) ? array_values(array_filter($data, 'is_array')) : [];
	}
}
