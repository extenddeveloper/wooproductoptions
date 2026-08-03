<?php
/**
 * Immutable human-readable configuration snapshots.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Snapshot;

use DateTimeImmutable;
use DateTimeZone;
use WooOptionsFic\Domain\Definition\FieldTypeRegistry;
use WooOptionsFic\Domain\Support\CanonicalJson;
use WooOptionsFic\Domain\Support\Uuid;

final class SnapshotFactory {
	public function __construct(private readonly FieldTypeRegistry $registry) {
	}

	/**
	 * @param array<string,mixed> $compiled Configuration.
	 * @param array<string,mixed> $values Values.
	 * @param array<string,mixed> $price Price breakdown.
	 * @return array<string,mixed>
	 */
	public function create(array $compiled, array $values, array $price, int $product_id, int $variation_id = 0): array {
		$summary = [];
		$snapshot_values = $values;
		foreach ((array) ($compiled['fields'] ?? []) as $field) {
			$type = $this->registry->get((string) ($field['type'] ?? ''));
			$uuid = (string) ($field['uuid'] ?? '');
			if (! $type || ! $type->accepts_customer_value() || ! array_key_exists($uuid, $values)) {
				continue;
			}
			if ('password' === ($field['type'] ?? '')) {
				// Secret-mode values are validated for the immediate request only.
				// They are intentionally excluded from cart/order snapshots.
				unset($snapshot_values[$uuid]);
				continue;
			}
			if ('repeater' === ($field['type'] ?? '')) {
				$snapshot_values[$uuid] = $this->redact_repeater_secrets(
					(array) $values[$uuid],
					(array) ($field['children'] ?? [])
				);
			}
			$formatted = $type->format_value($values[$uuid], $field);
			if ('' === $formatted) {
				continue;
			}
			$summary[] = [
				'fieldUuid' => $uuid,
				'label'     => (string) ($field['label'] ?? ''),
				'value'     => $formatted,
				'sensitive' => 'password' === ($field['type'] ?? ''),
			];
		}

		$snapshot = [
			'snapshotUuid' => Uuid::v4(),
			'schemaVersion'=> 1,
			'setUuid'      => (string) ($compiled['setUuid'] ?? ''),
			'revisionUuid' => (string) ($compiled['revisionUuid'] ?? ''),
			'revisionHash' => (string) ($compiled['contentHash'] ?? ''),
			'productId'    => $product_id,
			'variationId'  => $variation_id,
			'title'        => (string) ($compiled['title'] ?? ''),
			'values'       => $snapshot_values,
			'summary'      => $summary,
			'price'        => $price,
			'createdAtGmt' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z'),
		];
		$snapshot['snapshotHash'] = CanonicalJson::hash($snapshot);
		return $snapshot;
	}

	/**
	 * @param list<array<string,mixed>> $rows Rows.
	 * @param list<array<string,mixed>> $children Child fields.
	 * @return list<array<string,mixed>>
	 */
	private function redact_repeater_secrets(array $rows, array $children): array {
		$secret_ids = [];
		foreach ($children as $child) {
			if ('password' === ($child['type'] ?? '')) {
				$secret_ids[] = (string) ($child['uuid'] ?? '');
			}
		}
		if ([] === $secret_ids) {
			return $rows;
		}
		foreach ($rows as &$row) {
			if (! is_array($row) || ! is_array($row['values'] ?? null)) {
				continue;
			}
			foreach ($secret_ids as $secret_id) {
				unset($row['values'][$secret_id]);
			}
		}
		unset($row);
		return $rows;
	}
}
