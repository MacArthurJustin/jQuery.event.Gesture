/**
 * Gesture
 * jQuery plugin for adding Gestures to UI
 *
 * @author Justin MacArthur <macarthurjustin@gmail.com>
 * @copyright (c) 2015
 * @licence Dual licensed under the MIT or GPL Version 2 http://jquery.org/license
 *
*/

(function ( $ ) {
	/**
	 * Object Cache $.event.special for later
	 */
	var $eventSpecial = $.event.special;
	
	/**
	 * Boolean Disable Mouse
	 */
	var disableMouse  = false;
	
	/**
	 * Boolean Bind Move Handlers
	 */
	var moveHandlersBound = false;
	
	/**
	 * Function[] Callback Stack
	 */
    var listCallback  = [];
	
	/**
	 * Function Function Delegates
	 */
	var HoldFunction, startMotionFunction, moveMotionFunction, endMotionFunction;
	
	/**
	 * Function Event Handlers
	 */
	var onMouse, onTouch, onMousewheel;
	
	/**
	 * Object Defaults
	 *
	 * Object namespaceBindMap Object containing Event Bindings
	 * Number mousePinchMultiplier Multiplier attached to the Mouse Wheel for Pinch operations
	 * Number mouseWheelMultiplier Multiplier attached to the Mouse Wheel for Pinch operations
	 */
	var defaults  = {
		namespaceBindMap      : {},
		ignore_class          : ':input',
		mousePinchMultiplier  :   1,
		touchPinchMultiplier  :   4,
		tapRadius             :   3,
		tap_time              : 200,
		held_tap_time         : 300,
		swipe_active_radius   :  50,
		swipe_passive_radius  :  20,
		fling_delta           :   0.7
    };
	
	/**
	 * Array Map of the Motions made by cursor
	 */
    var currentMotion = {};
	
	/**
	 * Number Distance between Pinch fingers
	 */
	var pinchFingerDistance = -1;
	
	/**
	 * String Key to $.data Cache
	 */
	var dataCacheKey = 'GestureAPI'; // data key for storing options
	
	/**
	 * Object Placeholder for Custom Event Handler
	 */
	var gestureObject;
	
	/**
	 * List of Bound Events
	 */
	var boundList = [];
	
	/**
	 * Pinch IDs
	 */
	var motionPinchId, pinchOneId, pinchTwoId;

	/**
	 * Insert Data into array only once
	 *
	 * @param array array Array to use for insert
	 * @param mixed data Data to insert into array
	 *
	 * @return boolean Whether the data was inserted or not
	 */
	function InsertUnique(array, data) {
		if( array && $.isArray(array)) {
			for ( var i = array.length - 1; i > 0; i-- ) {
			  if ( this[i] === data ) return false;
			}
			
			array.push(data);
			return true;
		}
		
		return false;
	}

	/**
	 * Remove all instances of Data in array
	 *
	 * @param array array Array to use for removal
	 * @param mixed data Data to remove into array
	 */
	function RemoveData(array, data) {
		var removed_count = 0;
		for ( var i = this.length - 1; i > 0; i-- ) {
			if ( this[i] === data ) {
				this.splice(i, 1);
			}
		}
	};

	/**
	 * GestureAPI Definition
	 *
	 * Argument Map:
     * - arg_map.type      = string - name of event to bind
     * - arg_map.data      = poly - whatever (optional) data was passed when binding
     * - arg_map.namespace = string - A sorted, dot-delimited list of namespaces specified when binding the event
	 *
     * - arg_map.handler   = fn - The event handler the developer wishes to be bound to the event.
	 *                            This function should be called whenever the event is triggered
	 *
     * - arg_map.guid      = number - Unique ID for event handler, provided by jQuery
     * - arg_map.selector  = string - Selector used by 'delegate' or 'live' jQuery methods.
	 *                                Only available when these methods are used.
	 */
	gestureObject = {
		setup : function( data, a_names, fn_bind ) {
			var $this  = $(this),
				seen_map    = {},
				option_map, namespace_key,
				gestureNamespace, namespace_list;

			if ( $.data( this, dataCacheKey ) ) return;

			option_map = {};
			$.extend( true, option_map, defaults );
			$.data( this, dataCacheKey, option_map );

			namespace_list = a_names;
			if ( ! namespace_list.length || namespace_list[0] === "" ) namespace_list = ["000"];

			for ( var i = 0; i < namespace_list.length; i++ ) {
				namespace_key = namespace_list[i];

				if ( ! namespace_key ) continue;
				if ( seen_map.hasOwnProperty(namespace_key) ) continue;

				seen_map[namespace_key] = true;

				gestureNamespace = '._Gesture_' + namespace_key;

				$this.bind( 'mousedown'  + gestureNamespace, onMouse  );
				$this.bind( 'touchstart' + gestureNamespace, onTouch );
				$this.bind( 'mousewheel' + gestureNamespace, onMousewheel );
			}

			InsertUnique(boundList, this);

			if ( !moveHandlersBound ) {
				$(document).bind( 'mousemove._Gesture_ mouseup._Gesture_' , onMouse );
				$(document).bind( 'touchmove._Gesture_ touchcancel._Gesture_ touchend._Gesture_', onTouch );
				moveHandlersBound = true;
			}
		},

		add : function ( arg_map ) {
			var option_map      = $.data( this, dataCacheKey ),
				namespace_str   = arg_map.namespace,
				event_type      = arg_map.type,
				namespaceBindMap, namespace_list, namespace_key;
				
			if ( !option_map ) return;

			namespaceBindMap  = option_map.namespaceBindMap;

			if ( !namespaceBindMap[event_type] ) namespaceBindMap[event_type] = {};
			if ( !namespace_str ) return;

			namespace_list = namespace_str.split('.');

			for ( var i = 0; i < namespace_list.length; i++ ) {
				namespace_key = namespace_list[i];
				namespaceBindMap[event_type][namespace_key] = true;
			}
		},

		remove : function ( arg_map ) {
			var option_map         = $.data( this, dataCacheKey ),
				namespaceBindMap   = option_map.namespaceBindMap,
				event_type         = arg_map.type,
				namespace_str      = arg_map.namespace,
				namespace_list, namespace_key;

			if ( !namespaceBindMap[event_type] ) return;

			if ( !namespace_str ) {
				delete namespaceBindMap[event_type];
				return;
			}

			namespace_list = namespace_str.split('.');

			for ( var i = 0; i < namespace_list.length; i++ ) {
				namespace_key = namespace_list[i];
				if (namespaceBindMap[event_type][namespace_key]) delete namespaceBindMap[event_type][namespace_key];
			}

			if ( $.isEmptyObject( namespaceBindMap[event_type] ) ) delete namespaceBindMap[event_type];
		},

		teardown : function( a_names ) {
			var $bound           = $(this),
				option_map       = $.data( this, dataCacheKey ),
				namespaceBindMap = option_map.namespaceBindMap,
				namespace_key, gestureNamespace, namespace_list;

			if ( !$.isEmptyObject( namespaceBindMap ) ) return;

			namespace_list = a_names;
			InsertUnique(namespace_list, '000');

			for ( var i = 0; i < namespace_list.length; i++ ) {
				namespace_key = namespace_list[i];

				if ( !namespace_key ) continue;

				gestureNamespace = '._Gesture_' + namespace_key;
				$bound.unbind( 'mousedown'  + gestureNamespace );
				$bound.unbind( 'touchstart' + gestureNamespace );
				$bound.unbind( 'mousewheel' + gestureNamespace );
			}

			$.removeData( this, dataCacheKey );
			RemoveData( boundList, this );
			
			if ( boundList.length === 0 ) {
				$(document).unbind( 'mousemove._Gesture_');
				$(document).unbind( 'touchmove._Gesture_');
				$(document).unbind( 'mouseup._Gesture_');
				$(document).unbind( 'touchend._Gesture_');
				$(document).unbind( 'touchcancel._Gesture_');
				moveHandlersBound = false;
			}
		}
	};

	/**
	 * Hold Handler 
	 *
	 * Calls hold
	 *
	 * @param array arg_map Argument Map
	 */
	HoldFunction = function ( arg_map ) {
		var timestamp  = +new Date(),
			motion_map = arg_map.motion_map,
			event;

		delete motion_map.idto_tapheld;

		if ( !motion_map.allowTap ) return;

		motion_map.endX        = motion_map.startX;
		motion_map.endY        = motion_map.startY;
		motion_map.ms_timestop = timestamp;
		motion_map.ms_elapsed  = timestamp - motion_map.ms_timestart;

		if ( arg_map.namespaceBindMap.hold ) {
			event = $.Event('hold');
			$.extend( event, motion_map );
			$(motion_map.boundElement).trigger(event);
		}
		
		delete currentMotion[arg_map.motion_id];
	};

	/**
	 * Start Motion Handler 
	 *
	 * Calls pinchStart
	 *
	 * @param array arg_map Argument Map
	 */
	startMotionFunction = function ( arg_map ) {
		var motion_id        = arg_map.motion_id,
			sourceEvent      = arg_map.sourceEvent,
			shiftHeld        = arg_map.shiftHeld,
			option_map       = $.data( arg_map.elem, dataCacheKey ),
			namespaceBindMap = option_map.namespaceBindMap,
			$target          = $(sourceEvent.target ),
			doStartPinch     = false,
			motion_map, cb_map, allowTap, allowSwipe, event;

		if ( currentMotion[ motion_id ] ) return;
		if ( shiftHeld && !(namespaceBindMap.pinchStart || namespaceBindMap.pinch)) return;
		if ( $target.is( option_map.ignore_class ) ) return;

		allowTap    = namespaceBindMap.tap || namespaceBindMap.hold ? true : false;
		
		allowSwipe  = namespaceBindMap.swipeLeft || namespaceBindMap.swipeRight || namespaceBindMap.swipeUp || namespaceBindMap.swipeDown ||
					  namespaceBindMap.flingLeft || namespaceBindMap.flingRight || namespaceBindMap.flingUp || namespaceBindMap.flingDown ? true : false;

		cb_map = listCallback.pop();

		while ( cb_map ) {
			if ( $target.is( cb_map.selector_str ) || $( arg_map.elem ).is( cb_map.selector_str ) ) {
				if ( cb_map.callback_match ) {
					cb_map.callback_match( arg_map );
				}
			} else {
				if ( cb_map.callback_nomatch ) {
					cb_map.callback_nomatch( arg_map );
				}
			}
			cb_map = listCallback.pop();
		}

		motion_map = {
			allowTap       : allowTap,
			allowSwipe     : allowSwipe,
			boundElement   : arg_map.elem,
			elem_target    : sourceEvent.target,
			ms_elapsed     : 0,
			ms_timestart   : sourceEvent.timeStamp,
			ms_timestop    : undefined,
			option_map     : option_map,
			orig_target    : sourceEvent.target,
			currentX       : sourceEvent.clientX,
			currentY       : sourceEvent.clientY,
			endX           : undefined,
			endY           : undefined,
			startX         : sourceEvent.clientX,
			startY         : sourceEvent.clientY,
			timeStamp      : sourceEvent.timeStamp
		};

		currentMotion[ motion_id ] = motion_map;

		if ( namespaceBindMap.pinchStart || namespaceBindMap.pinch ) {
			if ( shiftHeld ) {
				motionPinchId = motion_id;
			} else if ( ! pinchOneId ) {
				pinchOneId = motion_id;
			} else if ( ! pinchTwoId ) {
				pinchTwoId = motion_id;
				doStartPinch = true;
			}

			if ( doStartPinch ) {
				if( namespaceBindMap.pinchStart ) {
					event = $.Event( 'pinchStart' );
					motion_map.pinchDelta = 0;
					$.extend( event, motion_map );
					$(motion_map.boundElement).trigger(event);
				}
				if( namespaceBindMap.pinch ) {
					event = $.Event( 'pinch' );
					motion_map.pinchDelta = 0;
					$.extend( event, motion_map );
					$(motion_map.boundElement).trigger(event);
				}
				return;
			}
		}

		if ( namespaceBindMap.hold ) {
			motion_map.idto_tapheld = setTimeout(
				function() {
					HoldFunction({
						motion_id  : motion_id,
						motion_map   : motion_map,
						namespaceBindMap : namespaceBindMap
					});
				},
				option_map.held_tap_time
			);
		}
	};

	/**
	 * Move Motion Handler 
	 *
	 * Calls swipe*, fling* or pinchMove
	 *
	 * @param array arg_map Argument Map
	 */
	moveMotionFunction  = function ( arg_map ) {
		var motion_id   = arg_map.motion_id,
			sourceEvent   = arg_map.sourceEvent,
			doMovePinch = false,
			motion_map, option_map, namespaceBindMap,
			event, pinchValue, pinchDelta,
			pinchOneMap, pinchTwoMap;

		if ( !currentMotion[motion_id] ) return;

		motion_map              = currentMotion[motion_id];
		option_map              = motion_map.option_map;
		namespaceBindMap        = option_map.namespaceBindMap;

		motion_map.timeStamp    = sourceEvent.timeStamp;
		motion_map.elem_target  = sourceEvent.target;
		motion_map.ms_elapsed   = sourceEvent.timeStamp - motion_map.ms_timestart;

		motion_map.deltaX      = sourceEvent.clientX - motion_map.currentX;
		motion_map.deltaY      = sourceEvent.clientY - motion_map.currentY;

		motion_map.currentX    = sourceEvent.clientX;
		motion_map.currentY    = sourceEvent.clientY;

		motion_map.timeStamp    = sourceEvent.timeStamp;

		if ( motion_map.allowTap ) {
			if ( Math.abs(motion_map.deltaX) > option_map.tapRadius || 
		         Math.abs(motion_map.deltaY) > option_map.tapRadius ||
			     motion_map.ms_elapsed        > option_map.tap_time )
				motion_map.allowTap = false;
		}

		if( motion_map.allowSwipe ) {
			var moveX = motion_map.currentX - motion_map.startX;
			var moveY = motion_map.currentY - motion_map.startY;
			var absMoveX = Math.abs(moveX);
			var absMoveY = Math.abs(moveY);
				
			if((absMoveX + absMoveY) > option_map.swipe_active_radius) {
				var FlingDelta = (absMoveX > absMoveY) ? (absMoveX / motion_map.ms_elapsed) : (absMoveY / motion_map.ms_elapsed);
				var Quad  = (absMoveX > absMoveY) ? (moveX > 0) ? 0 : 1 : (moveY > 0) ? 2 : 3;
				
				switch(Quad) {
					default:
					case 0:
						if(absMoveY < option_map.swipe_passive_radius) {
							if(FlingDelta > option_map.fling_delta && namespaceBindMap.flingRight) {
								event = $.Event('flingRight');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							} else if ( namespaceBindMap.swipeRight ) {
								event = $.Event('swipeRight');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							}
						}
							
						motion_map.allowSwipe = false;
						break;
						
					case 1:
						if(absMoveY < option_map.swipe_passive_radius) {
							if(FlingDelta > option_map.fling_delta && namespaceBindMap.flingLeft) {
								event = $.Event('flingLeft');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							} else if ( namespaceBindMap.swipeLeft ) {
								event = $.Event('swipeLeft');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							}
						}
							
						motion_map.allowSwipe = false;
						break;
						
					case 2:
						if(absMoveX < option_map.swipe_passive_radius) {
							if(FlingDelta > option_map.fling_delta && namespaceBindMap.flingDown) {
								event = $.Event('flingDown');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							} else if ( namespaceBindMap.swipeDown ) {
								event = $.Event('swipeDown');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							}
						}
							
						motion_map.allowSwipe = false;
						break;
						
					case 3:
						if(absMoveY < option_map.swipe_passive_radius) {
							if(FlingDelta > option_map.fling_delta && namespaceBindMap.flingUp) {
								event = $.Event('flingUp');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							} else if ( namespaceBindMap.swipeUp ) {
								event = $.Event('swipeUp');
								$.extend( event, motion_map );
								$(motion_map.boundElement).trigger(event);
							}
						}
							
						motion_map.allowSwipe = false;
						break;
				}
			}
		}
		
		if ( pinchOneId && 
		     pinchTwoId && 
		   ( motion_id === pinchOneId || 
		     motion_id === pinchTwoId )) {
			currentMotion[motion_id] = motion_map;
			pinchOneMap              = currentMotion[pinchOneId];
			pinchTwoMap              = currentMotion[pinchTwoId];

			pinchValue = Math.floor(
				Math.sqrt(
					Math.pow((pinchOneMap.currentX - pinchTwoMap.currentX),2) +
					Math.pow((pinchOneMap.currentY - pinchTwoMap.currentY),2)
				) + 0.5
			);

			if ( pinchFingerDistance === -1 ) pinchDelta = 0;
			else pinchDelta = ( pinchValue - pinchFingerDistance ) * option_map.touchPinchMultiplier;

			pinchFingerDistance  = pinchValue;
			doMovePinch  = true;
		} else if ( motionPinchId === motion_id ) {
			if ( namespaceBindMap.pinchMove || namespaceBindMap.pinch ) {
				pinchDelta = motion_map.deltaY * option_map.mousePinchMultiplier;
				doMovePinch = true;
			}
		}

		if ( doMovePinch ) {
			if ( namespaceBindMap.pinchMove ) {
				event = $.Event('pinchMove');
				motion_map.pinchDelta = pinchDelta;
				$.extend( event, motion_map );
				$(motion_map.boundElement).trigger(event);
			}
			if ( namespaceBindMap.pinch ) {
				event = $.Event('pinch');
				motion_map.pinchDelta = pinchDelta;
				$.extend( event, motion_map );
				$(motion_map.boundElement).trigger(event);
			}
			return;
		}
	};

	/**
	 * End Motion Handler 
	 *
	 * Calls Tap or pinchEnd
	 *
	 * @param array arg_map Argument Map
	 */
	endMotionFunction   = function ( arg_map ) {
		var motion_id    = arg_map.motion_id,
			sourceEvent  = arg_map.sourceEvent,
			doEndPinch   = false,
			motion_map, option_map, namespaceBindMap, event;

		disableMouse = false;

		if ( ! currentMotion[motion_id] ) { return; }

		motion_map              = currentMotion[motion_id];
		option_map              = motion_map.option_map;
		namespaceBindMap        = option_map.namespaceBindMap;

		motion_map.elem_target  = sourceEvent.target;
		motion_map.ms_elapsed   = sourceEvent.timeStamp - motion_map.ms_timestart;
		motion_map.ms_timestop  = sourceEvent.timeStamp;

		if ( motion_map.currentX ) {
			motion_map.deltaX   = sourceEvent.clientX - motion_map.currentX;
			motion_map.deltaY   = sourceEvent.clientY - motion_map.currentY;
		}

		motion_map.currentX     = sourceEvent.clientX;
		motion_map.currentY     = sourceEvent.clientY;

		motion_map.endX         = sourceEvent.clientX;
		motion_map.endY         = sourceEvent.clientY;

		motion_map.timeStamp    = sourceEvent.timeStamp;

		if ( motion_map.idto_tapheld ) {
			clearTimeout(motion_map.idto_tapheld);
			delete motion_map.idto_tapheld;
		}

		if ( namespaceBindMap.tap &&
			 motion_map.ms_elapsed <= option_map.tap_time &&
			 motion_map.allowTap ) {
			event = $.Event('tap');
			$.extend( event, motion_map );
			$(motion_map.boundElement).trigger(event);
		}

		if ( motion_id === motionPinchId ) {
			doEndPinch = true;
			motionPinchId = undefined;
		} else if ( motion_id === pinchOneId ) {
			if ( pinchTwoId ) {
				pinchOneId = pinchTwoId;
				pinchTwoId = undefined;
				doEndPinch = true;
			} else pinchOneId = undefined;
			pinchFingerDistance  = -1;
		}
		
		if ( motion_id === pinchTwoId ) {
			pinchTwoId = undefined;
			pinchFingerDistance  = -1;
			doEndPinch   = true;
		}

		if ( doEndPinch && ( namespaceBindMap.pinchEnd || namespaceBindMap.pinch ))  {
			if(namespaceBindMap.pinchEnd) {
				event = $.Event('pinchEnd');
				motion_map.pinchDelta = 0;
				$.extend( event, motion_map );
				$(motion_map.boundElement).trigger(event);
			}
			if(namespaceBindMap.pinch) {
				event = $.Event('pinch');
				motion_map.pinchDelta = 0;
				$.extend( event, motion_map );
				$(motion_map.boundElement).trigger(event);
			}
		}

		delete currentMotion[motion_id];
	};

	/**
	 * Touch Handler Function
	 *
	 * @param event TouchEvent to Handle
	 */
	onTouch = function ( event ) {
		var timestamp   = +new Date(),
			touches   = event.originalEvent.changedTouches || [],
			touch_event, touchID,
			functionHandler;

		disableMouse = true;

		event.timeStamp = timestamp;

		switch ( event.type ) {
		case 'touchstart':
			functionHandler = startMotionFunction;
			break;
			
		case 'touchmove'  :
			functionHandler = moveMotionFunction;
			event.preventDefault();
			break;
			
		case 'touchend': 
		case 'touchcancel':
			functionHandler = endMotionFunction;
			break;
			
		default:
			return;
		}

		if ( !functionHandler ) return;

		for ( var i = 0; i < touches.length; i++ ) {
			touch_event  = touches[i];

			touchID = 'touch' + String(touch_event.identifier);

			event.clientX = touch_event.clientX;
			event.clientY = touch_event.clientY;
			
			functionHandler({
				elem        : this,
				motion_id   : touchID,
				sourceEvent : event
			});
		}
	};

	/**
	 * Mouse Handler Function
	 *
	 * @param event MouseEvent to Handle
	 */
	onMouse = function ( event ) {
		var buttonID        = 'mouse' + String(event.button),
			shiftHeld       = false,
			functionHandler;

		if ( disableMouse ) {
			event.stopImmediatePropagation();
			return;
		}

		if ( event.shiftKey ) shiftHeld = true;
		
		if ( event.type !== 'mousemove' ) {
			if ( event.button !== 0 ) return true;
		}

		switch ( event.type ) {
		case 'mousedown':
			functionHandler = startMotionFunction; 
			break;
			
		case 'mouseup':
			functionHandler = endMotionFunction;
			break;
			
		case 'mousemove':
			functionHandler = moveMotionFunction;
			event.preventDefault();
			break;
			
		default:
			return;
		}

		if ( functionHandler ) {
			functionHandler({
				elem        : this,
				sourceEvent : event,
				shiftHeld   : shiftHeld,
				motion_id   : buttonID
			});
		}
	};

	/**
	 * Export Events
	 */
	$eventSpecial.swipeRight  = $eventSpecial.swipeLeft  = $eventSpecial.swipeUp   = $eventSpecial.swipeDown = 
	$eventSpecial.flingRight  = $eventSpecial.flingLeft  = $eventSpecial.flingUp   = $eventSpecial.flingDown = 
	$eventSpecial.pinchStart  = $eventSpecial.pinchMove  = $eventSpecial.pinchEnd  = 
	$eventSpecial.rotateStart = $eventSpecial.rotateMove = $eventSpecial.rotateEnd =
	$eventSpecial.tap         = $eventSpecial.hold       = $eventSpecial.pinch     = $eventSpecial.rotate    = gestureObject;
}(jQuery));