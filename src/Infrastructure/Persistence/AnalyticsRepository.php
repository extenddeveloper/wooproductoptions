<?php
/**
 * Bounded daily analytics aggregates.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Infrastructure\Persistence;

final class AnalyticsRepository {
	/**
	 * @param array<string,mixed> $dimension Aggregate dimension.
	 */
	public function increment(array $dimension, int $count = 1, int $revenue_minor = 0): void {
		global $wpdb;
		$table = Schema::table('analytics_daily');
		$sql   = $wpdb->prepare(
			"INSERT INTO {$table}
			(metric_date,product_id,option_set_uuid,revision_uuid,field_uuid,choice_uuid,metric_key,count_value,revenue_minor,currency)
			VALUES (%s,%d,%s,%s,%s,%s,%s,%d,%d,%s)
			ON DUPLICATE KEY UPDATE
			count_value = count_value + VALUES(count_value),
			revenue_minor = revenue_minor + VALUES(revenue_minor)",
			(string) ($dimension['date'] ?? gmdate('Y-m-d')),
			(int) ($dimension['productId'] ?? 0),
			(string) ($dimension['optionSetUuid'] ?? ''),
			(string) ($dimension['revisionUuid'] ?? ''),
			(string) ($dimension['fieldUuid'] ?? ''),
			(string) ($dimension['choiceUuid'] ?? ''),
			(string) ($dimension['metricKey'] ?? ''),
			max(0, $count),
			$revenue_minor,
			strtoupper((string) ($dimension['currency'] ?? ''))
		);
		$wpdb->query($sql);
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	public function summary(string $from_date, string $to_date, int $product_id = 0): array {
		global $wpdb;
		$table      = Schema::table('analytics_daily');
		$where      = 'metric_date BETWEEN %s AND %s';
		$parameters = [$from_date, $to_date];
		if ($product_id > 0) {
			$where       .= ' AND product_id = %d';
			$parameters[] = $product_id;
		}
		$sql = $wpdb->prepare(
			"SELECT metric_key, currency, SUM(count_value) AS total_count,
			 SUM(revenue_minor) AS total_revenue_minor
			 FROM {$table} WHERE {$where}
			 GROUP BY metric_key, currency ORDER BY metric_key ASC",
			$parameters
		);
		$rows = $wpdb->get_results($sql, ARRAY_A);
		return array_map(
			static fn (array $row): array => [
				'metricKey'   => (string) $row['metric_key'],
				'currency'    => (string) $row['currency'],
				'count'       => (int) $row['total_count'],
				'revenueMinor'=> (int) $row['total_revenue_minor'],
			],
			is_array($rows) ? $rows : []
		);
	}

	public function prune_before(string $date): int {
		global $wpdb;
		$table = Schema::table('analytics_daily');
		return (int) $wpdb->query($wpdb->prepare("DELETE FROM {$table} WHERE metric_date < %s", $date));
	}
}
