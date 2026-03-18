<?php
/**
 * Plugin Name: A Plus Garage Door Science
 * Description: Interactive educational presentations about garage door science. Adds six Gutenberg blocks and shortcodes for embedding garage door physics, springs, rolling steel, ROI, energy efficiency, and spring fatigue presentations.
 * Version:     1.0.0
 * Author:      A Plus Garage Doors
 * Author URI:  https://aplusgaragedoor.com
 * Plugin URI:  https://github.com/sethshoultes/science-of-garage-doors
 * License:     GPL-2.0-or-later
 * Text Domain: aplus-gds
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'APLUS_GDS_VERSION', '1.0.0' );
define( 'APLUS_GDS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'APLUS_GDS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'APLUS_GDS_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// GitHub-based auto-updater.
require_once APLUS_GDS_PLUGIN_DIR . 'includes/class-updater.php';
APLUS_GDS_Updater::init();

/**
 * Block definitions: slug => config.
 */
function aplus_gds_get_blocks() {
	return array(
		'garage-door-science' => array(
			'title'       => 'Science of Garage Doors',
			'description' => 'Interactive 3D garage door science explorer with six animated scenes.',
			'icon'        => 'admin-home',
			'viewer'      => 'science-of-garage-doors.html',
			'shortcode'   => 'aplus_garage_door_science',
			'default_h'   => '900px',
		),
		'spring-science' => array(
			'title'       => 'Science of Garage Door Springs',
			'description' => 'Interactive presentation on torsion spring physics, safety, and winding simulation.',
			'icon'        => 'admin-tools',
			'viewer'      => 'science-of-garage-door-springs.html',
			'shortcode'   => 'aplus_spring_science',
			'default_h'   => '800px',
		),
		'rolling-steel-lab' => array(
			'title'       => 'Rolling Steel Doors Lab',
			'description' => 'Interactive lab exploring rolling steel door mechanics and engineering.',
			'icon'        => 'building',
			'viewer'      => 'rolling-steel-lab.html',
			'shortcode'   => 'aplus_rolling_steel',
			'default_h'   => '800px',
		),
		'garage-door-roi' => array(
			'title'       => 'Garage Door ROI Calculator',
			'description' => 'Interactive return-on-investment calculator for new garage door installations.',
			'icon'        => 'chart-line',
			'viewer'      => 'garage-door-roi.html',
			'shortcode'   => 'aplus_garage_door_roi',
			'default_h'   => '800px',
		),
		'energy-efficiency' => array(
			'title'       => 'Energy Efficiency Lab',
			'description' => 'Interactive lab exploring garage door insulation, R-values, and energy savings.',
			'icon'        => 'lightbulb',
			'viewer'      => 'energy-efficiency-lab.html',
			'shortcode'   => 'aplus_energy_efficiency',
			'default_h'   => '800px',
		),
		'spring-fatigue' => array(
			'title'       => 'Spring Fatigue & Cold Weather',
			'description' => 'Interactive presentation on how cold weather and fatigue cause garage door spring failures.',
			'icon'        => 'cloud',
			'viewer'      => 'spring-fatigue-cold-weather.html',
			'shortcode'   => 'aplus_spring_fatigue',
			'default_h'   => '800px',
		),
	);
}

/**
 * Sanitize a CSS height value.
 */
function aplus_gds_sanitize_height( $height, $default = '800px' ) {
	if ( preg_match( '/^\d+(\.\d+)?(px|em|rem|vh|vw|%)$/', trim( $height ) ) ) {
		return trim( $height );
	}
	return $default;
}

/**
 * Render a viewer iframe.
 */
function aplus_gds_render( $viewer_file, $height ) {
	$url = esc_url( APLUS_GDS_PLUGIN_URL . 'viewers/' . $viewer_file );

	return sprintf(
		'<div class="aplus-gds-wrapper" style="width:100%%;max-width:100%%;overflow:hidden;">
			<iframe src="%s" style="width:100%%;height:%s;border:none;border-radius:8px;" loading="lazy" allowfullscreen></iframe>
		</div>',
		$url,
		esc_attr( $height )
	);
}

/**
 * Register all blocks and shortcodes.
 */
function aplus_gds_register_blocks() {
	$blocks = aplus_gds_get_blocks();

	// Build viewer URLs for the editor script.
	$viewer_urls = array();
	foreach ( $blocks as $slug => $config ) {
		$viewer_urls[ $slug ] = APLUS_GDS_PLUGIN_URL . 'viewers/' . $config['viewer'];
	}

	wp_register_script(
		'aplus-gds-block-editor',
		APLUS_GDS_PLUGIN_URL . 'blocks/block.js',
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components' ),
		APLUS_GDS_VERSION,
		true
	);

	wp_localize_script( 'aplus-gds-block-editor', 'aplusGdsData', array(
		'viewers' => $viewer_urls,
	) );

	foreach ( $blocks as $slug => $config ) {
		register_block_type( 'aplus/' . $slug, array(
			'editor_script'   => 'aplus-gds-block-editor',
			'render_callback' => function ( $attributes ) use ( $config ) {
				$height = aplus_gds_sanitize_height(
					isset( $attributes['height'] ) ? $attributes['height'] : $config['default_h'],
					$config['default_h']
				);
				return aplus_gds_render( $config['viewer'], $height );
			},
			'attributes'      => array(
				'height' => array(
					'type'    => 'string',
					'default' => $config['default_h'],
				),
			),
		) );

		// Register shortcode.
		$shortcode_name = $config['shortcode'];
		$shortcode_config = $config;
		add_shortcode( $shortcode_name, function ( $atts ) use ( $shortcode_config ) {
			$atts = shortcode_atts( array(
				'height' => $shortcode_config['default_h'],
			), $atts, $shortcode_config['shortcode'] );

			$height = aplus_gds_sanitize_height( $atts['height'], $shortcode_config['default_h'] );
			return aplus_gds_render( $shortcode_config['viewer'], $height );
		} );
	}
}
add_action( 'init', 'aplus_gds_register_blocks' );
