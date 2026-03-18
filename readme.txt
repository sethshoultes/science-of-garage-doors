=== Science of Garage Doors ===
Contributors: aplusgaragedoors
Tags: garage door, interactive, 3D, education, gutenberg
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later

Interactive 3D garage door science explorer. Embed a full educational presentation on any page or post.

== Description ==

**Science of Garage Doors** is an interactive, 3D educational experience that explains garage door mechanics, physics, and technology through animated scenes with real-time data readouts.

**Features:**

* Door system mechanics with animated open/close and live readouts
* Torsion spring physics simulator with adjustable door weight
* Side-by-side drive type comparison (chain, belt, screw, direct)
* Exploded motor internals with assembled/exploded toggle
* Smart home IoT integration visualization
* LED radio interference demonstration
* Interactive troubleshooting guide

**Usage:**

* **Gutenberg Block:** Search for "Science of Garage Doors" in the block inserter
* **Shortcode:** `[garage_door_science]` or `[garage_door_science height="600px"]`

The presentation is fully self-contained and loads in an iframe for maximum compatibility with any WordPress theme.

== Installation ==

1. Download the plugin zip from the [GitHub Releases page](https://github.com/sethshoultes/science-of-garage-doors/releases/latest)
2. In WordPress, go to Plugins → Add New → Upload Plugin
3. Upload the zip file and activate
4. Add the "Science of Garage Doors" block to any page or post, or use the `[garage_door_science]` shortcode

== Frequently Asked Questions ==

= Can I customize the height? =

Yes. In the Gutenberg block, use the Height setting in the sidebar. With the shortcode, use the height attribute: `[garage_door_science height="600px"]`

= Does it work with page builders? =

Yes. Use the shortcode `[garage_door_science]` in any page builder that supports shortcodes.

= Does the plugin auto-update? =

Yes. The plugin checks GitHub Releases for new versions and supports one-click updates from wp-admin.

== Changelog ==

= 1.0.0 =
* Initial release
* Gutenberg block with configurable height
* Shortcode support
* GitHub-based auto-updater
