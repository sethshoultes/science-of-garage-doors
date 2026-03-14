<?php
/**
 * Plugin Name: Science of Garage Doors
 * Description: Interactive 3D garage door science explorer. Adds a "Science of Garage Doors" Gutenberg block and [garage_door_science] shortcode.
 * Version: 1.0.0
 * Author: A Plus Garage Doors
 * License: GPL-2.0-or-later
 * Text Domain: science-of-garage-doors
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SOGD_VERSION', '1.0.0' );
define( 'SOGD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register the Gutenberg block.
 */
function sogd_register_block() {
	wp_register_script(
		'sogd-block-editor',
		SOGD_PLUGIN_URL . 'block.js',
		array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components' ),
		SOGD_VERSION,
		true
	);

	wp_localize_script( 'sogd-block-editor', 'sogdData', array(
		'viewerUrl' => SOGD_PLUGIN_URL . 'viewer.html',
	) );

	register_block_type( 'sogd/viewer', array(
		'editor_script'   => 'sogd-block-editor',
		'render_callback' => 'sogd_render_block',
		'attributes'      => array(
			'height' => array(
				'type'    => 'string',
				'default' => '800px',
			),
		),
	) );
}
add_action( 'init', 'sogd_register_block' );

/**
 * Sanitize a CSS height value to prevent injection.
 */
function sogd_sanitize_height( $height ) {
	if ( preg_match( '/^\d+(\.\d+)?(px|em|rem|vh|vw|%)$/', trim( $height ) ) ) {
		return trim( $height );
	}
	return '800px';
}

/**
 * Render the block on the front end.
 */
function sogd_render_block( $attributes ) {
	$height = sogd_sanitize_height( isset( $attributes['height'] ) ? $attributes['height'] : '800px' );
	$url    = esc_url( SOGD_PLUGIN_URL . 'viewer.html' );

	return sprintf(
		'<div class="sogd-wrapper" style="width:100%%;max-width:100%%;overflow:hidden;">
			<iframe src="%s" style="width:100%%;height:%s;border:none;border-radius:8px;" loading="lazy" allowfullscreen></iframe>
		</div>',
		$url,
		$height
	);
}

/**
 * Shortcode: [garage_door_science height="800px"]
 */
function sogd_shortcode( $atts ) {
	$atts = shortcode_atts( array(
		'height' => '800px',
	), $atts, 'garage_door_science' );

	return sogd_render_block( $atts );
}
add_shortcode( 'garage_door_science', 'sogd_shortcode' );
