/**
 * This Source Code is licensed under the MIT license. If a copy of the
 * MIT-license was not distributed with this file, You can obtain one at:
 * http://opensource.org/licenses/mit-license.html.
 *
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2014
 */

/**
 * The MapStateModifier makes it possible to use transitions to e.g. move a renderable from one geographical
 * position to another. If the renderable doesn't require transitions, the use of the lightweight
 * and stateless `MapModifier` is strongly preferred.
 *
 * @module
*/
define(function(require, exports, module) {
    'use strict';

    // import dependencies
    var MapModifier = require('./MapModifier');
    var MapPositionTransitionable = require('./MapPositionTransitionable');

    /**
     * @class
     * @param {Object} options Options.
     * @param {MapView} options.mapView The MapView.
     * @param {LatLng} [options.position] Initial geographical coordinates.
     * @param {LatLng} [options.offset] Displacement offset in geographical coordinates from the position.
     * @param {LatLng} [options.rotateTowards] Position to rotate the renderables towards.
     * @param {number} [options.zoomBase] Base zoom-level at which the renderables are displayed in their true size.
     * @param {number|function} [options.zoomScale] Custom zoom-scaling factor or function.
     * @alias module:MapStateModifier
     */
    function MapStateModifier(options) {
        this.mapView = options.mapView;

        let coordsReversed = false;
        if (options.mapView.mapType === 4){
            // reverse the position to [lng, lat] for mapbox
            coordsReversed = true;
        }

        this._positionState = new MapPositionTransitionable(options.position, coordsReversed);
        this._rotateTowardsState = new MapPositionTransitionable(options.rotateTowards, coordsReversed);

        this._modifier = new MapModifier({
            mapView: this.mapView
        });

        if (options.position) {
            this.setPosition(options.position);
        }
        if (options.rotateTowards) {
            this.rotateTowards(options.rotateTowards);
        }
        if (options.offset) {
            this.setOffset(options.offset);
        }
        if (options.zoomBase !== undefined) {
            this.setZoomBase(options.zoomBase);
        }
        if (options.zoomScale) {
            this.setZoomScale(options.zoomScale);
        }
    }

    /**
     * Set the geographical position of the renderables, by adding the new position to the chain of transitions.
     *
     * @param {LatLng} position New position in geographical coordinates (Latitude, Longitude).
     * @param {Transition} [transition] Famo.us transitionable object.
     * @param {Function} [callback] callback to call after transition completes.
     */
    MapStateModifier.prototype.setPosition = function(position, transition, callback) {
        this._positionState.set(position, transition, callback);
        return this;
    };

    /**
     * Set the destination geographical position to rotate the renderables towards, by adding them.
     * to the chain of transitions.
     * The child renderables are assumed to be rotated to the right by default.
     * To change the base rotation, add a rotation-transform to the renderable, like this:
     * `new Modifier({transform: Transform.rotateZ(Math.PI/2)})`
     *
     * @param {LatLng} position Destination position in geographical position to rotate towards.
     * @param {Transition} [transition] Famo.us transitionable object.
     * @param {Function} [callback] callback to call after transition completes.
     */
    MapStateModifier.prototype.rotateTowards = function(position, transition, callback) {
        this._rotateTowardsState.set(position, transition, callback);
    };

    /**
     * Set the base zoom-level. When set, auto-zooming is effectively enabled.
     * The renderables are then displayed in their true size when the map zoom-level equals zoomBase.
     *
     * @param {Number} zoomBase Map zoom-level
     */
    MapStateModifier.prototype.setZoomBase = function(zoomBase) {
        this._modifier.zoomBaseFrom(zoomBase);
        return this;
    };

    /**
     * Set the zoom-scale (ignored when zoomBase is not set). When set, the scale is increased when zooming in and
     * decreased when zooming-out. The zoomScale can be either a Number or a Function which returns
     * a scale-factor, with the following signature: function (zoomBase, zoomCurrent).
     *
     * @param {Number|Function} zoomScale Zoom-scale factor or function.
     */
    MapStateModifier.prototype.setZoomScale = function(zoomScale) {
        this._modifier.zoomScaleFrom(zoomScale);
        return this;
    };

    /**
     * Set the displacement offset in geographical coordinates.
     *
     * @param {LatLng} offset Displacement offset in geographical coordinates.
     */
    MapStateModifier.prototype.setOffset = function(offset) {
        this._modifier.offsetFrom(offset);
        return this;
    };

    /**
     * Get the current geographical position.
     *
     * @return {LatLng} Position in geographical coordinates.
     */
    MapStateModifier.prototype.getPosition = function() {
        return this._positionState.get();
    };

    /**
     * Get the geographical position towards which the renderables are currently rotated.
     *
     * @return {LatLng} Destination geographical position towards which renderables are rotated.
     */
    MapStateModifier.prototype.getRotateTowards = function() {
        return this._rotateTowardsState.get();
    };

    /**
     * Get the destination geographical position.
     *
     * @return {LatLng} Position in geographical coordinates.
     */
    MapStateModifier.prototype.getFinalPosition = function() {
        return this._positionState.getFinal();
    };

    /**
     * Get the destination geographical position which the renderables should be rotated towards.
     *
     * @return {LatLng} Position in geographical coordinates.
     */
    MapStateModifier.prototype.getFinalRotateTowards = function() {
        return this._rotateTowardsState.getFinal();
    };

    /**
     * Get the base zoom-level. The zoomBase indicates the zoom-level at which renderables are
     * displayed in their true size.
     *
     * @return {Number} Base zoom level
     */
    MapStateModifier.prototype.getZoomBase = function() {
        return this._modifier.getZoomBase();
    };

    /**
     * Get the base zoom-scale. The zoomScale can be either a Number or a Function which returns
     * a scale-factor.
     *
     * @return {Number|Function} Zoom-scale
     */
    MapStateModifier.prototype.getZoomScale = function() {
        return this._modifier.getZoomScale();
    };

     /**
     * Get the geographical displacement offset.
     *
     * @return {LatLng} Offset in geographical coordinates.
     */
    MapStateModifier.prototype.getOffset = function() {
        return this._modifier.getOffset();
    };

    /**
     * Halts any pending transitions.
     */
    MapStateModifier.prototype.halt = function() {
        this._positionState.halt();
        this._rotateTowardsState.halt();
    };

    /**
     * Is there at least one transition pending completion?
     *
     * @return {Bool} True when there are active transitions running.
     */
    MapStateModifier.prototype.isActive = function() {
        return this._positionState.isActive() || this._rotateTowardsState.isActive();
    };

    /**
     * Return render spec for this MapStateModifier, applying to the provided
     *    target component.  This is similar to render() for Surfaces.
     *
     * @private
     * @ignore
     *
     * @param {Object} target (already rendered) render spec to
     *    which to apply the transform.
     * @return {Object} render spec for this MapStateModifier, including the
     *    provided target
     */
    MapStateModifier.prototype.modify = function modify(target) {
        this._modifier.positionFrom(this._positionState.get());
        this._modifier.rotateTowardsFrom(this._rotateTowardsState.getFinal());
        return this._modifier.modify(target);
    };

    module.exports = MapStateModifier;
});
