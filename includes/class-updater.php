<?php
/**
 * SOGD_Updater — GitHub-based plugin update checker.
 *
 * Hooks into WordPress update system to check for new versions from
 * GitHub Releases instead of WordPress.org.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class SOGD_Updater {

	const CACHE_KEY = 'sogd_update_data';
	const CACHE_TTL = 43200; // 12 hours.
	const GITHUB_REPO = 'sethshoultes/science-of-garage-doors';

	/**
	 * Initialize update hooks.
	 */
	public static function init() {
		add_filter( 'pre_set_site_transient_update_plugins', array( __CLASS__, 'check_for_update' ) );
		add_filter( 'plugins_api', array( __CLASS__, 'plugin_info' ), 10, 3 );
		add_filter( 'plugin_row_meta', array( __CLASS__, 'plugin_row_meta' ), 10, 2 );
		add_action( 'admin_init', array( __CLASS__, 'handle_manual_check' ) );
	}

	/**
	 * Handle manual "Check for updates" click.
	 */
	public static function handle_manual_check() {
		if ( ! isset( $_GET['sogd_check_update'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_key( $_GET['_wpnonce'] ?? '' ), 'sogd_check_update' ) ) {
			return;
		}

		delete_transient( self::CACHE_KEY );
		delete_site_transient( 'update_plugins' );
		wp_update_plugins();

		add_action(
			'admin_notices',
			function () {
				echo '<div class="notice notice-info is-dismissible"><p>Science of Garage Doors: Update check complete.</p></div>';
			}
		);
	}

	/**
	 * Check GitHub Releases for available updates.
	 *
	 * @param object $transient WordPress update transient.
	 * @return object Modified transient with update data if available.
	 */
	public static function check_for_update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$remote = self::get_remote_data();
		if ( ! $remote ) {
			return $transient;
		}

		if ( version_compare( $remote['version'], SOGD_VERSION, '>' ) ) {
			$transient->response[ SOGD_PLUGIN_BASENAME ] = (object) array(
				'id'           => 'science-of-garage-doors/science-of-garage-doors.php',
				'slug'         => 'science-of-garage-doors',
				'plugin'       => SOGD_PLUGIN_BASENAME,
				'new_version'  => $remote['version'],
				'url'          => 'https://github.com/' . self::GITHUB_REPO,
				'package'      => $remote['download_url'],
				'tested'       => $remote['tested'] ?? '',
				'requires'     => $remote['requires'] ?? '5.8',
				'requires_php' => $remote['requires_php'] ?? '7.4',
			);
		}

		return $transient;
	}

	/**
	 * Provide plugin info for the WordPress "View Details" modal.
	 *
	 * @param false|object|array $result Default result.
	 * @param string             $action API action.
	 * @param object             $args   Arguments with slug.
	 * @return false|object Plugin info or false to use default.
	 */
	public static function plugin_info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || 'science-of-garage-doors' !== ( $args->slug ?? '' ) ) {
			return $result;
		}

		$remote = self::get_remote_data();
		if ( ! $remote ) {
			return $result;
		}

		return (object) array(
			'name'          => 'Science of Garage Doors',
			'slug'          => 'science-of-garage-doors',
			'version'       => $remote['version'],
			'author'        => '<a href="https://aplusgaragedoor.com">A Plus Garage Doors</a>',
			'homepage'      => 'https://github.com/' . self::GITHUB_REPO,
			'requires'      => $remote['requires'] ?? '5.8',
			'tested'        => $remote['tested'] ?? '',
			'requires_php'  => $remote['requires_php'] ?? '7.4',
			'download_link' => $remote['download_url'],
			'trunk'         => $remote['download_url'],
			'last_updated'  => gmdate( 'Y-m-d' ),
			'sections'      => array(
				'description' => 'Interactive 3D garage door science explorer. Embeds a full educational presentation as a Gutenberg block or shortcode.',
				'changelog'   => $remote['changelog'] ?? '',
			),
		);
	}

	/**
	 * Add a "Check for updates" link to the plugin row in wp-admin.
	 *
	 * @param array  $meta Existing row meta links.
	 * @param string $file Plugin file basename.
	 * @return array Modified meta links.
	 */
	public static function plugin_row_meta( $meta, $file ) {
		if ( SOGD_PLUGIN_BASENAME !== $file ) {
			return $meta;
		}

		$check_url = wp_nonce_url(
			admin_url( 'plugins.php?sogd_check_update=1' ),
			'sogd_check_update'
		);

		$meta[] = '<a href="' . esc_url( $check_url ) . '">' . esc_html__( 'Check for updates', 'science-of-garage-doors' ) . '</a>';

		return $meta;
	}

	/**
	 * Fetch latest release data from GitHub (cached).
	 *
	 * @param bool $force_refresh Skip cache and fetch fresh data.
	 * @return array|false Release data array or false on failure.
	 */
	public static function get_remote_data( $force_refresh = false ) {
		if ( isset( $_GET['sogd_check_update'] ) && wp_verify_nonce( sanitize_key( $_GET['_wpnonce'] ?? '' ), 'sogd_check_update' ) ) {
			$force_refresh = true;
		}

		if ( ! $force_refresh ) {
			$cached = get_transient( self::CACHE_KEY );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$api_url  = 'https://api.github.com/repos/' . self::GITHUB_REPO . '/releases/latest';
		$response = wp_remote_get(
			$api_url,
			array(
				'timeout' => 15,
				'headers' => array(
					'Accept'     => 'application/vnd.github.v3+json',
					'User-Agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . get_bloginfo( 'url' ),
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$release = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $release ) || empty( $release['tag_name'] ) ) {
			return false;
		}

		// Find the plugin zip asset in the release.
		$download_url = '';
		if ( ! empty( $release['assets'] ) ) {
			foreach ( $release['assets'] as $asset ) {
				if ( str_ends_with( $asset['name'], '.zip' ) ) {
					$download_url = $asset['browser_download_url'];
					break;
				}
			}
		}

		if ( empty( $download_url ) ) {
			return false;
		}

		$version = ltrim( $release['tag_name'], 'v' );

		$data = array(
			'version'      => $version,
			'download_url' => $download_url,
			'changelog'    => $release['body'] ?? '',
			'tested'       => '',
			'requires'     => '5.8',
			'requires_php' => '7.4',
		);

		set_transient( self::CACHE_KEY, $data, self::CACHE_TTL );

		return $data;
	}

	/**
	 * Clear the update cache.
	 */
	public static function invalidate_cache() {
		delete_transient( self::CACHE_KEY );
	}
}
