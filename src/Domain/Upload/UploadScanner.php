<?php
/**
 * Upload scanner port.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Domain\Upload;

interface UploadScanner {
	/**
	 * @return array{accepted:bool,code:string}
	 */
	public function scan(string $path, string $detected_mime, string $extension): array;
}
