/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/

import ol from 'ol'
import ol_layer_Base from 'ol/layer/base'
import ol_Object from 'ol/object'
import ol_Map from 'ol/map'

var ol_filter = {};
/**
 * @classdesc 
 * Abstract base class; normally only used for creating subclasses and not instantiated in apps.    
 * Used to create filters    
 * Use {@link _ol_Map_#addFilter}, {@link _ol_Map_#removeFilter} or {@link _ol_Map_#getFilters} to handle filters on a map.
 * Use {@link ol_layer_Base#addFilter}, {@link ol_layer_Base#removeFilter} or {@link ol_layer_Base#getFilters}
 * to handle filters on layers.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options Extend {@link _ol_control_Control_} options.
 *  @param {bool} options.active
 */
var ol_filter_Base = function(options)
{	ol_Object.call(this);
	if (options && options.active===false) this.set('active', false);
	else this.set('active', true);
};
ol.inherits(ol_filter_Base, ol_Object);

/** Activate / deactivate filter
*	@param {bool} b
*/
ol_filter_Base.prototype.setActive = function (b)
{	this.set('active', b===true);
};

/** Get filter active
*	@return {bool}
*/
ol_filter_Base.prototype.getActive = function (b)
{	return this.get('active');
};

(function(){

/** Internal function  
* @scoop {ol.filter} this the filter
* @private
*/
function precompose_(e)
{	if (this.get('active')) this.precompose(e);
}
/** Internal function  
* @scoop {ol.filter} this the filter
* @private
*/
function postcompose_(e)
{	if (this.get('active')) this.postcompose(e);
}
/** Force filter redraw / Internal function  
* @scoop {ol.map||ol.layer} this: the map or layer the filter is added to
* @private
*/
function filterRedraw_(e)
{	if (this.renderSync) this.renderSync();
	else this.changed(); 
}

/** Add a filter to an ol object
* @scoop {ol.map||ol.layer} this: the map or layer the filter is added to
* @private
*/
function addFilter_(filter)
{	if (!this.filters_) this.filters_ = [];
	this.filters_.push(filter);
	if (filter.precompose) this.on('precompose', precompose_, filter);
	if (filter.postcompose) this.on('postcompose', postcompose_, filter);
	filter.on('propertychange', filterRedraw_, this);
	filterRedraw_.call (this);
};

/** Remove a filter to an ol object
* @scoop {ol.map||ol.layer} this: the map or layer the filter is added to
* @private
*/
function removeFilter_(filter)
{	if (!this.filters_) this.filters_ = [];
	for (var i=this.filters_.length-1; i>=0; i--)
	{	if (this.filters_[i]===filter) this.filters_.splice(i,1);
	}
	if (filter.precompose) this.un('precompose', precompose_, filter);
	if (filter.postcompose) this.un('postcompose', postcompose_, filter);
	filter.un('propertychange', filterRedraw_, this);
	filterRedraw_.call (this);
};

/** Add a filter to an ol.Map
*	@param {ol.filter}
*/
ol_Map.prototype.addFilter = function (filter)
{	addFilter_.call (this, filter);
};
/** Remove a filter to an ol.Map
*	@param {ol.filter}
*/
ol_Map.prototype.removeFilter = function (filter)
{	removeFilter_.call (this, filter);
};
/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol_Map.prototype.getFilters = function ()
{	return this.filters_;
};

/** Add a filter to an ol.Layer
*	@param {ol.filter}
*/
ol_layer_Base.prototype.addFilter = function (filter)
{	addFilter_.call (this, filter);
};
/** Remove a filter to an ol.Layer
*	@param {ol.filter}
*/
ol_layer_Base.prototype.removeFilter = function (filter)
{	removeFilter_.call (this, filter);
};

/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol_layer_Base.prototype.getFilters = function ()
{	return this.filters_;
};

})();

export default ol_filter_Base
