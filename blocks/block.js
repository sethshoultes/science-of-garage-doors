( function ( blocks, element, blockEditor, components ) {
	var el = element.createElement;
	var InspectorControls = blockEditor.InspectorControls;
	var PanelBody = components.PanelBody;
	var TextControl = components.TextControl;

	var blockDefs = [
		{
			slug: 'aplus/garage-door-science',
			title: 'Science of Garage Doors',
			description: 'Interactive 3D garage door science explorer with six animated scenes.',
			icon: 'admin-home',
			defaultHeight: '900px',
		},
		{
			slug: 'aplus/spring-science',
			title: 'Science of Garage Door Springs',
			description: 'Interactive presentation on torsion spring physics, safety, and winding simulation.',
			icon: 'admin-tools',
			defaultHeight: '800px',
		},
		{
			slug: 'aplus/rolling-steel-lab',
			title: 'Rolling Steel Doors Lab',
			description: 'Interactive lab exploring rolling steel door mechanics and engineering.',
			icon: 'building',
			defaultHeight: '800px',
		},
		{
			slug: 'aplus/garage-door-roi',
			title: 'Garage Door ROI Calculator',
			description: 'Interactive return-on-investment calculator for new garage door installations.',
			icon: 'chart-line',
			defaultHeight: '800px',
		},
		{
			slug: 'aplus/energy-efficiency',
			title: 'Energy Efficiency Lab',
			description: 'Interactive lab exploring garage door insulation, R-values, and energy savings.',
			icon: 'lightbulb',
			defaultHeight: '800px',
		},
		{
			slug: 'aplus/spring-fatigue',
			title: 'Spring Fatigue & Cold Weather',
			description: 'Interactive presentation on how cold weather and fatigue cause spring failures.',
			icon: 'cloud',
			defaultHeight: '800px',
		},
	];

	blockDefs.forEach( function ( def ) {
		var viewerKey = def.slug.replace( 'aplus/', '' );

		blocks.registerBlockType( def.slug, {
			title: def.title,
			description: def.description,
			icon: def.icon,
			category: 'embed',
			attributes: {
				height: {
					type: 'string',
					default: def.defaultHeight,
				},
			},

			edit: function ( props ) {
				var height = props.attributes.height;
				var viewerUrl = aplusGdsData.viewers[ viewerKey ] || '';

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
						{
							className: 'aplus-gds-editor-wrapper',
							style: { width: '100%' },
						},
						el( 'iframe', {
							src: viewerUrl,
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
				return null;
			},
		} );
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components );
