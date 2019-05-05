/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

import ol from 'ol'
import ol_interaction_Interaction from 'ol/interaction/interaction'
import ol_style_Style from 'ol/style/style'
import ol_style_Stroke from 'ol/style/stroke'
import ol_extent from 'ol/extent'
import ol_source_Vector from 'ol/source/vector'
import ol_layer_Vector from 'ol/layer/vector'
import ol_Collection from 'ol/collection'
import ol_layer_Image from 'ol/layer/image'
import ol_Feature from 'ol/feature'
import ol_geom_LineString from 'ol/geom/linestring'

/** Interaction to snap to guidelines
 * @constructor
 * @extends {ol_interaction_Interaction}
 * @param {olx.interaction.SnapGuidesOptions} 
 *	- pixelTolerance {number | undefined} distance (in px) to snap to a guideline, default 10 px
 *	- style {ol_style_Style | Array<ol_style_Style> | undefined} Style for the sektch features.
 */
var ol_interaction_SnapGuides = function(options)
{	if (!options) options = {};

	// Intersect 2 guides
	function getIntersectionPoint (d1, d2)
	{	var d1x = d1[1][0] - d1[0][0];
		var d1y = d1[1][1] - d1[0][1];
		var d2x = d2[1][0] - d2[0][0];
		var d2y = d2[1][1] - d2[0][1];
		var det = d1x * d2y - d1y * d2x;
 
		if (det != 0)
		{	var k = (d1x * d1[0][1] - d1x * d2[0][1] - d1y * d1[0][0] + d1y * d2[0][0]) / det;
			return [d2[0][0] + k*d2x, d2[0][1] + k*d2y];
		}
		else return false;
	}
	function dist2D (p1,p2)
	{	var dx = p1[0]-p2[0];
		var dy = p1[1]-p2[1];
		return Math.sqrt(dx*dx+dy*dy);
	}

	// Snap distance (in px)
	this.snapDistance_ = options.pixelTolerance || 10;

	// Default style
 	var sketchStyle = 
	[	new ol_style_Style({
			stroke: new ol_style_Stroke(
			{	color: '#ffcc33',
				lineDash: [8,5],
				width: 1.25
			})
	   })
	 ];

	// Custom style
	if (options.style) sketchStyle = options.style instanceof Array ? options.style : [options.style];

	// Create a new overlay for the sketch
	this.overlaySource_ = new ol_source_Vector(
		{	features: new ol_Collection(),
			useSpatialIndex: false
		});
/* Speed up with a ImageVector layer (deprecated)
	this.overlayLayer_ = new ol_layer_Image(
		{	source: new ol_source_ImageVector(
			{	source: this.overlaySource_,
				style: function(f)
				{	return sketchStyle;
				}
			}),
			name:'Snap overlay',
			displayInLayerSwitcher: false
		});
*/
	this.overlayLayer_ = new ol_layer_Vector(
		{	source: this.overlaySource_,
			style: function(f)
			{	return sketchStyle;
			},
			name:'Snap overlay',
			displayInLayerSwitcher: false
		});
	// Use snap interaction
	ol_interaction_Interaction.call(this,
		{	handleEvent: function(e)
			{	if (this.getActive())
				{	var features = this.overlaySource_.getFeatures();
					var prev = null;
					var p = null;
					var res = e.frameState.viewState.resolution;
					for (var i=0, f; f = features[i]; i++)
					{	var c = f.getGeometry().getClosestPoint(e.coordinate);
						if ( dist2D(c, e.coordinate) / res < this.snapDistance_)
						{	// Intersection on 2 lines
							if (prev)
							{	var c2 = getIntersectionPoint(prev.getGeometry().getCoordinates(),  f.getGeometry().getCoordinates());
								if (c2) 
								{	if (dist2D(c2, e.coordinate) / res < this.snapDistance_)
									{	p = c2;
									}
								}
							}
							else
							{	p = c;
							}
							prev = f;
						}
					}
					if (p) e.coordinate = p;
				}
				return true;
			}
		});
};
ol.inherits(ol_interaction_SnapGuides, ol_interaction_Interaction);

/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_interaction_SnapGuides.prototype.setMap = function(map)
{	if (this.getMap()) this.getMap().removeLayer(this.overlayLayer_);
	ol_interaction_Interaction.prototype.setMap.call (this, map);
	this.overlayLayer_.setMap(map);
	if (map) this.projExtent_ = map.getView().getProjection().getExtent();
};

/** Activate or deactivate the interaction.
* @param {boolean} active
*/
ol_interaction_SnapGuides.prototype.setActive = function(active)
{	this.overlayLayer_.setVisible(active);
	ol_interaction_Interaction.prototype.setActive.call (this, active);
}

/** Clear previous added guidelines
* @param {Array<ol.Feature> | undefined} features a list of feature to remove, default remove all feature
*/
ol_interaction_SnapGuides.prototype.clearGuides = function(features)
{	if (!features) this.overlaySource_.clear();
	else
	{	for (var i=0, f; f=features[i]; i++)
		{	this.overlaySource_.removeFeature(f);
		}
	}
}

/** Get guidelines
* @return {ol.Collection} guidelines features
*/
ol_interaction_SnapGuides.prototype.getGuides = function(features)
{	return this.overlaySource_.getFeaturesCollection();
}

/** Add a new guide to snap to
* @param {Array<ol.coordinate>} v the direction vector
* @return {ol.Feature} feature guide
*/
ol_interaction_SnapGuides.prototype.addGuide = function(v, ortho)
{	if (v)
	{	var map = this.getMap();
		// Limit extent
		var extent = map.getView().calculateExtent(map.getSize());
		extent = ol_extent.buffer(extent, Math.max (1e5+1, (extent[2]-extent[0])*100));
		extent = ol_extent.getIntersection(extent, this.projExtent_);
		var dx = v[0][0] - v[1][0];
		var dy = v[0][1] - v[1][1];
		var d = 1 / Math.sqrt(dx*dx+dy*dy);
		var p, g = [];
		var p0, p1;
		for (var i= 0; i<1e8; i+=1e5)
		{	if (ortho) p = [ v[0][0] + dy*d*i, v[0][1] - dx*d*i];
			else p = [ v[0][0] + dx*d*i, v[0][1] + dy*d*i];
			if (ol_extent.containsCoordinate(extent, p)) g.push(p);
			else break;
		}
		var f0 = new ol_Feature(new ol_geom_LineString(g));
		var g=[];
		for (var i= 0; i>-1e8; i-=1e5)
		{	if (ortho) p = [ v[0][0] + dy*d*i, v[0][1] - dx*d*i];
			else p = [ v[0][0] + dx*d*i, v[0][1] + dy*d*i];
			if (ol_extent.containsCoordinate(extent, p)) g.push(p);
			else break;
		}
		var f1 = new ol_Feature(new ol_geom_LineString(g));
		this.overlaySource_.addFeature(f0);
		this.overlaySource_.addFeature(f1);
		return [f0, f1];
	}
};

/** Add a new orthogonal guide to snap to
* @param {Array<ol.coordinate>} v the direction vector
* @return {ol.Feature} feature guide
*/
ol_interaction_SnapGuides.prototype.addOrthoGuide = function(v)
{	return this.addGuide(v, true);
};

/** Listen to draw event to add orthogonal guidelines on the first and last point.
* @param {_ol_interaction_Draw_} drawi a draw interaction to listen to
* @api
*/
ol_interaction_SnapGuides.prototype.setDrawInteraction = function(drawi)
{	var self = this;
	// Number of points currently drawing
	var nb = 0;
	// Current guidelines
	var features = [];
	function setGuides(e)
	{	var coord = [];
		var s = 2;
		switch (e.target.getType())
		{	case 'LineString':
				coord = e.target.getCoordinates();
				s = 2;
				break;
			case 'Polygon':
				coord = e.target.getCoordinates()[0];
				s = 3;
				break;
			default: break;
		}
		var l = coord.length;
		if (l != nb && l > s)
		{	self.clearGuides(features);
			features = self.addOrthoGuide([coord[l-s],coord[l-s-1]]);
			features = features.concat(self.addGuide([coord[0],coord[1]]));
			features = features.concat(self.addOrthoGuide([coord[0],coord[1]]));
			nb = l;
		}
	};
	// New drawing
	drawi.on ("drawstart", function(e)
	{	// When geom is changing add a new orthogonal direction 
		e.feature.getGeometry().on("change", setGuides);
	});
	// end drawing, clear directions
	drawi.on ("drawend", function(e)
	{	self.clearGuides(features);
		e.feature.getGeometry().un("change", setGuides);
		nb = 0;
		features = [];
	});
};

export default ol_interaction_SnapGuides
