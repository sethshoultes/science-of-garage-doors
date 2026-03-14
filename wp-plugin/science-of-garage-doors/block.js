( function ( blocks, element, blockEditor, components ) {
	var el           = element.createElement;
	var InspectorControls = blockEditor.InspectorControls;
	var PanelBody    = components.PanelBody;
	var TextControl  = components.TextControl;

	blocks.registerBlockType( 'sogd/viewer', {
		title: 'Science of Garage Doors',
		description: 'Interactive 3D garage door science explorer.',
		icon: 'admin-generic',
		category: 'embed',
		attributes: {
			height: {
				type: 'string',
				default: '800px',
			},
		},

		edit: function ( props ) {
			var height = props.attributes.height;

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: 'Settings', initialOpen: true },
						el( TextControl, {
							label: 'Height',
							help: 'CSS height value (e.g., 800px, 100vh)',
							value: height,
							onChange: function ( val ) {
								props.setAttributes( { height: val } );
							},
						} )
					)
				),
				el(
					'div',
					{ className: 'sogd-editor-wrapper', style: { width: '100%' } },
					el( 'iframe', {
						src: sogdData.viewerUrl,
						style: {
							width: '100%',
							height: height,
							border: 'none',
							borderRadius: '8px',
						},
					} )
				)
			);
		},

		save: function () {
			// Rendered server-side via PHP
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components );
