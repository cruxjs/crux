//****************************************
// Crux Javascript Library - GUI Module
//  Greg Houldsworth
//  Aaron Murray
//****************************************


//create a private scope
(function(window){
  
//declare module-wide variables
var _ = window.crux,
    version = 0.01,
    undefined,
    document = window.document,
    _cache = {
      //TODO: do we need a cache object in the gui module?
    },
    _hasOwnProperty = Object.prototype.hasOwnProperty,
    _toString       = Object.prototype.toString,
    _trim     = String.prototype.trim,
    _push     = Array.prototype.push,
    _concat   = Array.prototype.concat,
    _slice    = Array.prototype.slice,
    _splice   = Array.prototype.splice,
    _every    = Array.prototype.every,
    _forEach  = Array.prototype.forEach,
    _filter   = Array.prototype.filter,
    _unshift  = Array.prototype.unshift,
    _indexOf  = Array.prototype.indexOf,
    _lastIndexOf = Array.prototype.lastIndexOf;
    
//
if(!_){ throw('Crux GUI requires the Crux Core module');  }

//----------------------------------------------------------------------------------
//CORE GUI MODULE
//----------------------------------------------------------------------------------
var gui = _.gui = {
  "version": version,
  /***************************************************************/
  //findScriptPath
  //find the absolute path of an included script by it's file name
  "findScriptPath": function findScriptPath(scriptFileName){
    var ind,
        objParts,
        nl;
    scriptFileName = scriptFileName.toLowerCase();
    
    if(document.currentScript && (objParts = _.str.parseUri(document.currentScript)).file.toLowerCase() == scriptFileName){
      return objParts.path;
    }
    nl = document.getElementsByTagName('script');
    
    for(var i=0,l=nl.length; i<l; i++){
      
      if(nl[i].src && (objParts = _.str.parseUri(nl[i])).file.toLowerCase() == scriptFileName){
        return objParts.path;
      }
    }
    return null;
  }
};



//----------------------------------------------------------------------------------
//DESIGN COMPONENTS MODULE
//----------------------------------------------------------------------------------
var components;
(function(){
  
  
  components = gui.components = {
    Box: _.Object.subclass({
      "init": function(attachTo){
        this.attachTo = attachTo || document.getElementsByTagName('body')[0];
        var el = this.element = _.dom.make('div', {"class": "GUIComponentBox"});
      },
      "show": function(endOpacity){
        this.attachTo && (this.element.parentNode !== this.attachTo) && _.dom.append(this.element, this.attachTo);
        gui.show(this.element, null, endOpacity || 1);
        _.fire(this, 'show', {"bubbles": true});
      },
      "hide": function(){
        gui.hide(this.element);
        _.fire(this, 'hide', {"bubbles": true});
      },
      "setParent": function(obj){
        this.parentNode = obj;
      },
      "center": function(){
        var el = this.element;
        var g = _.dom.geometry();
        el.style.top  = (g.viewportHeight / 2) - (parseInt(el.style.height, 10) / 2) + 'px';
        el.style.left = (g.viewportWidth / 2) - (parseInt(el.style.width, 10) / 2) + 'px';
      }
    })
  };
  
  _.extend(components, {
    Overlay: components.Box.subclass({
      "init": function(attachTo){
        this.attachTo = attachTo || document.body;
        this._parent('init', arguments);
        var ths = this;
        _.extend(this.element.style,{position: 'absolute', top: 0, left: 0, "zIndex": 100, backgroundColor: '#000', opacity: .4});
        _.listen(window, 'resize scroll', function(){ ths.sizeToViewport(); });
      },
      "sizeToViewport": function(){
        var el = this.element;
        var g = _.dom.geometry();
        el.style.height = g.viewportHeight + g.verticalScroll   - 15  + 'px';
        el.style.width  = g.viewportWidth  + g.horizontalScroll + 'px';
      },
      "show": function(endOpacity){
        this._parent('show', [endOpacity || .4]);
        if(this.parentNode){
          var x = +_.dom.getStyle(this.parentNode.element, 'z-index');
          this.element.style.zIndex = isNaN(x) ? 1 : x - 1;
        }
        this.sizeToViewport();
      },
      "setParent": function(obj){
        this._parent('setParent', arguments);
        this.parentNode = obj;
        var ths = this;
        _.events.addDefaultAction(obj, 'show', function(objEvent){ if(objEvent.target !== ths){ ths.show(); } });
        _.events.addDefaultAction(obj, 'hide', function(objEvent){ if(objEvent.target !== ths){ ths.hide(); } });
      }
    }, "Overlay"),
    
    
    Button: _.Object.subclass({
      "init": function(){
        var obj = this;
        var el = this.element = _.dom.make('div', {"class": "componentButton", "style": "position: absolute; height:20px; background-color: #f55;"});
        _.listen(this.element, 'click', function(objEvent){
          (_.fire(obj, 'click', objEvent).returnValue === false) && objEvent.prevent();
        });
      },
      "setParent": function(obj){
        this.parentNode = obj;
        obj.element && _.dom.append(this.element, obj.element);
      },
      "show": function(){ gui.show(this.element); },
      "hide": function(){ gui.hide(this.element); }
    }, "Button"),
    
    Content: components.Box.subclass({
      "init": function(){
        this._parent('init');
        _.dom.addClass(this.element, 'contentComponent');
        _.extend(this.element.style, {
          "backgroundColor": "#eee",
          "border": "solid 1px #000",
          "overflow": "auto",
          "width": "400px",
          "height": "300px"
        })
      },
      "x": function(){}
    }),
    
    DragBox: components.Box.subclass({
      init: function(attachTo){
        //this._super.prototype.init.call(this);
        this._parent('init', arguments);
        var obj = this;
        var el = this.element;
        _.dom.addClass(el, "contentBox");
        _.extend(el.style,{
          "z-index": "500",
          "top": "0",
          "left": "0",
          "position": "absolute",
          "zIndex": "500",
          "width": "400px",
          "height": "30px"
        });

        el.innerHTML = '<div class="dragHandle" bunselectable="on" style="position:absolute; top: -30px;border-bottom: solid 1px; background-color: #eee;">Drag Handle</div>';

        this.attachTo = attachTo || document.getElementsByTagName('body')[0];
        this.components = {};
        
        var content = this.addComponent('content', new gui.components.Content());
        content.attachTo = this.element;
        content.show();
        
        this.addComponent('overlay', new gui.components.Overlay());
        var cb = this.addComponent('closeButton', new gui.components.Button());
        cb.element.style.top = '-30px';
        cb.element.style.right = '-30px';
        cb.element.innerHTML = 'Close';
        
        var ob = this.addComponent('otherButton', new gui.components.Button());
        ob.element.innerHTML = 'Other';
        ob.element.style.top = '-30px';
        ob.element.style.right = '20px';
        
        _.listen(this, 'click', function(objEvent){
          if(objEvent.target == obj.components.closeButton){
            obj.hide();
          }
        });
        
        _.listen(this.element, 'click', function(objEvent){
          var el = _.dom.make('span');
          el.innerHTML = objEvent.target.tagName + '.' + _.dom.getClass(objEvent.target) + '<br>'
          obj.components.content.element.appendChild(el);
        });
        
        //_.events.listenMany([el, el.firstChild], 'dragstart selectstart', function(objEvent){ objEvent.prevent(); });
        _.events.listen(el.firstChild, 'selectstart', function(objEvent){ objEvent.prevent(); });
        
        var firstMove;
        _.listen(el, 'mousedown', function(objEvent){
          firstMove = true;
          var hc = _.dom.hasClass(objEvent.target, 'dragHandle');
          console.log(hc);
          
          if(!hc){
            return;
          }
          
          console.log('mousedown: ' + objEvent.target.tagName + '.' + _.dom.getClass(objEvent.target));
          
          objEvent.prevent();
          obj.initialMouseXY = [objEvent.x, objEvent.y];
          obj.initialBoxXY = [parseInt(_.dom.getStyle(el, 'left'), 10), parseInt(_.dom.getStyle(el, 'top'), 10)];
          
          _.listen(document, 'mousemove', moveListener);
          //friggen ie
          var mouseUpListener;
          _.listen(document, 'mouseup', mouseUpListener = function(objEvent){

            console.log('mouseup: ' + objEvent.target.tagName + '.' + _.dom.getClass(objEvent.target));
            _.unlisten(document, 'mousemove', moveListener);
            _.unlisten(document, 'mouseup', mouseUpListener);
            _.fire(obj, 'move', {bubbles: true});
          });
        });
        
        function moveListener(objEvent){
          var x = obj.initialBoxXY[0] + (objEvent.x - obj.initialMouseXY[0]) + 'px';
          var y = obj.initialBoxXY[1] + (objEvent.y - obj.initialMouseXY[1]) + 'px';
          if(el.style.left != x || el.style.top != y){
            if(firstMove){
              console.log('mousemove: ' + objEvent.target.tagName + '.' + _.dom.getClass(objEvent.target));
              firstMove = false;
            }
            el.style.left = x;
            el.style.top  = y;
          }
        }
        this.show();
      },
      
      addComponent: function(name, obj){
        if(_.hasOwnProperty.call(this.components, name)){
          throw 'A component named "' + name + '" already exists';
        }
        this.components[name] = obj;
        obj.setParent ? obj.setParent(this) : (obj.parentNode = this);
        return obj;
      },
      
      center: function(){
        var el = this.element;
        var g = _.dom.geometry();
        el.style.top  = (g.viewportHeight / 2) - (parseInt(this.components.content.element.style.height, 10) / 2) + 'px';
        el.style.left = (g.viewportWidth / 2) - (parseInt(this.components.content.element.style.width, 10) / 2) + 'px';
      },
      
      
      show: function(){
        if(_.fire(this, 'beforeshow', {bubbles: true}).returnValue !== false){
          this._parent('show');
          this.center();
        }
      },
      hide: function(){
        if(_.fire(this, 'beforehide', {bubbles: true}).returnValue !== false){
          this._parent('hide');
        }
      }
    }, "DragBox")
    
  });
  
})();
//----------------------------------------------------------------------------------
//END DESIGN COMPONENTS MODULE
//----------------------------------------------------------------------------------




//----------------------------------------------------------------------------------
//ANIMATION MODULE
//----------------------------------------------------------------------------------
(function(){
  
  //local vars
  var animatedElements = [],
      animationActive = false,
      windowActive = true,
      imageAnimations = 0,
      stepLastFired = 0,
      mainStepInterval = 20, //in milliseconds
      
      //choose the an available method to trigger the animationStepper
      stepTrigger = window.requestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    function(f){ return setTimeout(f, mainStepInterval); };
  
  //allow the "animation" property to pass through the event normalization process
  _.extend(_.events.Event.prototype.converters, {animation: true});
  
  //extend the gui module object
  _.extend(_.gui, {
    //enable/disable animation. with animation disabled, fx will jump straight to the "end" state for an animation.
    //(pull down menus and similar functionalities still work, but arent' animated)
    animationEnabled: true,
    //enable/disables throttling of requestAnimationFrame to 3/4 of the mainStepInterval, to reduce CPU load.
    throttleRAF: true,
    
    //default values for animation and transitions
    defaults: {
      //"transition": "default",
      "transition": "linear",
      "bezierPoints": [[0, 0], [250, 10], [50, -3], [100, 100]],
      "ignoreInactiveState": true
    },
    
  
    //"property set adaptor"s are responsible for setting the actual style property on the element
    //(or redirecting compound animations into their simpler parts)
    propertySetAdaptors: {
      "defaultAdaptor": function(el, value, key){
        el.style[key] = Math.round(value) + 'px';
      },
      "opacity": function(el, value){
        //set the opacity using the library method (and stay within the 0 to 100 range)
        _.dom.setOpacity(el, Math.max(Math.min(value, 1), 0));
      },
      "size": function(el, values){
        //use the default adaptor to set the width, then the height
        gui.propertySetAdaptors.defaultAdaptor(el, values[0], 'width');
        gui.propertySetAdaptors.defaultAdaptor(el, values[1], 'height');
      },
      "offset": function(el, values){
        //use the default adaptor to set the top and then left offsets
        gui.propertySetAdaptors.defaultAdaptor(el, values[0], 'top');
        gui.propertySetAdaptors.defaultAdaptor(el, values[1], 'left');
      },
      "zIndex": function(el, value){
        el.style.zIndex = value;
      },
      //genericColorSetAdaptor
      //used to set a color value for a css style in RGB. (eg. rgb(255, 0, 85) or rgba(255,0,85, 0.7))
      "color": function(el, value, key){
        var setTo = false;
        if((value[0] || value[0] === 0)  && (value[1] || value[1] === 0) && (value[2] || value[2] === 0)){
          setTo = (value[3] || value[3] === 0) ? 'rgba(' : 'rgb(';
          setTo += Math.round(value[0]) + ',' + Math.round(value[1]) + ',' + Math.round(value[2])
          setTo += (value[3] || value[3] === 0) ? ',' + value[3] + ')' : ')';
          el.style[key] = setTo;
        }
        return setTo;
      },
      "backgroundColor": function(){ return gui.propertySetAdaptors.color.apply(this, arguments); },
      "borderColor": function(){ return gui.propertySetAdaptors.color.apply(this, arguments); }
    },
    
    propertyGetAdaptors: {
      "defaultAdaptor": function(el, key){
        var val = el.style[key];
        if(val && val.toLowerCase().indexOf('px') > -1){
          val = parseFloat(val);
        }
        else{
          val = NaN;
        }
        /*
        //use the offset property
        if(isNaN(val) && (key == 'height' || key == 'width' || key == 'top' || key == 'left')){
          val = el['offset' + key.substr(0,1).toUpperCase() + key.substr(1)];
        }
        */
        if(isNaN(val)){
          val = parseFloat(_.dom.getStyle(el, _.str.toDashed(key)));
        }
        return (val || val === 0) ? val : null;
      },
      "opacity": function(el, key){
        return _.dom.getOpacity(el);
      },
      "size": function(el){
        return [gui.propertyGetAdaptors.defaultAdaptor(el, 'width'), gui.propertyGetAdaptors.defaultAdaptor(el, 'height')];
      },
      "offset": function(el){
        return [gui.propertyGetAdaptors.defaultAdaptor(el, 'top'), gui.propertyGetAdaptors.defaultAdaptor(el, 'left')];
      },
      "color": function(el, key, objProp, objAni){
        //key is used instead of "color" because this is the default color getter and is used by other color properties
        var c = gui.util.parseColorString(el.style[key] || _.dom.getStyle(el, _.toDashed(key))) || [0,0,0];
        if(objProp.end){
          if(objProp.end.length == 4 && c.length == 3){
            c[3] = 1;
          }
          c.length = objProp.end.length;
        }
        return c;
      },
      "backgroundColor": function(){ return gui.propertyGetAdaptors.color.apply(this, arguments); },
      "borderColor": function(){ return gui.propertyGetAdaptors.color.apply(this, arguments); }
    },
  
  
    transitions: {
      "default": function(start, end, percentComplete){
        return (end-start)*(bezierTransition([[0,0], [25, 10], [25,100], [100,100]], percentComplete/100)[1]/100) + start;
      },
      "linear": function(start, end, percentComplete){
        return (end-start)*(percentComplete/100) + start;
      },
      "power": function(start, end, percentComplete, objProp, valueIndex, objAni){
        return powerTransition(start, end, percentComplete, objProp.exp || objAni.exp || 2);
      },
      "square": function(start, end, percentComplete){
        return powerTransition(start, end, percentComplete, 2);
      },
      "squareroot": function(start, end, percentComplete){
        return powerTransition(start, end, percentComplete, 1/2);
      },
      "bezier": function(start, end, percentComplete, objProp, valueIndex, objAni){
        var coords = bezierTransition(objProp.points || objAni.points || gui.defaults.bezierPoints, percentComplete/100);
        return (end-start)*(coords[0]/100) + start;
      },
      "bounce": function(start, end, percentComplete, objProp, valueIndex, objAni){
        //used only in this method
        function baseOrIndexOrDefault(obj, ind, defaultValue){
          var val = (obj && (ind || ind === 0)) ? obj[ind] : obj;
          return (typeof val == 'undefined') ? defaultValue : val;
        }
        
        //if there was a maximum bounce value defined, use it, or default to 100
        var maximum = Math.abs(baseOrIndexOrDefault(objProp.max, valueIndex, 100)),
            //if a bounce direction was defined, it will limit the return value from crossing the y axis 
            direction = (baseOrIndexOrDefault(objProp.direction, valueIndex) || '').charAt(0),
            //x coordinate
            x = percentComplete, 
            //amplitude
            a = 100 - x,
            //period
            b = Math.PI / 100 * baseOrIndexOrDefault(objProp.times, valueIndex, 3) * (direction ? 1 : 2),
            //phase shift
            c = 0; 
            //vertical shift
            d = (start != end) ? percentComplete : 0;
        
        //work out a "virtual percentage complete" using a sine wave equation 
        var virtualPercentage = a * Math.sin(b * x + c);
        //if the direction was 
        if(direction == '+' || direction == 'p'){
          virtualPercentage = Math.abs(virtualPercentage);
        }
        else if(direction == '-' || direction == 'n'){
          virtualPercentage = -Math.abs(virtualPercentage);
        }
        virtualPercentage += d;
        //console.log(start, end, percentComplete, virtualPercentage, maximum, (end-start)*(virtualPercentage/100) + start);
        return (end-start+maximum)*(virtualPercentage/100) + start;
      }
    },
    
    
    Animation: (function(){
      //constructor
      function Animation(el, fn){
        this.element = el;
        this.fnComplete = fn;
      }
      //add prototype methods
      Animation.prototype = {
        "parentNode": gui,
        "toString": function(){
          return '[object Animation]';
        },
        //------------------------------------------------------------------------
        //start
        //begins the animation process for an animation
        //------------------------------------------------------------------------
        start: function start(){
          //if(!this.completed){
          //  return;
          //}
          var el = this.element;
          _.events.fireMany([this, el], 'animationstart', {animation: this, bubbles: true, cancelable: false});
          //if the element isn't already in the array of currently animated elements
          if(animatedElements.indexOf(el)<0){
            //add it to the array
            animatedElements.push(el);
            //fire the "animationqueuestart" event on the element
            _.fire(el, 'animationqueuestart', {bubbles: true, "cancelable": false});
          }
          //if we have no animation loop running currently
          if(!animationActive){
            animationActive = true;
            stepTrigger(animationStepper);
          }
        },
        "pause": function(){
          if(this.paused){
            return false;
          }
          this.paused = true;
          var el = this.element,
              ar = _.getData(el, '__animations__');
          //fire the pause event on the animation object and the element
          _.events.fireMany([this, el], 'animationpause', {animation: this, bubbles: true, cancelable: false});
          //if all the animation objects are paused, fire the queue pause event
          ar.every(function(obj){ return obj.paused; }) && _.fire(el, 'animationqueuepause', {"cancelable": false});
          return true;
        },
        "unpause": function(){
          if(!this.paused){
            return false;
          }
          //re-calculate the end time
          this.endTime = (new Date()).getTime() + (this.duration*((100-this.percentageComplete)/100));
          //and start time, based on the current time, percentage complete and duration
          this.startTime = this.endTime - this.duration;
          this.paused = false;
          _.events.fireMany([this, this.element], 'animationunpause', {animation: this, bubbles: true, cancelable: false});
          //if all the animation objects are paused, fire the queue pause event
          ar.some(function(obj){ return !obj.paused; }) && _.fire(el, 'animationqueueunpause', {"cancelable": false});
          return true;
        },
        "cancel": function(){
          //if this animation is already done
          if(this.cancelled || this.completed){
            //don't go through the whole process
            return;
          }
          var index,
              el = this.element,
              ar = _.getData(el, '__animations__');
              
          this.completed = false;
          this.cancelled = true;
          
          if(ar){
            for(var i=0,l=ar.length; i<l; i++){
              if(ar[i] == this){
                ar.splice(i, 1);
                _.setData(el, '__restartAnimations__', true);
                break;
              }
            }
            if(!ar.length){
              _.setData(el, '__animations__');
              _.setData(el, '__restartAnimations__');
              _.fire(el, 'animationqueuecancel', {"cancelable": false});
              ((index = animatedElements.indexOf(el))+1) && animatedElements.splice(index, 1);
            }
          }
          //if there was a callback function provided
          if(this.fnComplete){
            //call it now (and pass the first parameter as 0, to indicate unsuccessful completion)
            this.fnComplete(0);
          }
          _.events.fireMany([this, this.element], 'animationcancel', {animation: this, bubbles: true, cancelable: false});
        }
      };
      
      return Animation;
    })(),
  
  
  
    //------------------------------------------------------------------------
    //animate
    //
    //------------------------------------------------------------------------
    animate: function animate(el, obj, fn){
      return _.isArray(el) ? el.map(function(one){ return gui.addAnimation(one, obj, fn); }) : gui.addAnimation(el, obj, fn);
    },
    
    
    //------------------------------------------------------------------------
    //addAnimation
    //
    //------------------------------------------------------------------------
    addAnimation: function addAnimation(el, obj, fn){
      var objThisAni = new gui.Animation(el, fn);
      objThisAni = _.extend(objThisAni, _.clone(obj, true));
      var arInProgress = _.getData(el, '__animations__') || _.setData(el, '__animations__', []);
      arInProgress.length && _.setData(el, '__restartAnimations__', true);
      arInProgress.push(objThisAni);
      _.events.fireMany([objThisAni, el], 'animationadd', {animation: this, bubbles: true, cancelable: false});
      !objThisAni.delayStart && objThisAni.start();
      return objThisAni;
    },
    
    
    //------------------------------------------------------------------------
    //pauseAnimation
    //
    //------------------------------------------------------------------------
    startAnimation: function pauseAnimation(el){
      var ar = _.getData(el, '__animations__');
      ar && ar.forEach(function(o){ o.start(); });
    },
    
    
    //------------------------------------------------------------------------
    //pauseAnimation
    //
    //------------------------------------------------------------------------
    pauseAnimation: function pauseAnimation(el){
      var ar = _.getData(el, '__animations__');
      ar && ar.forEach(function(o){ o.pause(); });
    },
    
    //------------------------------------------------------------------------
    //unpauseAnimation
    //
    //------------------------------------------------------------------------
    unpauseAnimation: function pauseAnimation(el){
      var ar = _.getData(el, '__animations__');
      ar && ar.forEach(function(o){ o.unpause(); });
    },
    
    
    //------------------------------------------------------------------------
    //isPaused
    //returns true is there are animations paused on an element
    //------------------------------------------------------------------------
    isPaused: function isPaused(el){
      var ar = _.getData(el, '__animations__');
      //this doesn't make sense
      //we should check to see if any have a "paused" property
      return !!(ar && ar.length && !animatedElements.some(function(arEl){ return arEl == el; }));
    },
    
    
    //------------------------------------------------------------------------
    //cancelAnimation
    //
    //------------------------------------------------------------------------
    cancelAnimation: function cancelAnimation(el){
      var ar = _.getData(el, '__animations__');
      ar && ar.forEach(function(o){ o.cancel(); });
    },
    
    
    bounce: function bounce(el, fn, times){
      times = times || 4;
      var cb = _.getData(el, 'ddpfx_currentBounce');
      if(cb){
        cb.cancel();
      }
      var cp = el.style.position;
      if(cp != 'absolute' || cp != 'fixed'){
        el.style.position = 'relative';
      }
      var obj = animate(el, {
        "duration": 200 * times,
        "skipQueue": true,
        "properties": {
          "top": {
            "transition": "bounce",
            "max": 30,
            "times": times,
            "direction": "-"
          }
        }
      }, fn);
      
      _.setData(el, 'ddpfx_currentBounce', obj);
      _.listen(obj, 'animationcomplete animationcancel', function(){
        try{
          el.style.position = cp;
          el.style.top = this.properties.top.start + 'px';
        }
        catch(e){}
        
        _.setData(el, 'ddpfx_currentBounce');
      });
      return obj;
    },
    
    
    
    show: function show(el, fn, endOpacity){
      _.dom.setOpacity(el, 0);
      if(el.style.display == 'none'){
        el.style.display = '';
      }
      return gui.animate(el, {
        "duration": 500,
        "properties": {
          "opacity": {
            "transition": "linear",
            "start": 0,
            "end": endOpacity || 1
          }
        }
      }, fn);
    },
    
    
    hide: function hide(el, fn){
      var ch = _.getData(el, 'ddpfx_currentHide');
      if(ch){
        ch.cancel();
      }
      
      var cd = el.style.display;
      
      var obj = gui.animate(el, {
        "duration": 200,
        "properties": {
          "opacity": {
            "transition": "linear",
            "end": 0
          }
        }
      });
      
      _.setData(el, 'ddpfx_currentHide', obj);
      
      _.listen(obj, 'animationcomplete', function(){
        el.style.display = 'none'
        _.setData(el, 'ddpfx_currentHide');
      });
      _.listen(obj, 'animationcancel', function(){
        el.style.display = cd;
        _.dom.setOpacity(el, 1);
        _.setData(el, 'ddpfx_currentHide');
      });
      return obj;
    },
    
  
    //util sub-module
    util: {
      //parseColorString
      //accepts a color string in formats #xxx, #xxxxxx, rgb, rgba, hsl, or hsla
      //returns a 3 element array with each element in the range 0-255
      //(if alpha-transparency was detected, a 4th element in the range 0-1 will be passed back)
      //ie: [255,0,0]   //red
      //    [255,255,255,1] //white, fully opaque
      parseColorString: function parseColorString(str){
        var ar = [],
            pos = str.indexOf('('), 
            codeType,
            parts,
            i, l, ts;
        str = _.str.trim(str.replace('#', ''));
      
        if(pos+1){
          codeType = str.substring(0, pos).toLowerCase();
          parts = str.substr(codeType.length+1, str.length-codeType.length-2).split(',');
          if(parts.length>2){
            if(codeType.substr(0,3) == 'rgb'){
              i = 3;
              while(i--){
                ts = parts[i];
                ar[i] = ts.substr(ts.length-1) == '%' ? parseInt(ts, 10) / 100 * 255 : parseInt(ts, 10);
              }
            }
            else if(codeType.substr(0,3) == 'hsl'){
              for(i=1; i<3; i++){
                if(parts[i].substr(parts[i].length-1) == '%'){
                  parts[i] = parseInt(parts[i], 10)/100;
                }
              }
              ar = gui.util.hslToRgb(parts[0]/360, parts[1], parts[2]);
              i=3;
              while(i--){
                ar[i] = Math.round(ar[i]);
              }
            }
            if((codeType == 'rgba' || codeType == 'hsla') && parts.length > 3){
              ar[3] = parseFloat(parts[3]);
            }
          }
        }
        else{
          if(gui.util.simpleColors.hasOwnProperty(str)){
            str = gui.util.simpleColors[str];
          }
          if(str.length%3==0){
            l = str.length/3;
            i=3;
            while(i--){
              ar[i] = parseInt(_.str.repeat(str.substr(l*i, l),l==2 ? 1 : 2), 16);
            }
          }
        }
        return ar.length > 2 ? ar : null;
      },
      
      //hex values for color keywords 
      simpleColors: {
        aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '0ff', aquamarine: '7fffd4', azure: 'f0ffff', beige: 'f5f5dc',
        bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd', blue: '0000ff', blueviolet: '8a2be2', brown: 'a52a2a',
        burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00', chocolate: 'd2691e', coral: 'ff7f50', cornflowerblue: '6495ed',
        cornsilk: 'fff8dc', crimson: 'dc143c', cyan: '00ffff', darkblue: '00008b', darkcyan: '008b8b', darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9', darkgreen: '006400', darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f',
        darkorange: 'ff8c00', darkorchid: '9932cc', darkred: '8b0000', darksalmon: 'e9967a', darkseagreen: '8fbc8f',
        darkslateblue: '483d8b', darkslategray: '2f4f4f', darkturquoise: '00ced1', darkviolet: '9400d3', deeppink: 'ff1493',
        deepskyblue: '00bfff', dimgray: '696969', dodgerblue: '1e90ff', feldspar: 'd19275', firebrick: 'b22222', floralwhite: 'fffaf0',
        forestgreen: '228b22', fuchsia: 'f0f', gainsboro: 'dcdcdc', ghostwhite: 'f8f8ff', gold: 'ffd700', goldenrod: 'daa520',
        gray: '808080', green: '008000', greenyellow: 'adff2f', honeydew: 'f0fff0', hotpink: 'ff69b4', indianred : 'cd5c5c',
        indigo : '4b0082', ivory: 'fffff0', khaki: 'f0e68c', lavender: 'e6e6fa', lavenderblush: 'fff0f5', lawngreen: '7cfc00',
        lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080', lightcyan: 'e0ffff', lightgoldenrodyellow: 'fafad2',
        lightgrey: 'd3d3d3', lightgreen: '90ee90', lightpink: 'ffb6c1', lightsalmon: 'ffa07a', lightseagreen: '20b2aa',
        lightskyblue: '87cefa', lightslateblue: '8470ff', lightslategray: '778899', lightsteelblue: 'b0c4de', lightyellow: 'ffffe0',
        lime: '0f0', limegreen: '32cd32', linen: 'faf0e6', magenta: 'ff00ff', maroon: '800000', mediumaquamarine: '66cdaa',
        mediumblue: '0000cd', mediumorchid: 'ba55d3', mediumpurple: '9370d8', mediumseagreen: '3cb371', mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc', mediumvioletred: 'c71585', midnightblue: '191970',
        mintcream: 'f5fffa', mistyrose: 'ffe4e1', moccasin: 'ffe4b5', navajowhite: 'ffdead', navy: '000080', oldlace: 'fdf5e6',
        olive: '808000', olivedrab: '6b8e23', orange: 'ffa500', orangered: 'ff4500', orchid: 'da70d6', palegoldenrod: 'eee8aa',
        palegreen: '98fb98', paleturquoise: 'afeeee', palevioletred: 'd87093', papayawhip: 'ffefd5', peachpuff: 'ffdab9',
        peru: 'cd853f', pink: 'ffc0cb', plum: 'dda0dd', powderblue: 'b0e0e6', purple: '800080', red: 'f00', rosybrown: 'bc8f8f',
        royalblue: '4169e1', saddlebrown: '8b4513', salmon: 'fa8072', sandybrown: 'f4a460', seagreen: '2e8b57', seashell: 'fff5ee',
        sienna: 'a0522d', silver: 'c0c0c0', skyblue: '87ceeb', slateblue: '6a5acd', slategray: '708090', snow: 'fffafa',
        springgreen: '00ff7f', steelblue: '4682b4', tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8', tomato: 'ff6347',
        turquoise: '40e0d0', violet: 'ee82ee', violetred: 'd02090', wheat: 'f5deb3', white: 'fff', whitesmoke: 'f5f5f5',
        yellow: 'ff0', yellowgreen: '9acd32'
      },
      //-------------------------------------------------------------------------------------------------
      // rgbToHsl
      // Converts an RGB color value to HSL. 
      // Assumes r, g, and b in the range 0-255 and returns [h, s, l] in the range 0-1 
      //-------------------------------------------------------------------------------------------------
      rgbToHsl: function rgbToHsl(r, g, b){
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
      
        if(max == min){
          h = s = 0; // achromatic
        }else{
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch(max){
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return [h, s, l];
      },
      
      //-------------------------------------------------------------------------------------------------
      // hslToRgb
      // Converts an HSL color value to RGB. 
      // Assumes h, s, and l are contained in the range 0-1 and returns r, g, and b in the range 0-255
      //-------------------------------------------------------------------------------------------------
      hslToRgb: function hslToRgb(h, s, l){
        var r, g, b;
      
        if(s == 0){
          r = g = b = l; // achromatic
        }
        else{
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = gui.util.hue2rgb(p, q, h + 1/3);
          g = gui.util.hue2rgb(p, q, h);
          b = gui.util.hue2rgb(p, q, h - 1/3);
        }
        return [r * 255, g * 255, b * 255];
      },
      
      //-------------------------------------------------------------------------------------------------
      // hue2rgb
      //-------------------------------------------------------------------------------------------------
      hue2rgb: function hue2rgb(p, q, t){
        if(t < 0)
          t += 1;
        else if(t > 1)
          t -= 1;
        if(t < 1/6)
          return p + (q - p) * 6 * t;
        if(t < 1/2)
          return q;
        if(t < 2/3)
          return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
    }
  
  });
  
  
  //------------------------------------------------------------------------
  //animationStepper
  //animation step function (gets called every 20 milliseconds or so, if 
  //there are elements that need to be animated)
  //------------------------------------------------------------------------
  function animationStepper(){
    //some local variables
    var el, ar, objAni, firstQueued, key, thisProperty, transition,
        ct = (new Date()).getTime(); //current time
    
    //seems to make it really choppy... maybe reduce the step interval... 
    //don't want to make it out of sync with the setTimeout implementation step interval though 
    if(gui.throttleRAF && stepLastFired + (mainStepInterval*.5) >= ct){
      stepLastFired = ct;
      return stepTrigger(animationStepper);
    }
        
    //iterate through the array of animated elements
    for(var i=0, l=animatedElements.length; i< l; i++){
      //shortcut for the currently processed element
      el = animatedElements[i];
      //see if there is an array if animations stored for the element
      ar = _.getData(el, '__animations__');
      
      //remove the flag that would indicate that the array of animations
      //has been modified while iterating through it 
      _.setData(el, '__restartAnimations__');
      
      //if there is an array
      if(ar){
        //record the index of the first animation object that follows the queuing methodology
        firstQueued = -1;
        //iterate through it (we can't optimize this by storing the array length in a variable as the length can change during execution
        for(var j=0; j<ar.length; j++){
          //shortcut the current animation object 
          objAni = ar[j];
          
          //animations with the skipQueue flag will play regardless of their order in the array
          if(!objAni.skipQueue){
            //if there is no index recorded yet as the first queued animation
            if(firstQueued == -1){
              firstQueued = j;
            }
            //if this isn't the first animation object that follows the queuing methodology
            else if(j > firstQueued){
              //skip this animation until the previous one/s have finished
              continue;
            }
          }
          
          if(objAni.paused){
            continue;
          }
          //if animation has been disabled
          else if(!_.gui.animationEnabled){
            //just skip to the last step
            objAni.percentageComplete = 100;
          }
          //this is the first step run for this animation
          else if(!objAni.startTime){
            //set the start time as the current time
            objAni.startTime = ct;
            //figure out when the animation should end
            objAni.endTime = ct + objAni.duration;
            //it hasn't started yet so percentage complete is zero
            objAni.percentageComplete = 0;
            //fire the animation start event on the animation object and the element
            _.events.fireMany([objAni, el], 'animationstart', {animation: objAni, bubbles: true, cancelable: false});
          }
          else{
            //calculate the percentage complete based on the duration, start, end and current times
            objAni.percentageComplete = Math.min(((objAni.duration - (objAni.endTime - ct)) / objAni.duration) * 100, 100);
          }
          //console.log(windowActive, objAni.percentageComplete)
          //if the window isn't active, and it's not the final animation step
          if(!gui.defaults.ignoreInactiveState && !windowActive && objAni.percentageComplete != 100){
            continue; //skip the step
          }
          
          //iterate through the properties list provided
          //ddp.f.forOwnIn(objAni.properties, function(key, thisProperty){
          for(key in objAni.properties){
            if(!_.hasOwnProperty.call(objAni.properties, key)){
              continue;
            }
            thisProperty = objAni.properties[key];
            //if there was no end value specified
            if(!thisProperty.end && thisProperty.end != 0){
              //if there was a start value specified
              if(thisProperty.start || thisProperty.start == 0){
                //set the end value to the start
                thisProperty.end = thisProperty.start;
              }
              else{
                //try a property on the animation object called "endFallback", then default to zero
                thisProperty.end = thisProperty.start = thisProperty.endFallback || (gui.propertyGetAdaptors[key] || gui.propertyGetAdaptors.defaultAdaptor)(el, key, thisProperty, objAni) || 0;
              }
            }
            
            //if there's not start value
            if(!thisProperty.start && thisProperty.start != 0){
              //try to retrieve the current value with the "property get adaptor" for this CSS style (key),
              //otherwise use the default "property get adaptor", which get's the current style value in pixels
              thisProperty.start = (gui.propertyGetAdaptors[key] || gui.propertyGetAdaptors.defaultAdaptor)(el, key, thisProperty, objAni);
              //if we will be transitioning multiple values for this property
              if(_.isArray(thisProperty.end)){
                //iterate through the end array (because it will already have the required number of indexes) 
                thisProperty.end.forEach(function(val, ind){
                  //if there is a start value
                  if(typeof thisProperty.start[ind] == 'undefined' || isNaN(thisProperty.start[ind])){
                    //try to set the index of the start array to the value in "startFallback" if it's there, or default to zero
                    thisProperty.start[ind] = thisProperty.startFallback ? thisProperty.startFallback[ind] || 0 : 0;
                  }
                });
              }
              //we will be transitioning a single value for this property
              else{
                //if there is not start value
                if(!thisProperty.start && thisProperty.start !== 0){
                  //try falling back to a property called "startFallback" then to zero
                  thisProperty.start = thisProperty.startFallback || 0;
                  //throw 'Could not find a start value for ' + key + ' of <' + el.tagName + ' ' + el.id + '.' +el.className.split(' ').join('.') + '>';
                }
              }
            }
            
            //if this is the last step
            if(objAni.percentageComplete == 100){
              //ensure the final value we set is the end value
              thisProperty.currentValue = thisProperty.end;
            }
            //if this is the first step
            else if(objAni.percentageComplete == 0){
              //ensure the first value we set is the start value
              thisProperty.currentValue = thisProperty.start;
            }
            //otherwise we have to calculate the current value
            else{
              //find out which transition we'll be using
              //first look on this property object, then on the main animation object, then use the module default transition 
              transition = thisProperty.transition || objAni.transition || gui.defaults.transition
              
              //if the transition value is a string
              if(_.isString(transition)){
                //get the actual function reference from a property on the "transitions" object (ddp.fx.transitions)
                transition = gui.transitions[transition];
              }
              
              //if we are calculating multiple transition values for this property
              if(_.isArray(thisProperty.end)){
                //set the current value to an array so we can set it's indexes
                thisProperty.currentValue = [];
                //iterate through the indexes of the "end" array
                thisProperty.end.forEach(function(val, ind){
                  //set each currentValue index to the transitioned value corresponding to the same indexes of the start and end value arrays
                  //(based on the percentage complete and using the previously specified transition)  
                  thisProperty.currentValue[ind] = transition(thisProperty.start[ind], thisProperty.end[ind], objAni.percentageComplete, thisProperty, ind, objAni, key);
                });
              }
              else{
                //calculate the current value based on the start and end values and the current percentage complete (using the previously specified transition) 
                thisProperty.currentValue = transition(thisProperty.start, thisProperty.end, objAni.percentageComplete, thisProperty, undefined, objAni, key);
              }
            }
            //modify the element's property using the appropriate (or default) "property set adaptor" function
            (gui.propertySetAdaptors.hasOwnProperty(key) ? gui.propertySetAdaptors[key] : gui.propertySetAdaptors.defaultAdaptor)(el, thisProperty.currentValue, key, objAni);
          }
          //);
          
          //if this was the last step in the animation
          if(objAni.percentageComplete == 100){
            //set a flag on the animation object
            objAni.complete = true;
            //capture the actual end time for the animation
            objAni.actualEndTime = (new Date()).getTime();
            //remove this animation object from the array for this element
            ar.splice(j, 1);
            j--;  //decrement the loop counter
            //if there was a callback function provided
            if(objAni.fnComplete){
              //call it now (and pass the first parameter as 1, to indicate successful completion)
              objAni.fnComplete(1, objAni);
            }
            //fire the "animationcomplete" event on both the animation object and the element
            _.events.fireMany([objAni, el], 'animationcomplete', {animation: objAni, bubbles: true, cancelable: false});
            
            //if the animation array has been modified since we started iterating through it
            if(_.getData(el, '__restartAnimations__')){
              //unset the flag
              _.setData(el, '__restartAnimations__');
              //restart the loop counter
              j = -1;
            }
          }
        }
      }
      
      //if the array for this element doesn't exist or doesn't contain any indexes 
      if(!ar || !ar.length){
        //remove the data from the element
        _.setData(el, '__animations__');
        //remove the element from the array of animated elements
        animatedElements.splice(i, 1);
        l--; //decrement the loop length (the array length variable)
        i--; //decrement the loop counter
        //fire the "animationqueuecomplete" event
        _.fire(el, 'animationqueuecomplete', {"cancelable": false});
      }
    }
    //if there are any indexes in the animatedElements array
    if(l){
      stepTrigger(animationStepper);
    }
    else{
      //clear the flag
      animationActive = false;
    }
  }
  
  
  function powerTransition(start, end, percentComplete, powerValue){
    //return start + (Math.pow(percentComplete/100, powerValue)*(end - start));
      return (Math.pow(percentComplete/100, powerValue)*(end - start)) + start;
  }
  
  function bezierTransition(pts, t) {
    for (var a = pts; a.length > 1; a = b) // do..while loop in disguise
      for (var i = 0, b = [], j; i < a.length - 1; i++) // cycle over control points
        for (b[i] = [], j = 0; j < a[i].length; j++) // cycle over dimensions
          b[i][j] = a[i][j] * (1 - t) + a[i+1][j] * t; // interpolation
    return a[0];
  }
  
  
  //add some handlers to track the activity state of the window (or tab)
  if(_.events.supported('focusin', document.createElement('a'))){
    _.listen(document, 'focusin',  function(){ windowActive = true;  });
    _.listen(document, 'focusout', function(){ windowActive = false; });
  }
  else{
    _.listen(window, 'focus', function(){ windowActive = true;  });
    _.listen(window, 'blur',  function(){ windowActive = false; });
  }
  
  _.animate = gui.animate;

})();





})(
    //try to get a reference to the global object, regardless of the scope the code is executed in
    //kangax - http://perfectionkills.com/
    (function(){ return this || (1,eval)('this') })()
  );