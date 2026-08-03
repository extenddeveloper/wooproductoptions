<?php
/**
 * Stable REST responses and exception mapping.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Presentation\Rest;

use RuntimeException;
use Throwable;
use WooOptionsFic\Application\ConflictException;
use WooOptionsFic\Application\NotFoundException;
use WooOptionsFic\Application\ValidationException;

trait Responder {
	/**
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function respond(callable $callback, int $success_status = 200): \WP_REST_Response|\WP_Error {
		try {
			$result   = $callback();
			$response = new \WP_REST_Response($result, $success_status);
			$response->header('Cache-Control', 'no-store');
			return $response;
		} catch (NotFoundException $exception) {
			return new \WP_Error($exception->getMessage(), __('The requested WooOptionsFic resource was not found.', 'wooptionsfic'), ['status' => 404]);
		} catch (ConflictException $exception) {
			return new \WP_Error($exception->getMessage(), __('This item changed in another session. Reload it before saving again.', 'wooptionsfic'), ['status' => 409, 'conflict' => $exception->metadata()]);
		} catch (ValidationException $exception) {
			return new \WP_Error($exception->getMessage(), __('The request contains invalid configuration data.', 'wooptionsfic'), ['status' => 422, 'errors' => $exception->errors()]);
		} catch (RuntimeException $exception) {
			return new \WP_Error($exception->getMessage(), __('WooOptionsFic could not complete the request.', 'wooptionsfic'), ['status' => 400]);
		} catch (Throwable $exception) {
			if (defined('WP_DEBUG') && WP_DEBUG) {
				error_log('WooOptionsFic REST error: ' . $exception->getMessage()); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
			return new \WP_Error('wooptionsfic_internal_error', __('WooOptionsFic encountered an unexpected error.', 'wooptionsfic'), ['status' => 500]);
		}
	}
}
