/*
	Copyright (c) 2015 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (http://www.cecill.info/).
	
	ol.interaction.SelectCluster is an interaction for selecting vector features in a cluster.
	
*/

import ol from 'ol'
import ol_Map from 'ol/map'
import ol_Collection from 'ol/collection'
import ol_layer_Vector from 'ol/layer/vector'
import ol_source_Vector from 'ol/source/vector'
import ol_interaction_Select from 'ol/interaction/select'
import ol_Feature from 'ol/feature'
import ol_geom_LineString from 'ol/geom/linestring'
import ol_Observable from 'ol/observable'
import ol_easing from 'ol/easing'
import ol_geom_Point from 'ol/geom/point'

/**
 * @classdesc
 * Interaction for selecting vector features in a cluster. 
 * It can be used as an ol.interaction.Select. 
 * When clicking on a cluster, it springs apart to reveal the features in the cluster.
 * Revealed features are selectable and you can pick the one you meant.
 * Revealed features are themselves a cluster with an attribute features that contain the original feature.
 * 
 * @constructor
 * @extends {ol.interaction.Select}
 * @param {olx.interaction.SelectOptions=} options SelectOptions.
 *  @param {ol.style} options.featureStyle used to style the revealed features as options.style is used by the Select interaction.
 * 	@param {boolean} options.selectCluster false if you don't want to get cluster selected
 * 	@param {Number} options.PointRadius to calculate distance between the features
 * 	@param {bool} options.spiral means you want the feature to be placed on a spiral (or a circle)
 * 	@param {Number} options.circleMaxObject number of object that can be place on a circle
 * 	@param {Number} options.maxObjects number of object that can be drawn, other are hidden
 * 	@param {bool} options.animation if the cluster will animate when features spread out, default is false
 * 	@param {Number} options.animationDuration animation duration in ms, default is 500ms
 * @fires ol.interaction.SelectEvent
 * @api stable
 */
var ol_interaction_SelectCluster = function(options) 
{	options = options || {};

	this.pointRadius = options.pointRadius || 12;
	this.circleMaxObjects = options.circleMaxObjects || 10;
	this.maxObjects = options.maxObjects || 60;
	this.spiral = (options.spiral !== false);
	this.animate = options.animate;
	this.animationDuration = options.animationDuration || 500;
	this.selectCluster_ = (options.selectCluster !== false);

	// Create a new overlay layer for 
	var overlay = this.overlayLayer_ = new ol_layer_Vector(
		{	source: new ol_source_Vector({
				features: new ol_Collection(),
				useSpatialIndex: true
			}),
			name:'Cluster overlay',
			updateWhileAnimating: true,
			updateWhileInteracting: true,
			displayInLayerSwitcher: false,
			style: options.featureStyle
		});

	// Add the overlay to selection
	if (options.layers)
	{	if (typeof(options.layers) == "function")
		{	var fn = options.layers;
			options.layers = function(layer)
			{	return (layer===overlay || fn(layer));
			};
		}
		else if (options.layers.push)
		{	options.layers.push(this.overlayLayer_);
		}
	}

	// Don't select links
	if (options.filter)
	{	var fn = options.filter;
		options.filter = function(f,l)
		{	//if (l===overlay && f.get("selectclusterlink")) return false;
			if (!l && f.get("selectclusterlink")) return false;
			else return fn(f,l);
		};
	}
	else options.filter = function(f,l) 
	{	//if (l===overlay && f.get("selectclusterlink")) return false; 
		if (!l && f.get("selectclusterlink")) return false; 
		else return true;
	};
	this.filter_ = options.filter;

	ol_interaction_Select.call(this, options);
	this.on("select", this.selectCluster, this);
};

ol.inherits(ol_interaction_SelectCluster, ol_interaction_Select);


/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_interaction_SelectCluster.prototype.setMap = function(map) 
{	if (this.getMap())
	{	if (this.getMap().getView()) 
		{	this.getMap().getView().un('change:resolution', this.clear, this);
		}
		this.getMap().removeLayer(this.overlayLayer_);
	}

	ol_interaction_Select.prototype.setMap.call (this, map);
	this.overlayLayer_.setMap(map);
	// map.addLayer(this.overlayLayer_);

	if (map && map.getView()) 
	{	map.getView().on('change:resolution', this.clear, this);
	}
};

/**
 * Clear the selection, close the cluster and remove revealed features
 * @api stable
 */
ol_interaction_SelectCluster.prototype.clear = function() 
{	this.getFeatures().clear();
	this.overlayLayer_.getSource().clear();
};

/**
 * Get the layer for the revealed features
 * @api stable
 */
ol_interaction_SelectCluster.prototype.getLayer = function() 
{	return this.overlayLayer_;
};

/**
 * Select a cluster 
 * @param {ol.Feature} a cluster feature ie. a feature with a 'features' attribute.
 * @api stable
 */
ol_interaction_SelectCluster.prototype.selectCluster = function (e) 
{	// Nothing selected
	if (!e.selected.length)
	{	this.clear();
		return;
	}

	// Get selection
	var feature = e.selected[0];
	// It's one of ours
	if (feature.get('selectclusterfeature')) return;
	
	// Clic out of the cluster => close it
	var source = this.overlayLayer_.getSource();
	source.clear();

	var cluster = feature.get('features');
	// Not a cluster (or just one feature)
	if (!cluster || cluster.length==1) return;

	// Remove cluster from selection
	if (!this.selectCluster_) this.getFeatures().clear();

	var center = feature.getGeometry().getCoordinates();
	// Pixel size in map unit
	var pix = this.getMap().getView().getResolution();
	var r = pix * this.pointRadius * (0.5 + cluster.length / 4);
	// Draw on a circle
	if (!this.spiral || cluster.length <= this.circleMaxObjects)
	{	var max = Math.min(cluster.length, this.circleMaxObjects);
		for (var i=0; i<max; i++)
		{	var a = 2*Math.PI*i/max;
			if (max==2 || max == 4) a += Math.PI/4;
			var p = [ center[0]+r*Math.sin(a), center[1]+r*Math.cos(a) ];
			var cf = new ol_Feature({ 'selectclusterfeature':true, 'features':[cluster[i]], geometry: new ol_geom_Point(p) });
			cf.setStyle(cluster[i].getStyle());
			source.addFeature(cf);
			var lk = new ol_Feature({ 'selectclusterlink':true, geometry: new ol_geom_LineString([center,p]) });
			source.addFeature(lk);
		};
	}
	// Draw on a spiral
	else
	{	// Start angle
		var a = 0;
		var r;
		var d = 2*this.pointRadius;
		var features = new Array();
		var links = new Array();
		var max = Math.min (this.maxObjects, cluster.length);
		// Feature on a spiral
		for (var i=0; i<max; i++)
		{	// New radius => increase d in one turn
			r = d/2 + d*a/(2*Math.PI);
			// Angle
			a = a + (d+0.1)/r;
			var dx = pix*r*Math.sin(a)
			var dy = pix*r*Math.cos(a)
			var p = [ center[0]+dx, center[1]+dy ];
			var cf = new ol_Feature({ 'selectclusterfeature':true, 'features':[cluster[i]], geometry: new ol_geom_Point(p) });
			cf.setStyle(cluster[i].getStyle()); 
			source.addFeature(cf);
			var lk = new ol_Feature({ 'selectclusterlink':true, geometry: new ol_geom_LineString([center,p]) });
			source.addFeature(lk);
		}
	}

	if (this.animate) this.animateCluster_(center);
};

/**
 * Animate the cluster and spread out the features
 * @param {ol.Coordinates} the center of the cluster
 */
ol_interaction_SelectCluster.prototype.animateCluster_ = function(center)
{	// Stop animation (if one is running)
	if (this.listenerKey_)
	{	this.overlayLayer_.setVisible(true);
		ol_Observable.unByKey(this.listenerKey_);
	}
	
	// Features to animate
	var features = this.overlayLayer_.getSource().getFeatures();
	if (!features.length) return;
	
	this.overlayLayer_.setVisible(false);
	var style = this.overlayLayer_.getStyle();
	var stylefn = (typeof(style) == 'function') ? style : style.length ? function(){ return style; } : function(){ return [style]; } ;
	var duration = this.animationDuration || 500;
	var start = new Date().getTime();
	
	// Animate function
	function animate(event) 
	{	var vectorContext = event.vectorContext;
		// Retina device
		var ratio = event.frameState.pixelRatio;
		var res = event.target.getView().getResolution();
		var e = ol_easing.easeOut((event.frameState.time - start) / duration);
		for (var i=0, feature; feature = features[i]; i++) if (feature.get('features'))
		{	var pt = feature.getGeometry().getCoordinates();
			pt[0] = center[0] + e * (pt[0]-center[0]);
			pt[1] = center[1] + e * (pt[1]-center[1]);
			var geo = new ol_geom_Point(pt);
			// Image style
			var st = stylefn(feature, res);
			for (var s=0; s<st.length; s++)
			{	var sc;
				// OL < v4.3 : setImageStyle doesn't check retina
				var imgs = ol_Map.prototype.getFeaturesAtPixel ? false : st[s].getImage();
				if (imgs)
				{	sc = imgs.getScale();
					imgs.setScale(ratio); 
				}
				// OL3 > v3.14
				if (vectorContext.setStyle)
				{	vectorContext.setStyle(st[s]);
					vectorContext.drawGeometry(geo);
				}
				// older version
				else
				{	vectorContext.setImageStyle(imgs);
					vectorContext.drawPointGeometry(geo);
				}
				if (imgs) imgs.setScale(sc);
			}
		}
		// Stop animation and restore cluster visibility
		if (e > 1.0) 
		{	ol_Observable.unByKey(this.listenerKey_);
			this.overlayLayer_.setVisible(true);
			this.overlayLayer_.changed();
			return;
		}
		// tell OL3 to continue postcompose animation
		event.frameState.animate = true;
	}

	// Start a new postcompose animation
	this.listenerKey_ = this.getMap().on('postcompose', animate, this);
	//select.getMap().renderSync();
};


export default ol_interaction_SelectCluster
