<?php
/**
 * Privacy-safe analytics policy and recording.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Application;

use WooOptionsFic\Bootstrap\Settings;
use WooOptionsFic\Infrastructure\Persistence\AnalyticsRepository;

final class AnalyticsService {
	private const ALLOWED_METRICS = [
		'view', 'interaction', 'validation_error', 'add_to_cart', 'purchase',
		'formula_warning', 'option_revenue',
	];

	public function __construct(private readonly AnalyticsRepository $repository) {
	}

	/**
	 * @param array<string,mixed> $dimension Non-sensitive dimensions.
	 */
	public function record(string $metric, array $dimension = [], int $count = 1, int $revenue_minor = 0): void {
		if (! Settings::get('analytics_enabled', true) || ! in_array($metric, self::ALLOWED_METRICS, true)) {
			return;
		}
		$dimension['metricKey'] = $metric;
		$dimension['date']      = gmdate('Y-m-d');
		foreach (['optionSetUuid', 'revisionUuid', 'fieldUuid', 'choiceUuid'] as $key) {
			$value = (string) ($dimension[$key] ?? '');
			$dimension[$key] = 1 === preg_match('/\A[0-9a-f-]{36}\z/i', $value) ? strtolower($value) : '';
		}
		$dimension['productId'] = max(0, (int) ($dimension['productId'] ?? 0));
		$dimension['currency']  = 1 === preg_match('/\A[A-Z]{3}\z/', strtoupper((string) ($dimension['currency'] ?? '')))
			? strtoupper((string) $dimension['currency'])
			: '';
		$this->repository->increment($dimension, max(0, $count), $revenue_minor);
	}

	/**
	 * @return array<string,mixed>
	 */
	public function summary(string $from, string $to, int $product_id = 0): array {
		$from = $this->date($from, gmdate('Y-m-d', strtotime('-29 days')));
		$to   = $this->date($to, gmdate('Y-m-d'));
		return [
			'from'       => $from,
			'to'         => $to,
			'metrics'    => $this->repository->summary($from, $to, $product_id),
			'definitions'=> [
				'view'             => 'A server-rendered applicable option form.',
				'interaction'      => 'The first meaningful non-sensitive field interaction.',
				'validation_error' => 'A server validation error, grouped by field UUID only.',
				'add_to_cart'      => 'A configured line accepted into the cart.',
				'purchase'         => 'A configured order line created.',
				'option_revenue'   => 'The minor-unit option contribution stored on purchased lines.',
			],
		];
	}

	public function prune(): int {
		$retention = max(30, min(1095, (int) Settings::get('analytics_retention_days', 395)));
		return $this->repository->prune_before(gmdate('Y-m-d', strtotime('-' . $retention . ' days')));
	}

	private function date(string $value, string $fallback): string {
		return 1 === preg_match('/\A\d{4}-\d{2}-\d{2}\z/', $value) ? $value : $fallback;
	}
}
