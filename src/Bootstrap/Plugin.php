<?php
/**
 * Plugin composition root.
 *
 * @package WooOptionsFic
 */

declare(strict_types=1);

namespace WooOptionsFic\Bootstrap;

use WooOptionsFic\Application\AnalyticsService;
use WooOptionsFic\Application\AssignmentService;
use WooOptionsFic\Application\DiagnosticsService;
use WooOptionsFic\Application\OptionSetService;
use WooOptionsFic\Application\QuoteService;
use WooOptionsFic\Application\SavedConfigurationService;
use WooOptionsFic\Application\TemplateService;
use WooOptionsFic\Application\UploadService;
use WooOptionsFic\Domain\Definition\Compiler;
use WooOptionsFic\Domain\Definition\FieldTypeRegistry;
use WooOptionsFic\Domain\Pricing\Formula\Evaluator;
use WooOptionsFic\Domain\Pricing\Formula\Parser;
use WooOptionsFic\Domain\Pricing\PriceEngine;
use WooOptionsFic\Domain\Rule\RuleEngine;
use WooOptionsFic\Domain\Selection\SelectionService;
use WooOptionsFic\Domain\Snapshot\SnapshotFactory;
use WooOptionsFic\Domain\Style\ContrastValidator;
use WooOptionsFic\Domain\Style\PaletteRegistry;
use WooOptionsFic\Infrastructure\Persistence\AnalyticsRepository;
use WooOptionsFic\Infrastructure\Persistence\AssignmentRepository;
use WooOptionsFic\Infrastructure\Persistence\OptionSetRepository;
use WooOptionsFic\Infrastructure\Persistence\SavedConfigurationRepository;
use WooOptionsFic\Infrastructure\Persistence\Schema;
use WooOptionsFic\Infrastructure\Persistence\Transaction;
use WooOptionsFic\Infrastructure\Persistence\UploadRepository;
use WooOptionsFic\Infrastructure\Storage\BaselineUploadScanner;
use WooOptionsFic\Infrastructure\Storage\LocalPrivateStorage;
use WooOptionsFic\Infrastructure\WooCommerce\CartIntegration;
use WooOptionsFic\Infrastructure\WooCommerce\OrderIntegration;
use WooOptionsFic\Infrastructure\WooCommerce\ProductContext;
use WooOptionsFic\Infrastructure\WooCommerce\StoreApiIntegration;
use WooOptionsFic\Infrastructure\WooCommerce\WooLinkedProductValidator;
use WooOptionsFic\Infrastructure\WordPress\DownloadController;
use WooOptionsFic\Infrastructure\WordPress\RateLimiter;
use WooOptionsFic\Infrastructure\WordPress\SessionGuard;
use WooOptionsFic\Infrastructure\WordPress\SiteHealth;
use WooOptionsFic\Presentation\Admin\AdminPage;
use WooOptionsFic\Presentation\Rest\AdminController;
use WooOptionsFic\Presentation\Rest\PublicController;
use WooOptionsFic\Presentation\Storefront\Assets;
use WooOptionsFic\Presentation\Storefront\BlockIntegration;
use WooOptionsFic\Presentation\Storefront\Renderer;

final class Plugin {
	public function boot(): void {
		Schema::migrate();

		$registry = new FieldTypeRegistry((int) Settings::get('max_repeater_rows', 25));
		/**
		 * Register an additional field type implementation.
		 *
		 * Implementations must honor the FieldType normalization and validation
		 * contract and must not trust browser values.
		 *
		 * @param FieldTypeRegistry $registry Registry.
		 */
		do_action('wooptionsfic_register_field_types', $registry);

		$formula_parser = new Parser();
		$formula_evaluator = new Evaluator(
			$formula_parser,
			(int) Settings::get('formula_operation_limit', 500)
		);
		$rules      = new RuleEngine((int) Settings::get('rule_node_limit', 500));
		$contrast   = new ContrastValidator();
		$palettes   = new PaletteRegistry((array) require WOOPTIONSFIC_PATH . 'config/style-presets.php', $contrast);
		$compiler   = new Compiler(
			$registry,
			$formula_parser,
			$palettes,
			(int) Settings::get('max_fields', 200),
			(int) Settings::get('max_choices', 1000)
		);

		$transaction       = new Transaction();
		$option_repository = new OptionSetRepository();
		$assignment_repo   = new AssignmentRepository();
		$upload_repo       = new UploadRepository();
		$saved_repo        = new SavedConfigurationRepository();
		$analytics_repo    = new AnalyticsRepository();
		$storage           = new LocalPrivateStorage();

		$option_sets = new OptionSetService($option_repository, $compiler, $transaction);
		$assignments = new AssignmentService($assignment_repo, $option_repository, $transaction);
		$uploads     = new UploadService($upload_repo, $storage, new BaselineUploadScanner());
		$saved       = new SavedConfigurationService($saved_repo);
		$analytics   = new AnalyticsService($analytics_repo);
		$diagnostics = new DiagnosticsService($storage);
		$templates   = new TemplateService($option_sets);

		$admin_api = new AdminController(
			$option_sets,
			$assignments,
			$compiler,
			$formula_parser,
			$formula_evaluator,
			$rules,
			$contrast,
			$templates,
			$analytics,
			$diagnostics
		);
		add_action('rest_api_init', [$admin_api, 'register']);

		$admin = new AdminPage();
		add_action('admin_menu', [$admin, 'register_menu']);
		add_action('admin_enqueue_scripts', [$admin, 'enqueue']);
		add_action('admin_notices', [$admin, 'activated_notice']);

		$site_health = new SiteHealth($diagnostics);
		$site_health->register();

		add_action(
			'wooptionsfic_cleanup',
			static function () use ($uploads, $analytics): void {
				$uploads->cleanup(200);
				$analytics->prune();
			}
		);

		if (! Requirements::woocommerce_is_available()) {
			Requirements::register_woocommerce_notice();
			return;
		}

		$sessions = new SessionGuard();
		$products = new ProductContext();
		$selections = new SelectionService($registry, $rules);
		$prices     = new PriceEngine($rules, $formula_evaluator);
		$snapshots  = new SnapshotFactory($registry);
		$quotes     = new QuoteService(
			$assignments,
			$selections,
			$prices,
			$snapshots,
			$uploads,
			new WooLinkedProductValidator()
		);

		add_action('init', [$sessions, 'ensure_guest_cookie'], 1);

		$public_api = new PublicController(
			$quotes,
			$products,
			$sessions,
			new RateLimiter(),
			$uploads,
			$saved,
			$analytics
		);
		add_action('rest_api_init', [$public_api, 'register']);

		$assets = new Assets();
		add_action('wp_enqueue_scripts', [$assets, 'register'], 5);
		add_action('wp_enqueue_scripts', [$assets, 'enqueue_on_product_pages'], 10);

		$renderer = new Renderer($quotes, $products, $sessions, $analytics);
		add_action('woocommerce_before_add_to_cart_button', [$renderer, 'render_for_current_product'], 15);

		$block = new BlockIntegration($renderer);
		add_action('init', [$block, 'register'], 20);

		$cart = new CartIntegration($quotes, $products, $sessions, $uploads, $analytics);
		$cart->register();

		$order = new OrderIntegration($uploads, $analytics, $sessions);
		$order->register();

		$store_api = new StoreApiIntegration();
		$store_api->register();

		$downloads = new DownloadController($uploads, $storage, $sessions);
		$downloads->register();
	}
}
