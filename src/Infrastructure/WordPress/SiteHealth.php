<?php
/**
 * Site Health integration.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Infrastructure\WordPress;

use WooOptionsFic\Application\DiagnosticsService;

final class SiteHealth {
	public function __construct(private readonly DiagnosticsService $diagnostics) {
	}

	public function register(): void {
		add_filter('site_status_tests', [$this, 'tests']);
		add_filter('debug_information', [$this, 'debug_information']);
	}

	/**
	 * @param array<string,mixed> $tests Tests.
	 * @return array<string,mixed>
	 */
	public function tests(array $tests): array {
		$tests['direct']['wooptionsfic_runtime'] = [
			'label' => __('WooOptionsFic runtime', 'wooptionsfic'),
			'test'  => [$this, 'runtime_test'],
		];
		return $tests;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function runtime_test(): array {
		$report   = $this->diagnostics->report();
		$critical = array_filter((array) $report['checks'], static fn (array $check): bool => 'critical' === ($check['status'] ?? ''));
		return [
			'label'       => [] === $critical
				? __('WooOptionsFic’s required services are ready', 'wooptionsfic')
				: __('WooOptionsFic needs attention', 'wooptionsfic'),
			'status'      => [] === $critical ? 'good' : 'critical',
			'badge'       => ['label' => __('WooOptionsFic', 'wooptionsfic'), 'color' => 'blue'],
			'description' => '<p>' . esc_html(
				[] === $critical
					? __('Database, assets, and private storage passed the runtime checks.', 'wooptionsfic')
					: __('One or more required WooOptionsFic services are unavailable.', 'wooptionsfic')
			) . '</p>',
			'actions'     => '<p><a href="' . esc_url(admin_url('admin.php?page=wooptionsfic')) . '">' . esc_html__('Open WooOptionsFic', 'wooptionsfic') . '</a></p>',
			'test'        => 'wooptionsfic_runtime',
		];
	}

	/**
	 * @param array<string,mixed> $information Debug info.
	 * @return array<string,mixed>
	 */
	public function debug_information(array $information): array {
		$report = $this->diagnostics->report();
		$information['wooptionsfic'] = [
			'label'  => __('WooOptionsFic', 'wooptionsfic'),
			'fields' => [
				'plugin'      => ['label' => __('Plugin version', 'wooptionsfic'), 'value' => $report['environment']['plugin']],
				'database'    => ['label' => __('Database version', 'wooptionsfic'), 'value' => $report['environment']['database']],
				'woocommerce' => ['label' => __('WooCommerce version', 'wooptionsfic'), 'value' => $report['environment']['woocommerce'] ?? __('Not active', 'wooptionsfic')],
			],
		];
		return $information;
	}
}
