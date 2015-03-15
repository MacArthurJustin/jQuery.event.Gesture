# jQuery.event.Gesture [![Version](http://img.shields.io/badge/version-0.6.3-brightgreen.svg)]
A jQuery plugin to add Gesture support to websites using mouse and touch. Gestures include tap, hold, swipe, fling, pinch, rotate

## Getting Started

Download the [production version][min] or the [development version][max]
You can also install via [NPM] or [Bower]

[min]: https://raw.githubusercontent.com/MacArthurJustin/jQuery.event.Gesture/master/jquery.event.Gesture.min.js
[max]: https://raw.githubusercontent.com/MacArthurJustin/jQuery.event.Gesture/master/jquery.event.Gesture.js
[NPM]: https://www.npmjs.com/
[Bower]: http://twitter.github.io/bower

Adding to your page:

```html
<div id="BoxtoSwipe">Swipe Here</div>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="jquery.event.Gesture.min.js"></script>
<script>
	$("#BoxtoSwipe").on("swipeRight", function() {
		// Code to occur when the element is swiped to the right
	});
</script>
```

## Documentation

### Gestures

**Gesture** keeps track of these methods:  
(Rotate will be in the future)

          | tap | hold | fling | pinch | Rotate |
----------|-----|------|-------|-------|--------|
Available |  ✔  |  ✔   |   ✔   |  ✔    |    ✘   |

### Event parameters

**Gesture** sends information about it's current state to the event functions :
- ms_elapsed   : Time in milliseconds since the motion began
- ms_timestart : Timestamp of when the motion began
- ms_timestop  : Timestamp of when the motion ended (Undefined in all but tap, hold, and pinchEnd events)
- startX       : Start point X coordinate for the motion
- startY       : Start point Y coordinate for the motion
- currentX     : Current X coordinate of the finger or mouse cursor
- currentY     : Current Y coordinate of the finger or mouse cursor
- deltaX       : Change in X coordinate between firing of events
- deltaY       : Change in Y coordinate between firing of events
- endX         : End point X coordinate for motion (Undefined in all but tap, hold, and pinchEnd events)
- endY         : End point Y coordinate for motion (Undefined in all but tap, hold, and pinchEnd events)

### Mouse Events

**Gesture** maps mouse events to the **Gesture** events, for the most part they are the same except for :
- pinch  : Hold Shift and move the mouse vertically to simulate a pinch
- rotate : Hold Ctrl and move the mouse vertically to simulate a rotation

## Release History

```
v0.6.3
 - First version uploaded to Github
 - Npm and Bower support

v0.6.2
 - Added pinch aggregated event to supplement pinchStart, pinchMove, and pinchEnd

v0.6.1
 - Modified fling code to reduce overhead and lag issues

v0.6.0
 - Added Pinch Events

v0.5.0
 - Added Fling Events
 - Added Multi-finger map events
 - Rewrote Swipe Event breaking down into four cardinal directions
 
v0.4.0
 - Added Swipe Events

v0.3.0
 - Rewrote base code to utilize added event information

v0.2.0
 - Added Hold event
 - Captured Touch and Mouse Events
 
v0.1.0
 - Initial Version
 - Added Tap event
```