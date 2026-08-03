<?php
/**
 * Bounded plugin settings.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Bootstrap;

final class Settings {
	public const OPTION = 'wooptionsfic_settings';

	/**
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return [
			'analytics_enabled'          => true,
			'analytics_retention_days'   => 395,
			'upload_max_file_mb'         => 5,
			'upload_max_total_mb'        => 15,
			'upload_allowed_extensions'  => ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
			'abandoned_upload_hours'     => 24,
			'saved_config_expiry_days'   => 90,
			'share_link_expiry_days'     => 30,
			'allow_negative_total'       => false,
			'default_palette'            => 'iris-studio',
			'delete_data_on_uninstall'   => false,
			'admin_theme'                => 'system',
			'formula_operation_limit'    => 500,
			'rule_node_limit'            => 500,
			'max_fields'                 => 200,
			'max_choices'                => 1000,
			'max_repeater_rows'          => 25,
			'quote_rate_limit_per_minute'=> 60,
		];
	}

	/**
	 * @return array<string, mixed>
	 */
	public static function all(): array {
		$value = get_option(self::OPTION, []);
		if (! is_array($value)) {
			$value = [];
		}
		return array_replace(self::defaults(), $value);
	}

	public static function get(string $key, mixed $fallback = null): mixed {
		$settings = self::all();
		return $settings[$key] ?? $fallback;
	}

	/**
	 * @param array<string, mixed> $input Raw settings.
	 * @return array<string, mixed>
	 */
	public static function sanitize(array $input): array {
		$current = self::all();

		foreach (['analytics_enabled', 'allow_negative_total', 'delete_data_on_uninstall'] as $boolean_key) {
			if (array_key_exists($boolean_key, $input)) {
				$current[$boolean_key] = ! empty($input[$boolean_key]);
			}
		}

		$integer_bounds = [
			'analytics_retention_days'    => [30, 1095],
			'upload_max_file_mb'          => [1, 50],
			'upload_max_total_mb'         => [1, 200],
			'abandoned_upload_hours'      => [1, 168],
			'saved_config_expiry_days'    => [1, 3650],
			'share_link_expiry_days'      => [1, 365],
			'formula_operation_limit'     => [50, 2000],
			'rule_node_limit'             => [25, 2000],
			'max_fields'                  => [10, 500],
			'max_choices'                 => [10, 5000],
			'max_repeater_rows'           => [1, 100],
			'quote_rate_limit_per_minute' => [10, 300],
		];

		foreach ($integer_bounds as $key => [$minimum, $maximum]) {
			$value         = absint($input[$key] ?? $current[$key]);
			$current[$key] = max($minimum, min($maximum, $value));
		}

		$allowed_extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'csv'];
		$extensions         = $input['upload_allowed_extensions'] ?? $current['upload_allowed_extensions'];
		if (is_string($extensions)) {
			$extensions = preg_split('/[\s,]+/', $extensions) ?: [];
		}
		$extensions = array_values(
			array_intersect(
				$allowed_extensions,
				array_unique(array_map('sanitize_key', (array) $extensions))
			)
		);
		$current['upload_allowed_extensions'] = $extensions ?: ['jpg', 'jpeg', 'png', 'pdf'];

		$palettes = array_keys((array) require WOOPTIONSFIC_PATH . 'config/style-presets.php');
		$palette  = sanitize_key((string) ($input['default_palette'] ?? $current['default_palette']));
		$current['default_palette'] = in_array($palette, $palettes, true) ? $palette : 'iris-studio';

		$theme = sanitize_key((string) ($input['admin_theme'] ?? $current['admin_theme']));
		$current['admin_theme'] = in_array($theme, ['system', 'light', 'dark'], true) ? $theme : 'system';

		return $current;
	}

	public static function install_defaults(): void {
		if (false === get_option(self::OPTION, false)) {
			add_option(self::OPTION, self::defaults(), '', false);
		}
	}
}
