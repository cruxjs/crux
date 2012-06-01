/********************************/
//  Crux Javascript Library
/********************************/

// Greg Houldsworth
// Aaron Murray


(function(window){ //create a private scope


var undefined,
    _version  = 0.01,
    document  = window.document,
    _ce       = function(t){ return document.createElement(t); },
    _trim     = String.prototype.trim,
    _push     = Array.prototype.push,
    _concat   = Array.prototype.concat,
    _slice    = Array.prototype.slice,
    _splice   = Array.prototype.splice,
    _config   = {
      "classRECaching" : true
    },
    _cache    = {
      "elementData": {}
    },
    _externalName = 'crux',
    _guidCounter =  0,
    _hasOwnProperty = Object.prototype.hasOwnProperty,
    _toString       = Object.prototype.toString,
    
    MAX_CLONE_DEPTH = 10;
    



/***************************************************************/
//if they don't exist, add the "forEach", "every" and "filter" methods to all Arrays using prototype
//(these methods were added in Javascript 1.6, so IE7  and lower doesn't support them)
if(!Array.prototype.forEach){
  Array.prototype.forEach = function(fn, thisObj){
    var scope = thisObj || window;
    for(var i=0, j=this.length; i < j; ++i){
      (i in this) && fn.call(scope, this[i], i, this);
    }
  };
}
if(!Array.prototype.every){
  Array.prototype.every = function(fn, thisObj){
    var scope = thisObj || window;
    for( var i=0, j=this.length; i < j; ++i ){
      if(i in this && !fn.call(scope, this[i], i, this)){
        return false;
      }
    }
    return true;
  };
}
if(!Array.prototype.filter){
  Array.prototype.filter = function(fn, thisObj){
    var scope = thisObj || window;
    var a = [];
    for(var i=0, j=this.length; i < j; ++i){
      if(i in this){
        if(fn.call(scope, this[i], i, this)){
          a.push(this[i]);
        }
      }
    }
    return a;
  };
}
if(!Array.prototype.map){
  Array.prototype.map = function(fn, thisObj){
    var scope = thisObj || window;
    var a = [];
    for(var i=0, j=this.length; i < j; ++i){
      if(i in this){
        a.push(fn.call(scope, this[i], i, this));
      }
    }
    return a;
  };
}
if(!Array.prototype.some){
  Array.prototype.some = function(fn, thisObj){
    var scope = thisObj || window;
    for(var i=0, l = this.length; i<l; i++){
      if(i in this && fn.call(scope, this[i], i, this))
        return true;
    }
    return false;
  };
}
//new in the es5 spec
if(!Array.prototype.indexOf){
  Array.prototype.indexOf = function(searchElement , fromIndex){
    if(fromIndex && fromIndex < 0){
      fromIndex = Math.max(0, this.length + fromIndex);
    }
    for(var i = fromIndex || 0, l=this.length; i<l; i++){
      if(this[i] === searchElement){
        return i;
      }
    }
    return -1;
  }
}
//new in the es5 spec
if(!Array.prototype.lastIndexOf){ 
  Array.prototype.lastIndexOf = function(searchElement, fromIndex){
    var i = this.length;
    if(fromIndex || fromIndex === 0){
      i = ((fromIndex < 0) ? Math.max(0, this.length + fromIndex) : Math.min(fromIndex, this.length - 1)) + 1;
    }
    while(i--){
      if(i in this && this[i] === searchElement){
        return i;
      }
    }
    return -1;
  }
}
//new-ish
if(!Array.prototype.unshift){ 
  Array.prototype.unshift = function(){
    Array.prototype.splice.apply(this, _.toArray([0,0], arguments));
    return this.length;
  }
}

var _every    = Array.prototype.every,
    _forEach  = Array.prototype.forEach,
    _filter   = Array.prototype.filter,
    _indexOf  = Array.prototype.indexOf,
    //TODO: so far unused, remove if we don't end up using them in the core module
    _unshift  = Array.prototype.unshift,
    _lastIndexOf = Array.prototype.lastIndexOf;


//-------------------------------------------------------------------------------
// detect a bunch of browser inconsistencies, for later use in the library core
//-------------------------------------------------------------------------------
var _detected = {
  "stringIndexes"    : "d"[0] == "d", //test if the browser supports accessing characters of a string using this notation: str[3]
  //test if Array.prototype.slice can be used on DOMNodeLists 
  //(IE<9 craps out when you try "slice()"ing a nodelist)
  "sliceNodeLists" : !!(function(){
    try{ return _slice.call(document.documentElement.children, 0); }
    catch(e){}
  })(),
  //detect the 
  "CSSClassAttribute": (function(){
    //create an element to test which attribute contains the actual CSS class string
    var el = _ce('div');
    el.innerHTML = '<p class="X"></p>';
    return el.children[0].getAttribute('className') == 'X' ? 'className' : 'class';
  })(),
  
  //create an element to test if the styleFloat property is not undefined
  "floatProperty": (function(){ return (_ce('div').style.styleFloat !== undefined) ? 'styleFloat' : 'cssFloat'; })(),
  
  "customEventsModule": (function(){
    try{ document.createEvent('CustomEvent'); return 'CustomEvent'; }
    catch(e){ return 'HTMLEvents'; }
  })()
};


//internal reference to the library core object is "_"
var _ = window[_externalName] = {
  version  : _version,
  config   : _config,
  detected : _detected,
  
  //***************************************************************
  //data type tests
  isArray    : function isArray(v){    return _toString.call(v) == '[object Array]';    },
  isString   : function isString(v){   return _toString.call(v) == '[object String]';   },
  isFunction : function isFunction(v){ return _toString.call(v) == '[object Function]'; },
  isDate     : function isDate(v){     return _toString.call(v) == '[object Date]';     },
  //***************************************************************
  //isElement
  isElement  : function isElement(v, allowDocument){
    var t;
    //1 = ELEMENT_NODE, 9 = DOCUMENT_NODE
    return !!(v && (t = v.nodeType) && (t == 1 || (allowDocument && t == 9)));
  },
  //***************************************************************
  //isObject
  //tests for plain objects {} which are not strings or arrays or DOMElements or functions (and not null) 
  isObject  : function isObject(v){
    //it's not null, has typeof "object", isn't a string, isn't an array, and isn't a function
    return (v !== null && typeof v == 'object' && !_.isString(v) && !_.isArray(v) && !_.isFunction(v) && !_.isDate(v) && !_.isElement(v));
  },
  
  newApply: function newApply(fnConstructor, arArguments, strName){
    var s='';
    strName = strName || 'f';
    for(var i=0,l=(arArguments ? arArguments.length : 0); i<l; i++){ s += (i==0 ? '' : ',') + 'a[' + i + ']'; }
    return new (new Function(strName, "a", 'return new ' + strName + '(' + s + ');'))(fnConstructor, arArguments);
  },
  
  //--------------------------------------------------
  //extend
  //copies properties from multiple objects into one object
  //
  extend: function extend(obj, obj1, obj2){
    var key, source;
    obj = obj || {};
    for(var i=1, l=arguments.length; i<l; i++){
      source = arguments[i];
      for(key in source){
        if(_hasOwnProperty.call(source, key)){
          obj[key] = source[key];
        }
      }
    }
    return obj;
  },
  
  /**************************************************/
  //guid: generate a part time / part counter based global unique identifier string
  guid: function guid(){ return Number((_guidCounter++) + '' + (new Date()).getTime()).toString(36); },
  
  /***************************************************************/
  //lastValue
  //Accepts a chain of properties, runs through to check if they are all defined
  //and then returns the value of the last property.
  //If the chain to be checked is not globally accessible (attached to the window object),
  //then the root object must be passed in the second argument and left out of the chain string.
  //If any of the chained properties are undefined the function retuns undefined
  //
  //eg. alert(typeof lastValue("ddp.a.requestManager.scriptCallbacks"));
  //    this will display "object" if the ddp.ajax.js file has been included, or "undefined" if it hasn't
  //eg. if you had an object accsessible from only with your namespace
  //    i.am.a.property = 'yep';
  //    lastValue("am.a.property", i); //returns 'yep'
  //    lastValue("am.potatosalad.property", i); //returns undefined (since potatosalad is undefined)
  lastValue: function lastValue(chain, root){
    var ar = chain.split('.'),
        //if a second argument was passed, use it, even if the value is undefined
        p = arguments.length == 2 ? root : window;
    
    for(var i=0, l=ar.length; i<l; p = p[ar[i++]]){
      //if it's undefined or null (with type coercion, null == undefined)
      if(p == undefined){ return; }
    }
    //return the last property even if it's undefined
    return p;
  },
  
  
  //***************************************************************
  //dom
  //
  dom: function dom(selector, context){ return new _.DOMSelection(selector, context, arguments[2]); },
  
  //***************************************************************
  //mergeIndexes
  //does the same this as extend except with only numeric properties
  mergeIndexes: function mergeIndexes(obj, obj1, obj2){
    var unique = (arguments[arguments.length-1] === true),
        obj = (arguments[0] == null ? [] : arguments[0]),
        objAdd = arguments[1],
        oia = _.isArray(obj),
        j, jl;
    for(j = 1, jl = arguments.length; j<jl; objAdd = arguments[++j]){
      if(objAdd && objAdd.length){
        if(_detected.sliceNodeLists || (oia && _.isArray(objAdd))){
          //console.log([obj.length,0].concat(_slice.call(objAdd, 0)));
          _splice.apply(obj, [obj.length,0].concat(_.isArray(objAdd) ? objAdd : _slice.call(objAdd, 0)));
          unique && _.unique(obj, false, obj.length-objAdd.length);
        }
        else{
          //TODO: add check for DOMElements (they have a length but to indexes)
          for(var i=0, l=objAdd.length; i<l; i++){
            if(!unique || _indexOf.call(obj, objAdd[i]) < 0){
              _push.call(obj, objAdd[i]);
            }
          }
        }
      }
    }
    return obj;
  },
  
  
  /***************************************************************/
  //clone
  //makes a "copy" of the object passed to it. (actually creates a new object and copies the old object's properties into it)
  //optional parameter "allProperties", if set to true, copies properties inherited through it's prototype
  //deep clone also clones the properties of the object that are objects as well (with cyclical references, this can cause an issue)
  clone: function clone(obj, deep, inherit){
    var cloned = new obj.constructor;
    clone.depth = (clone.depth === undefined) ? 0 : clone.depth;
    deep = (deep === true ? MAX_CLONE_DEPTH : Math.min(deep, MAX_CLONE_DEPTH)) || 0;
    //iterate through the object's properties
    for(var key in obj){
      //check to see if the property in question belongs to the object
      //if it doesn't, skip over this property
      if(_hasOwnProperty.call(obj, key)){
        //if it's not an "unknown" (ie6-8) type (happens with some native and activeX object)
        if(typeof obj[key] !== 'unknown'){
          if(clone.depth < deep && _.isObject(obj[key])){
            //if(){ throw 'clone depth exceeds maximum. you can haz infinite loop?'; }
            //copy the reference or data to the new object
            clone.depth++;
            cloned[key] = clone(obj[key], deep, false);
            clone.depth--;
          }
          else{
            cloned[key] = obj[key];
          }
        }
        else{
          //prolly won't work... but try anyway
          try{ cloned[key] = obj[key]; }
          catch(e){ console.log('tried to clone unknown data type:' + key); }
        }
      }
    }
    //return the new object
    return cloned;
  },
  
  
  /***************************************************************/
  //toArray 
  //takes an object with 'length' property and returns an actual array
  //(useful for 'arguments' and objects returned from getElementsByTagName(), etc..)
  toArray : _detected.sliceNodeLists ?
    //this approach won't work on DOM nodelists under ie6 (throws a "Jscript object expected" error) 
    function toArray(obj1, obj2, obj3){
      //iterate over the function's arguments
      for(var ar=[], i=0, l=arguments.length, obj=arguments[0]; i<l; obj=arguments[++i]){
        //and only process arguments that are truthy.. no empty strings, empty arrays, nulls, undefineds, etc.
        obj && (ar = ar.concat(_.isString(obj) ? obj.split('') : _slice.call(obj, 0)));
      }
      return ar;
    } :
    //the slower fallback makeRealArray function which is assigned if the browser doesn't support the "Array.slice" approach
    function toArray(obj1, obj2, obj3){
      var ar = [], jl;
      for(var i=0, il=arguments.length, obj=arguments[i]; i<il; obj=arguments[++i]){
        //if it's a string
        if(_.isString(obj)){
          //use the native split method (faster)
          ar = ar.concat(obj.split(''));
        }
        else if(obj){
          jl = obj.length;
          //edge case - the nodelist contains an element with id "length"
          if(typeof jl == 'object' && jl.nodeType){
            var j=0;
            //iterate through the indexes of the object
            while(obj[j++]){
              //and push each one onto the array
              ar.push(obj[j]);
            }
          }
          //iterate through the indexes of the object
          for(var j=0; j<jl; j++){
            //and push each one onto the array
            ar.push(obj[j]);
          }
        }
      }
      //return the array of accumulated indexes
        return ar;
      }
    ,
   
 
    
    
    /***************************************************************/
  //unique
  //Removes duplicate values from an array.
  //
  //When optional argument "copy" is truthy, a copy of the
  //original array is returned.
  //
  //The splice and indexOf methods are refereced straight from
  //the Array prototype, so technically you could pass an object with
  //a length property instead of an array.
  unique: function unique(ar, copy, start){
    var newAr, tmp, i = ar.length;
    start = start || 0;
    //if the copy flag is truthy,
    if(copy){
      //create a new array so we don't affect the original
      newAr = [];
      //iterate through the original array backwards
      while(i > start){
        //if the value from the original array is not in the new array
        if(_indexOf.call(newAr, tmp = ar[i], start) == -1){
          //tack it to the beginning of the array
          _splice.call(newAr, 0, 0, tmp);
        }
      }
      return newAr;
    }
    //change the original array
    while(i > start){
      //if occurs at another index in the array (searched from front)
      if(_indexOf.call(ar, ar[i], start) !== i){
        //remove the element at this index (at the back of the array)
        _splice.call(ar, i, 1);
      }
    }
    return ar;
  },
  
  
  requires: function requires(moduleNamespace, modulePath, fn){
    //TODO: add functionality to check passed namespaces
    //need to have events system in place first.
    if(1==1){
      fn();
      return true;
    }
    return false;
  },
  
  /***************************************************************/
  //getData
  //
  getData: function getData(obj, key){
    //get a ref to the object where the data is stored
    //(for non-elements it's just on the object itself, otherwise it in out element data cache)
    var cache  = obj.__cruxData__ || (obj.__cruxGUID__ && _cache.elementData[obj.__cruxGUID__]);
    //return the data by it's key or the whoel object if the key was undefined
    return (!key && cache) || ((cache && _hasOwnProperty.call(cache, key)) ? cache[key] : undefined);
  },
  
  
  /***************************************************************/
  //setData
  //
  setData: function setData(obj, key, data, merge){
    var cache, uid, container, propname, hasOtherKey;
    if(key == '__owner__'){ throw 'Invalid key name: ' + key; }
    
    //when the data will be set to undefined
    if(data === undefined){
      //record the current value
      container = obj.__cruxData__ ? obj : _cache.elementData;
      propname  = obj.__cruxData__ ? '__cruxData__' : obj.__cruxGUID__;
      if(propname && (cache = container[propname])){
        data = key ? cache[key] : cache;
        for(var k in cache){
          if(_hasOwnProperty.call(cache, k) && k !== '__owner__' && k !== key){
            hasOtherKey = 1;
            break;
          }
        }
        if(!key || !hasOtherKey){
          container[propname] = undefined;
          delete container[propname];
        }
        else if(key && _hasOwnProperty(cache, key)){
          //for implementations that won't actually delete the property
          cache[key] = undefined;
          delete cache[key];
        }
      }
      //return the value of key
      return data;
    }
    //
    if(obj.__cruxGUID__ || _.isElement(obj)){
      uid = obj.__cruxGUID__ || (obj.__cruxGUID__ = _.guid());
      cache = _cache.elementData[uid] || (_cache.elementData[uid] = {"__owner__": obj});
    }
    else{
      cache = obj.__cruxData__ || (obj.__cruxData__ = {});
    }
    if(merge && !key){
      return _.extend(cache, data);
    }
    return cache[key] = ((merge && _.isObject(data) && _hasOwnProperty.call(cache, key)) ? _.extend(cache[key], data) : data);
  },
  
  //"removeData": function removeData(el, key){ return _.setData(el, key, undefined); },
  
  keys: function keys(obj, inherited){
    var ar = [];
    for(var key in obj){
      if(inherited || _hasOwnProperty.call(obj, key)){
        ar.push(key);
      }
    }
    return ar;
  },
  
 
  //browser
  //adapted from http://quirksmode.org/js/support.html
  //ONLY TO BE USED FOR ISSUES THAT CANNOT BE DELT WITH THROUGH OBJECT DETECTION
  //accessable properties are:
  //.name    = 'Explorer', 'Firefox', 'Chrome', etc.
  //.version = 1, 2, 3, 4, etc.
  //.OS      = 'Windows', 'Linux', 'Mac', 'iPhone', etc.
  browser: (function parseUserAgent(){
    var n = window.navigator,
        versionSearchString;
    var dataBrowser = [
      { str: n.userAgent, sub: "Chrome",     ident: "Chrome" },
      { str: n.userAgent, sub: "OmniWeb",    ident: "OmniWeb", versionSearch: "OmniWeb/" },
      { str: n.vendor,    sub: "Apple",      ident: "Safari", versionSearch: "Version"},
      { prop: window.opera, ident: "Opera" },
      { str: n.vendor,    sub: "iCab",       ident: "iCab" },
      { str: n.vendor,    sub: "KDE",        ident: "Konqueror" },
      { str: n.userAgent, sub: "Firefox",    ident: "Firefox" },
      { str: n.vendor,    sub: "Camino",     ident: "Camino" },
      { str: n.userAgent, sub: "Netscape",   ident: "Netscape" }, // for newer Netscapes (6+)
      { str: n.userAgent, sub: "MSIE",       ident: "Explorer", versionSearch: "MSIE" },
      { str: n.userAgent, sub: "Gecko",      ident: "Mozilla", versionSearch: "rv" },
      { str: n.userAgent, sub: "BlackBerry", ident: "BlackBerry" },
      { str: n.userAgent, sub: "Mozilla",    ident: "Netscape", versionSearch: "Mozilla" } // for older Netscapes (4-)
    ];
    
    var dataOS = [
      { str: n.platform,  sub: "Win", ident: "Windows" },
      { str: n.platform,  sub: "Mac", ident: "Mac" },
      { str: n.userAgent, sub: "iPhone", ident: "iPhone/iPod" },
      { str: n.userAgent, sub: "BlackBerry", ident: "BlackBerry" },
      { str: n.platform,  sub: "Linux", ident: "Linux" }
    ];
    
    function searchString(data){
      for(var str, i=0, l=data.length;i<l;i++){
        versionSearchString = data[i].versionSearch || data[i].ident;
        //supposed to be a single equals sign. assigns the value then checks truthyness
        if(str = data[i].str){
          if(str.indexOf(data[i].sub) != -1){ return data[i].ident; }
        }
        else if(data[i].prop){ return data[i].ident; }
      }
    }
    
    function searchVersion(str){
      var index = str.indexOf(versionSearchString);
      if(index == -1){ return; }
      return parseFloat(str.substring(index+versionSearchString.length+1));
    }
    
    return {
      name    : searchString(dataBrowser) || "Unknown",
      version : document.documentMode || searchVersion(n.userAgent) || searchVersion(n.appVersion) || 0,
      OS      : searchString(dataOS) || "Unknown"
    };
  })(),
  
  
  
  
  
  
  /***************************************************************/
  //addEvent
  listen: function listen(target, type, handler){
    var arResults,
        i, l,
        savedSelector,
        listeners,
        listenerContainer,
        eventNamespace = '';
    
    if(_.isString(type)){
      type = _.str.trim(type);
      //TODO: replace multiple spaces with one space
      //if type is a space delimited string of multiple event types,
      //remove any leading or trailing whitespace and convert it to an array
      if(type.indexOf(' ') > -1){
        type = type.split(' ');
      }
    }
    
    //resolve a selector string into element references
    if(_.isString(target)){
      savedSelector = target;
      //return an array of matched elements
      target = _.dom.selectorEngine(target);
      //if it's 1, then get the first element in the array, if 0 then it's undefined
      if(target.length < 2){
        target = target[0];
      }
    }
    
    //an array of event targets can be passed and each target element will have the event type handler added to it
    if(_.isArray(target)){
      arResults = [];
      for(i=0, l=type.length; i<l; i++){
        arResults.push(listen(target[i],  type, handler));
      }
      return arResults;
    }
    //an array of event types can be passed and each event type on the target element will have the handler added to it
    if(_.isArray(type)){
      arResults = [];
      for(i=0, l=type.length; i<l; i++){
        arResults.push(listen(target, type[i], handler));
      }
      return arResults;
    }
    
    //separate the namespace from the event type, if both were included
    if(type.indexOf('.') > -1){
      var tmpParts = type.split('.');
      type = tmpParts.pop();
      eventNamespace = tmpParts.join('.');
    }
    
    //if we don't have all the arguments we need..
    if(!target || !handler || !type){
      //compose an error description string
      var strErrDesc =  'Error: DDP -> F -> addEvent: Event target or listener or type missing. ' +
                        '\nTarget: ' + (target ? (target.id || target.className || savedSelector || 'none') : savedSelector || 'none') +
                        '\nType: "' + (eventNamespace ? eventNamespace + '.' + type : type) + '"' +
                        '\nListener: "' + (handler ? handler.toString().substr(0, 100).replace('\n', '') : 'none') + '"';
                        //arguments.callee.caller.arguments.callee.caller.toString()
      //if we haven't explicitly said we want to suppress these types of errors, throw an exception
      //(this way, we can do it on a per page/site basis)
      /*
      if(!lastProperty("ddp.c.suppressEventErrors")){
        throw strErrDesc;
      }
      */
      //try to log the error to the console
      try{ console.log(strErrDesc); }catch(e){}
      //return null to indicate that there was a problem adding the listener
      return null;
    }
  
  
    //emulate events that are in "ddpEmulatedEvents" if the browser doesn't support them
    if(ddpEmulatedEvents[type] && !target['ddpEmulated_' + type] && !isEventSupported(type, target)){
      //mark the element as having the emulation set up (so we don't try to do it again)
      target['ddpEmulated_' + type] = true;
      //add any prerequisite emulated events (ie. mouseenter emulation depends on the mouseleave event and vise-versa)
      if(ddpEmulatedEvents[type].prerequisiteEvents){
        ddpEmulatedEvents[type].prerequisiteEvents.split(' ').forEach(function(emuEventType){
          listen(target, ddpEmulatedEvents[emuEventType].attachToEvent, ddpEmulatedEvents[emuEventType].fn);
        });
      }
      //if it's a one-time event
      if(ddpEmulatedEvents[type].isOneTime){
        //set it as such
        setOneTimeEvent(target, type);
      }
      //add the handler that performs the emulation to the event that can be used to trigger the emulation
      listen(ddpEmulatedEvents[type].attachToElement || target, ddpEmulatedEvents[type].attachToEvent, function(objEvent){ return ddpEmulatedEvents[type].fn && ddpEmulatedEvents[type].fn.call(target, objEvent); });
    }
    
    //if this is a one-time event (such as window 'load'), and it has already been fired,  
    //if(getData(target, 'ddpOneTimeEvent_' + type) && getData(target, 'ddpOneTimeEvent_' + type + '_fired') && !forceAddOTE){
    if(_.getData(target, 'cruxOTE_' + type) && _.getData(target, 'cruxOTE_' + type + '_fired')){
      //then execute the event listener right away (using the event target as "this" and passing a new event object to it).
      //var obj = _createPlainEventObject(type);
      var obj = _.getData(target, 'cruxOTE_' + type + '_eventObject');
      //obj.target = target;
      //obj.currentTarget = target;
      handler.call(target, obj);
      return 4; //indicate a one time event re-fire
    }
    
    //create a function to repair the scope and redirect the proper event object. 
    var fn = function(ev){
      var rv,
          objEvent = ev || window.event; //use the event object passed as an argument, or try to use the global event object available in IE <10
      //if there is no event namespace or the event namespace matches the handler namespace
      if(!objEvent.eventNamespace || objEvent.eventNamespace == fn.namespace){
        //white a property on the event object with the current handler namespace 
        objEvent.listenerNamespace = fn.namespace;
        //call the handler using the current target as it's "this" (scope of the target object) 
        rv = fn.innerFn.call(objEvent.currentTarget || target, objEvent);
        if(rv === false || (objEvent.type === 'beforeunload' && isString(rv))){
          objEvent.returnValue = rv;
        }
        else{
          rv = objEvent.returnValue;
        }
      }
      //if it's a 'beforeunload' event and the return value from the handler was a string, use the handler return value.
      //otherwise, use the event objest returnValue property
      return rv;
    };
    //record the inner function (actual event listener) on the fn function (so we can remove it, tell is it's already attached)
    fn.innerFn = handler;
    fn.namespace = eventNamespace;
    
    
    //get the current listener container or create a new one
    listenerContainer = _.getData(target, 'ddp_listeners') || _.setData(target, 'ddp_listeners', {});
    
    //get the listeners array if it exists and check if it's an array, if it's not then
    if(!_.isArray(listeners = listenerContainer[type])){
      //create a new array and assign it to both the listener container and our local variable "listeners"
      listeners = listenerContainer[type] = [fn];
    }
    //if there are no listeners in the array or the new listener isn't present in the array
    else if(listeners.length == 0 || !listeners.some(function(fn){ return fn.innerFn == handler; })){
      //just push the listener onto the end of the array
      listeners.push(fn);
    }
    //the handler has already been added
    else{
      //return zero
      return 0;
    }
    
    //w3c standard browsers
    //add the event listener. specify false for the last argument to use the bubbling phase (to mirror IE's limitation to only bubble)
    //(if the addEventListener method returns false, move to the next event model)
    if(target.addEventListener && (listeners.ddpEventModel === 1 || !listeners.ddpEventModel) && target.addEventListener(type, fn, false) !== false){
      //return the event model used to add the event handler
      listeners.ddpEventModel = 1;
    }
    //Internet Explorer
    //typeof target['on' + type] != 'undefined' &&
    else if(target.attachEvent && (listeners.ddpEventModel === 2 || !listeners.ddpEventModel) && _.isEventSupported(type, target)){
      //attach the event using the IE event model (bubble only)
      target.attachEvent('on' + type, fn);
      //if it's the first time a handler has been added
      if(!listeners.ddpEventModel){
        //add a handler to the window onunload event so that we can detach this event when the window unloads
        //(try to relase event handler memory on old IEs)
        window.attachEvent('onunload', function(){
          //remove the listner container object and get a reference to it
          var ar, listenerContainer = _.setData(target, 'ddp_listeners', undefined);
          //if there is an array for this event type
          if(listenerContainer && _.isArray(ar = listenerContainer[type])){
            //go through each handler and remove it
            for(var i=0, l=ar.length; i<l; i++){ target.detachEvent('on' + type, ar[i]); }
            //clear the array
            ar.length = 0;
          }
        });
        //return the event model used to add the event handler
        listeners.ddpEventModel = 2;
      }
    }
    //if nothing has worked yet... fallback to the AERM method
    else{
      //if this is a DOMElement or the window object and if the
      //object doesn't have our "on" + type function assigned to "fireAERMListeners"
      //(which means this is the first time an aerm handler has been added for this type)
      if((isElement(target) || target == window) && target['on' + type] != fireAERMListeners){
        //record the old value (in case someone manually assigned a handler already, or it was in the HTML)
        var fnOldStyleFunction = target['on' + type];
        //assign our handler
        target['on' + type] = fireAERMListeners;
        //and if the 
        if(typeof fnOldStyleFunction == 'function'){
          //add the old manual style event handler (global namespace)
          addEvent(target, type, fnOldStyleFunction);
        }
      }
      //record the event model used to attach the listener
      listeners.ddpEventModel = 3;
    }
    
    //return the event model that was used to attach the handler
    return listeners.ddpEventModel;
  },
  
  
  //*****************************************************************************************************
  // String manupulation module
  //*****************************************************************************************************
  str:{
    isUpper: function isUpper(str){ return (str = str + '') == str.toUpperCase(); },
    isLower: function isLower(str){ return (str = str + '') == str.toLowerCase(); },
    right  : function right(str, length){ return (str + '').substr(str.length - Math.min(length, str.length)); },
    left   : function left(str, length){ return (str + '').substr(0, length); },
    escapeHTML: function escapeHTML(str){return (str +'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); },
    unescapeHTML: function unescapeHTML(str){ return (str+'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); },
    repeat : function repeat(str, times){
      var s = '';
      times = Math.max(times || 0, 0);
      while(times){
        //http://stackoverflow.com/questions/202605/repeat-string-javascript
        //http://stackoverflow.com/users/345520/artistoex
        //bitwise AND operator
        if(times & 1){ s += str; }
        times >>= 1; //bitwise shift and assignment operator equivalent to: times = times >> 1;
        str += str;
      }
      return s;
    },
    
    pad    : function pad(str, length, padWith, onRight){
      padWith = padWith || '0';
      if((length = Math.max(length, 0)) == 0){ return ''; }
      if(str.length >= length){ return onRight ? _.str.right(str, length) : _.str.left(str, length); }
      //generate the repeated string to pad the passed one with
      //(may be larger than the length required if "padWith" contains multiple characters)
      var s = _.str.repeat(padWith, Math.max(Math.ceil(length/padWith.length) - str.length, 0));
      return onRight ? str + _.str.right(s, length-str.length) : _.str.left(s, length-str.length) + str;
    },
    
    trim: _trim ? function(str){ return _trim.call(str); } : function(str){
      str += ''; //convert to string
      //http://blog.stevenlevithan.com/archives/faster-trim-javascript, trim12
      str = str.replace(/^\s\s*/, '');
      var ws = /\s/, i = str.length;
      while(ws.test(str.charAt(--i))){} //there is nothing within the braces. this is not a typo
      return str.slice(0, i + 1);
    },
    
    /***************************************************************/
    //isValidString
    //returns true if the supplied string matches the corresponding regular expression for the supplied format type
    valid: function valid(str, formatType){
      var reOrFn = _.str.formats[formatType];
      if(reOrFn instanceof RegExp){ return reOrFn.test(str); }
      if(_.isFunction(reOrFn))    { return reOrFn(str);      }
      throw 'Invalid format type provided: "' + formatType + '". Inspect crux.str.formats for valid format types.';
    },
    
    formats: {
      email         : /^[A-Za-z0-9_\-\.]+@(([A-Za-z0-9\-])+\.)+([A-Za-z\-])+$/,
      //TODO: Add partial string validation regexs for all formats
      //      (stop user from entering invalid chars for the validation type)
      email_partial : /^[A-Za-z0-9_\-\.@]+$/,
      phone         : /^(\(?[0-9]{3}\)?)? ?\-?[0-9]{3}\-?[0-9]{4}$/,
      number_dec    : /^-?\d+(\.\d+)?$/,
      number_int    : /^-?\d+$/,
      postalcode_ca : /^[abceghjklmnprstvxy][0-9][abceghjklmnprstvwxyz]\s?[0-9][abceghjklmnprstvwxyz][0-9]$/i,
      postalcode_us : /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/,
      postalcode_uk : /^([a-zA-Z]){1}([0-9][0-9]|[0-9]|[a-zA-Z][0-9][a-zA-Z]|[a-zA-Z][0-9][0-9]|[a-zA-Z][0-9]){1}([ ])([0-9][a-zA-z][a-zA-z]){1}$/,
      filename      : /[^0-9a-zA-Z\._\(\)\+\-\!@#\$%\^&,`~\[\]{} ']/
    },
    
    toCamel: function toCamel(str, changeFloat){
      return (changeFloat && str == 'float')
               ? _detected.floatProperty
               : str.replace(toCamel.re || (toCamel.re = /\W+(.)/g), function(_, l){ return l.toUpperCase(); });
               //: str.toLowerCase().replace(/-([a-z])/g, function (_, l) { return l.toUpperCase(); });
    },
    
    toDashed: function toDashed(str, changeFloat){
      return (changeFloat && str == 'styleFloat' || str == 'cssFloat')
               ? 'float'
               : str.replace(toDashed.re1 || (toDashed.re1 = /\W+/g), '-')
                 .replace(toDashed.re2 || (toDashed.re2 = /([a-z\d])([A-Z])/g), '$1-$2')
                 .toLowerCase();
    },

    parseUri: (function(){
      // parseUri 1.2.2
      // (c) Steven Levithan <stevenlevithan.com>
      // MIT License
      function parseUri(str, doc){
       var relativeTo = (doc && doc.location) ? parseUri(doc.location.href) : (_.isString(doc) ? parseUri(doc) : null);
           o   = parseUri.options,
           m   = o.parser[(relativeTo || o.strictMode) ? "strict" : "loose"].exec(str),
           uri = {},
           i   = 14;
      
        while(i--){ uri[o.key[i]] = m[i] || ""; }
      
        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
          if($1) uri[o.q.name][$1] = $2;
        });
        
        if(relativeTo){
          ["protocol","authority","userInfo","user","password","host","port"].forEach(function(s){ uri[s] = uri[s] || relativeTo[s]; });
          ["relative","path","directory"].forEach(function(s){ uri[s] = (uri[s].charAt(0) == '/') ? uri[s] : relativeTo["directory"] + uri[s]; });
        }
        return uri;
      }
      parseUri.options = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
          name:   "queryKey",
          parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
          strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
          loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
      };
      
      return parseUri;
    })(),
    
    cleanWordMarkup: function cleanWordMarkup(str){
      // Remove unnecessary tag spans (comments and title)
      str = str.replace(/\<\!--(\w|\W)+?--\>/gim, '');
      str = str.replace(/\<title\>(\w|\W)+?\<\/title\>/gim, '');
      // Remove all classes and styles
      str = str.replace(/\s?class=\w+/gim, '');
      str = str.replace(/\s+style=\'[^\']+\'/gim, '');
      str = str.replace( /<(\w[^>]*) style="([^\"]*)"([^>]*)/gi, "<$1$3" ) ;
      // Remove unnecessary tags
      str = str.replace(/<(meta|link|\/?o:|\/?style|\/?font|\/?img|\/?h|\/?a|\/?script|\/?div|\/?st\d|\/?head|\/?html|body|\/?body|\/?span|!\[)[^>]*?>/gim, '');
      // Remove underline tags
      str = str.replace(/<\/?u>/gim,'');    
      // Get rid of empty paragraph tags
      str = str.replace(/(<[^>]+>)+&nbsp;(<\/\w+>)/gim, '');
      // Remove bizarre v: element attached to <img> tag
      str = str.replace(/\s+v:\w+=""[^""]+""/gim, '');
      // Remove extra lines
      str = str.replace(/"(\n\r){2,}/gim, '');
      // Fix entites
      str = str.replace("&ldquo;", "\"");
      str = str.replace("&rdquo;", "\"");
      str = str.replace("&mdash;", "â€“");
      return str;
    }
    
  }
};


//the function that will be called when the actual event is fired.
function fireAERMListeners(evt){
  var objEvent = evt || window.event,
      elDocEl = document.documentElement,
      elTarget = (objEvent && objEvent.currentTarget) || this,
      listenerContainer = getData(elTarget, 'ddp_listeners'),
      fnTmp;

  //if the element has listeners
  if(listenerContainer){
    //take a copy of the handlers that were effective at the time the event was fired
    var listeners = makeRealArray(listenerContainer[objEvent.type]);
    
    //execute the listeners in the order they were added
    for(var i=0, l=listeners.length; i<l; i++){
      //set the currentHandler to execute the listener
      currentHandler = function(){ listeners[i](objEvent); };
      //manualEventFireMethod (below) is a variable within only this module's scope that indicates which
      //method can be used for firing manual events within a browser event (it was set up on instanciation)
      //w3c
      if(manualEventFireMethod == 1){
        //firing the DDPAERMEvent on the document element (usually <HTML>), executes "currentHandler" within a browser event
        //which provides the ability to show errors but keep them from breaking the rest of the framework
        elDocEl.dispatchEvent(_createBrowserEventObject('DDPAERMEvent', {"cancelable": false, "bubbles": false}));
      }
      //ie<9
      else if(manualEventFireMethod == 2){
        //this fires the IE "onpropertychange" event on the documentElement (flips the value between 1 and -1)
        //which executes the currentHandler from within an actual browser event
        elDocEl.fireDDPAERMEvent *= -1;
      }
      //no support for encapsulating manual events within a browser event
      else{
        //just flat out execute it
        currentHandler();
      }
      //clear the function from the "currentHandler"
      currentHandler = null;
    }
  }
  
  //return the event return value
  return objEvent.returnValue;
}






_.extend(_.dom, {
  //we can't assign this until Sizzle is instanciated at the end of this file 
  selectorEngine: null, //by default will be Sizzle()
  selectorEngine_matches: null, //by default will be Sizzle.matches()
  //***************************************************************
  //childOf 
  //returns true if all elements in the collection are DOM descendents of the supplied dom element, otherwise returns false.
  childOf: function childOf(elChild, elParent, blnBridgeIframes){
    //var elChild = this.index(0);
    
    if(!_.isElement(elChild) || !_.isElement(elParent, true)){
      return null;
    }
    //if the browser supports the "contains" method (basically everyone but Firefox)
    if(elParent.contains){
      return elParent.contains(elChild);
    }
    //Firefox
    if(elChild.compareDocumentPosition){
      return Boolean(elParent.compareDocumentPosition(elChild) & 16); //single & is the bitwise AND operator, not a typo (compareDocumentPosition returns a bitmask).
    }
    //fallback to calculating it ourselves
    return (_.dom.climb(elChild, function(nodes, elParent){ if(this==elParent) return true; }, [elParent], blnBridgeIframes) === true);
  },
  
  //***************************************************************
  //climbDOMTree
  //climbs up the DOM tree one node at a time, starting from the supplied element "elStart"
  //with each level, fnEvaluate is executed (with it's "this" value being the currently evaluated node)
  //the first argument passed to fnEvaluate will be an array of the previously evaluated nodes, followed by 
  //any arguments passed in the arArguments array 
  climb: function climb(el, fn, jumpIframes){
    var current = el,
        parent,
        parentWindow,
        returnVal;
        
    while(current){
      //if we are allowing this climb to escape from the containing iframe (if there is one)
      //check if the node is a DOCUMENT_NODE
      if(jumpIframes && current.nodeType == nodeTypes.DOCUMENT_NODE){
        //find the element's window's parent window 
        parentWindow = (current.defaultView && current.defaultView.parent) || (current.parentWindow && current.parentWindow.parent);
        if(!parentWindow){
          return; //there is no parent window, so we're done
        }
        //search through the parent's Iframes to find this element's document
        var iframes = parentWindow.document.getElementsByTagName('IFRAME');
        i = iframes.length;
        while(i--){
          //supress the error if we try to access the document object from another domain 
          try{
            //if the iframe's document accessed from the parent window is our document 
            if(iframes[i].contentWindow.document == current){
              current = iframes[i]; //then start climbing again at the iframe element of the parent window
            }
          }
          //don't need to do anything 'cause if it's not in the same domain, it's not this document anyway
          catch(e){}
        }
      }
      
      if(returnVal = fn.call(this, current) !== undefined){
        return returnVal;
      }
      //move to the next node up
      current = current.parentNode
    }
  },
  
  /***************************************************************/
  //getStyle
  //returns the effective CSS style on an element
  getStyle: function getStyle(el, str){
    if(str=='opacity'){ return _.dom.getOpacity(el); }
    return (window.getComputedStyle && window.getComputedStyle(el, '').getPropertyValue(str))
            || (el.currentStyle && el.currentStyle[_.str.toCamel(str, true)])
            || '';
  },
  
  getOpacity: function getOpacity(el){
    //TODO: import code from ddp
    return 0;
  },
  
  setOpacity: function setOpacity(el, val){
    //TODO: import code from ddp (use 0 to 1 range instead of 0 to 100)
  },
  
  //***************************************************************
  getClass: function getClass(el){ return (el && el.getAttribute && el.getAttribute(_detected.CSSClassAttribute)) || ''; },
  
  setClass: function setClass(el, str){
    if(!el || !el.setAttribute){
      return false;
    }
    if(_.dom.getClass(el) !== str){
      el.setAttribute(_detected.CSSClassAttribute, str);
    }
    return str;
  },
  
  /***************************************************************/
  //addClass
  //adds a CSS class to the element's className attribute (if it's not already there)
  //accepts a reference to an element and a string containing the class name
  addClass: function addClass(elementOrArray, strClassToAdd){
    //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
    var ar = _.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
        c = _config.classRECaching ? arguments.callee.cache || (arguments.callee.cache = {}) : {},
        l = ar.length,
        i, el, strClassName, re;
        
    _.str.trim(strClassToAdd).split(' ').forEach(function(str){
      if(!str){ return; }
      re = null;
      i = l;
      while(i--){
        el = ar[i];
        if(!_.isElement(el)){
          continue;
        }
        //see if the element implements the html5 classList interface
        if('classList' in el && el.classList.add){
          //browser implementation takes care of not adding duplicates
          el.classList.add(str);
        }
        //if the element passed is valid and the class isn't already there
        else if(el){
          re = re || c[str] || (c[str] = new RegExp('\\b' + str + '\\b', 'g'));
          //get the current class string and test it with the regular expression
          if(!re.test(strClassName = _.str.trim(_.dom.getClass(el)) || '')){
            strClassName += (strClassName ? ' ' : '') + str;
          }
          //put the modified/filtered class string back in the element 
          _.dom.setClass(el, strClassName);
        }
      }
    });
    return elementOrArray;
  },
  
  
  /***************************************************************/
  //removeClass
  //removes a CSS class from the element's class attribute
  //accepts a reference to an element and a string containing the class name
  removeClass: function removeClass(elementOrArray, classToRemove){
    //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
    var ar = _.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
        cache = _config.classRECaching ? arguments.callee.cache || (arguments.callee.cache = {}) : {},
        l = ar.length,
        i, el, strClass, re;
    //be sure that the original string doesn't have any leading or trailing whitespace
    _.str.trim(classToRemove).split(' ').forEach(function(str){
      //don't process blanks
      if(!str){ return; }
      re = null; //clear the regular expression for the last string
      i = l; //reset the counter
      while(i--){
        el = ar[i];
        if(!_.isElement(el)){
          continue;
        }
        //if the element implements the html5 classList interface
        else if('classList' in el && el.classList.remove){
          el.classList.remove(str);
        }
        //if the class isn't already empty
        else if(strClass = _.dom.getClass(el)){
          re = re || cache[str] || (cache[str] = new RegExp('\\b' + str + '\\b', 'g'));
          //if the modified string is different than the original
          if(strClass != (strClass = _.str.trim(strClass.replace(re, '')))){
            //update the element with the new class name string
            _.dom.setClass(el, strClass);
          }
        }
      }
    });
    
    return elementOrArray;
  },
  
  
  /***************************************************************/
  //hasClass
  //accepts a reference to an element and string containing the class name to search for.
  //returns true if the element has the specified class name, otherwise returns false.
  hasClass: function hasClass(elementOrArray, strClassToCheckFor){
    //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
    var ar = _.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
        cache = _config.classRECaching ? arguments.callee.cache || (arguments.callee.cache = {}) : {},
        l = ar.length,
        arReturn = [],
        i, el, strClass, re;
        
    strClassToCheckFor = _.str.trim(strClassToCheckFor);
    
    for(i=0; i<l; i++){
      el = ar[i];
      if(!_.isElement(el)){
        arReturn.push(false);
        continue;
      }
      //see if the element implements the html5 classList interface
      if('classList' in el && el.classList.contains){
        arReturn.push(strClassToCheckFor.split(' ').every(function(str){ return (!str ? true : el.classList.contains(str)); }));
      }
      else if(strClass = _.dom.getClass(el)){
        //
        arReturn.push(strClassToCheckFor.split(' ').every(function(str){
          //return (!str ? true : (getRegExp('hasClass_re1_' + str) || addRegExp('hasClass_re1' + str, new RegExp('\\b' + str + '\\b', 'g'))).test(strClass));
          return (!str ? true : (cache[str] || (cache[str] = new RegExp('\\b' + str + '\\b', 'g'))).test(strClass));
        }));
      }
      else{
        arReturn.push(false);
      }
    }
  
    return (arReturn.length==1) ? arReturn[0] : arReturn;
  },
  
  /***************************************************************/
  //make
  //Creates an element and assigns attributes css classes and 
  make: function make(tagName, objAttributes, objEvents, elAppendTo){
    var el = _.isElement(tagName) ? tagName : _ce(tagName);
    /*
    if(!elAppendTo){
      setData(el, '_ddpDetached', true); //serious thought should be put into whether this line should be left in...
    }
    */
    if(objAttributes){
      _.forOwnIn(objAttributes, function(k, v){
        var lowerK = k.toLowerCase();
        if(lowerK == 'classname' || lowerK == 'class'){
          _.dom.addClass(el, v);
        }
        else{
          el.setAttribute(k, v);
        }
      });
    }
    if(objEvents){
      _.forOwnIn(objEvents, function(k, v){ ddp.f.addEvent(el, k, v); });
    }
    if(elAppendTo){
      appendElement(el, elAppendTo);
    }
    return el;
  }
});


//-----------------------------------------------
//-----------------CRUX OBJECT-------------------
//-----------------------------------------------
var CruxObject = function CruxObject(){};
//CruxObject.subclass = function(obj, name){ return (new CruxObject).subclass.apply(this, arguments); };
CruxObject.prototype = {
  constructor : CruxObject,
  _super      : Object,
  toString    : function toString(){     return '[object '+(this.className || 'Object')+']';              },
  augment     : function augment(obj){   _.extend(this.constructor.prototype, obj); return this;          },
  mergeIndexes: function mergeIndexes(){ return _.mergeIndexes.apply(this, _.toArray([this], arguments)); },
  subclass    : function subclass(obj, name){
    name = name || (obj ? obj.className : null) || this.className || '';
    //Create a function using the Function constructor so we can name the inner returned function with the className
    //Within the returned function, execute the default constructor in the context of the new object.
    //If the subclass has or inherited an init method, execute it with any arguments passed to this consructor
    var sub = Function('return function ' + name + '(){ arguments.callee.__parentContructor__.call(this); this.init && this.init.apply(this, arguments);}')();
    sub.prototype = _.extend(this, obj);
    this.className = name;
    this._super = sub.__parentContructor__ = this.constructor;
    this._super.subclasses = (this._super.subclasses ? this._super.subclasses.push(sub): [sub]) 
    return this.constructor = sub;
  }
};

//-----------------------------------------------
//-----------------COLLECTION--------------------
//-----------------------------------------------
var Collection = (new CruxObject).subclass({
  className  : 'Collection',
  init: function(){
    this.length = 0;
    arguments && _push.apply(this, arguments);
  },
  push       : _push,
  splice     : _splice,
  every      : _every,
  indexOf    : _indexOf,
  toArray    : function toArray(){     return _.toArray(this);                              },
  first      : function first(){       return this.index(0);                                },
  last       : function last(){        return this.index(this.length-1);                    },
  contains   : function contains(){    return !!(_indexOf.call(ar, val) + 1);               },
  empty      : function empty(){       return this.setLength(0);                            },
  unique     : function unique(copy){  return _.unique(this, copy);                         },
  forEach    : function forEach(){     _forEach.apply(this, arguments);  return this;       },
  add        : function add(){         _push.apply(this, arguments);     return this;       },
  filter     : function filter(fn){    return new this.constructor(_filter.call(this, fn)); },
  DOMElements: function DOMElements(allowDocument){ return this.filter(function(v){ return _.isElement(v, allowDocument); }); },
  index: function index(ind){ return new this.constructor((ind < this.length ? this[ind] : null), this.selectionContext); },
  setLength: function setLength(newLength){
    var i = this.length;
    newLength -= 1;
    while(i > newLength){
      this[i] = undefined;
      delete this[i--];
    }
    this.length = newLength + 1;
    return this;
  }
});


//-----------------------------------------------
//----------------DOM SELECTION------------------
//-----------------------------------------------

var DOMSelection = _.DOMSelection = (new Collection).subclass({
  className : 'DOMSelection',
  
  init: function(selector, context){
    this.length = 0;
    this.selectionContext = (context && this.resolve(context, document)[0]) || document;
    arguments.length && this.add.apply(this, arguments);
  },
  
  add: function(selector, context){
    var arg, sc = context && this.resolve(context, document)[0] || this.selectionContext;
    //if there was no valid selector supplied, don't resolve it or call unique()
    if(!selector){ return this; }
    
    selector = _.isArray(selector) || selector instanceof DOMSelection ? selector : [selector];
    for(var i=0, l=selector.length; i<l; i++){
      arg = selector[i];
      if(_.isString(arg)){
        //true indicates that the mergeing process should not introduce any duplicates.
        this.mergeIndexes(this.resolve(arg, sc), true);
      }
      else if(_.isElement(arg)){
        this.push(arg);
      }
    }
    //remove duplicates
    return this.unique();
  },

  drop: function drop(selector){
    var ar = _.dom.selectorEngine_matches(selector, this), i = ar.length;
    while(i--){ this.splice(this.indexOf(ar[i]), 1); }
    return this;
  },
  
  wait: function wait(msec, fn, data){
    var ts = this;
    window.setTimeout(function(){ fn.call(ts, data); ts = null; }, msec);
    return this;
  },
  
  append: function append(parent){
  	var df;
  	if(this.length){
      parent = _.isString(parent) ? this.resolve(parent, document)[0] : parent;
      df = document.createDocumentFragment();
      this.DOMElements().forEach(function(el){ df.appendChild(el); });
      parent.appendChild(df);
    }
    return this;
  },
  
  resolve: function resolve(selector, context, ar){
    //optimise for the case when we're just passing a single element
    if(_.isElement(selector) && !ar && !context){ return [selector]; }
    //run the selector through Sizzle or other dom selector library
    return _.dom.selectorEngine(selector, context, ar);
  },
  
  find          : function find(selector){ return new this.constructor(_.dom.selectorEngine_matches(this, selector), this.selectionContext); },
  remove        : function remove(){ this.DOMElements().forEach(function(el){ el && el.parentNode && el.parentNode.removeChild(el); }); return this; },
  addClass      : function addClass(str){    return _.dom.addClass(this, str);    },
  removeClass   : function removeClass(str){ return _.dom.removeClass(this, str); },
  show          : function show(){ this.DOMElements().forEach(function(el){ el.style.display = ''; return this;});     },
  hide          : function hide(){ this.DOMElements().forEach(function(el){ el.style.display = 'none'; return this;}); },
  climb         : function climb(fn){ return this.DOMElements().every(function(el){ return _.dom.climb(el, fn); }); },      
  //***************************************************************
  //childrenOf 
  //returns a new DOMCollection of elements that are DOM descendents of the supplied parent element
  childrenOf: function childrenOf(parent, jumpIframes){
  	return this.DOMElements().filter(function(el){ return _.dom.childOf(el, parent, jumpIframes); });
    //return elements.length ? elements.every(function(el){ return _.dom.childOf(el, parent, jumpIframes); }) : false;
  },
  
  debug: function(str){
    try{
      console.log((new Date).getTime() + ': ' + (str || ''));
      this.forEach(function(el){ console.log(el); });
    }
    catch(e){}
    return this;
  }
});



//export to the externalName
_.Object = CruxObject;
_.Collection = Collection;
_.DOMSelection = DOMSelection;





/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 *   sizzle-1.5.1-34-g912a821
 */
(function(){var chunker=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,expando="sizcache"+(Math.random()+'').replace('.',''),done=0,toString=Object.prototype.toString,hasDuplicate=false,baseHasDuplicate=true,rBackslash=/\\/g,rNonWord=/\W/;[0,0].sort(function(){baseHasDuplicate=false;return 0;});var Sizzle=function(selector,context,results,seed){results=results||[];context=context||document;var origContext=context;if(context.nodeType!==1&&context.nodeType!==9){return[];}
if(!selector||typeof selector!=="string"){return results;}
var m,set,checkSet,extra,ret,cur,pop,i,prune=true,contextXML=Sizzle.isXML(context),parts=[],soFar=selector;do{chunker.exec("");m=chunker.exec(soFar);if(m){soFar=m[3];parts.push(m[1]);if(m[2]){extra=m[3];break;}}}while(m);if(parts.length>1&&origPOS.exec(selector)){if(parts.length===2&&Expr.relative[parts[0]]){set=posProcess(parts[0]+parts[1],context,seed);}else{set=Expr.relative[parts[0]]?[context]:Sizzle(parts.shift(),context);while(parts.length){selector=parts.shift();if(Expr.relative[selector]){selector+=parts.shift();}
set=posProcess(selector,set,seed);}}}else{if(!seed&&parts.length>1&&context.nodeType===9&&!contextXML&&Expr.match.ID.test(parts[0])&&!Expr.match.ID.test(parts[parts.length-1])){ret=Sizzle.find(parts.shift(),context,contextXML);context=ret.expr?Sizzle.filter(ret.expr,ret.set)[0]:ret.set[0];}
if(context){ret=seed?{expr:parts.pop(),set:makeArray(seed)}:Sizzle.find(parts.pop(),parts.length===1&&(parts[0]==="~"||parts[0]==="+")&&context.parentNode?context.parentNode:context,contextXML);set=ret.expr?Sizzle.filter(ret.expr,ret.set):ret.set;if(parts.length>0){checkSet=makeArray(set);}else{prune=false;}
while(parts.length){cur=parts.pop();pop=cur;if(!Expr.relative[cur]){cur="";}else{pop=parts.pop();}
if(pop==null){pop=context;}
Expr.relative[cur](checkSet,pop,contextXML);}}else{checkSet=parts=[];}}
if(!checkSet){checkSet=set;}
if(!checkSet){Sizzle.error(cur||selector);}
if(toString.call(checkSet)==="[object Array]"){if(!prune){results.push.apply(results,checkSet);}else if(context&&context.nodeType===1){for(i=0;checkSet[i]!=null;i++){if(checkSet[i]&&(checkSet[i]===true||checkSet[i].nodeType===1&&Sizzle.contains(context,checkSet[i]))){results.push(set[i]);}}}else{for(i=0;checkSet[i]!=null;i++){if(checkSet[i]&&checkSet[i].nodeType===1){results.push(set[i]);}}}}else{makeArray(checkSet,results);}
if(extra){Sizzle(extra,origContext,results,seed);Sizzle.uniqueSort(results);}
return results;};Sizzle.uniqueSort=function(results){if(sortOrder){hasDuplicate=baseHasDuplicate;results.sort(sortOrder);if(hasDuplicate){for(var i=1;i<results.length;i++){if(results[i]===results[i-1]){results.splice(i--,1);}}}}
return results;};Sizzle.matches=function(expr,set){return Sizzle(expr,null,null,set);};Sizzle.matchesSelector=function(node,expr){return Sizzle(expr,null,null,[node]).length>0;};Sizzle.find=function(expr,context,isXML){var set,i,len,match,type,left;if(!expr){return[];}
for(i=0,len=Expr.order.length;i<len;i++){type=Expr.order[i];if((match=Expr.leftMatch[type].exec(expr))){left=match[1];match.splice(1,1);if(left.substr(left.length-1)!=="\\"){match[1]=(match[1]||"").replace(rBackslash,"");set=Expr.find[type](match,context,isXML);if(set!=null){expr=expr.replace(Expr.match[type],"");break;}}}}
if(!set){set=typeof context.getElementsByTagName!=="undefined"?context.getElementsByTagName("*"):[];}
return{set:set,expr:expr};};Sizzle.filter=function(expr,set,inplace,not){var match,anyFound,type,found,item,filter,left,i,pass,old=expr,result=[],curLoop=set,isXMLFilter=set&&set[0]&&Sizzle.isXML(set[0]);while(expr&&set.length){for(type in Expr.filter){if((match=Expr.leftMatch[type].exec(expr))!=null&&match[2]){filter=Expr.filter[type];left=match[1];anyFound=false;match.splice(1,1);if(left.substr(left.length-1)==="\\"){continue;}
if(curLoop===result){result=[];}
if(Expr.preFilter[type]){match=Expr.preFilter[type](match,curLoop,inplace,result,not,isXMLFilter);if(!match){anyFound=found=true;}else if(match===true){continue;}}
if(match){for(i=0;(item=curLoop[i])!=null;i++){if(item){found=filter(item,match,i,curLoop);pass=not^found;if(inplace&&found!=null){if(pass){anyFound=true;}else{curLoop[i]=false;}}else if(pass){result.push(item);anyFound=true;}}}}
if(found!==undefined){if(!inplace){curLoop=result;}
expr=expr.replace(Expr.match[type],"");if(!anyFound){return[];}
break;}}}
if(expr===old){if(anyFound==null){Sizzle.error(expr);}else{break;}}
old=expr;}
return curLoop;};Sizzle.error=function(msg){throw new Error("Syntax error, unrecognized expression: "+msg);};var getText=Sizzle.getText=function(elem){var i,node,nodeType=elem.nodeType,ret="";if(nodeType){if(nodeType===1||nodeType===9||nodeType===11){if(typeof elem.textContent==="string"){return elem.textContent;}else{for(elem=elem.firstChild;elem;elem=elem.nextSibling){ret+=getText(elem);}}}else if(nodeType===3||nodeType===4){return elem.nodeValue;}}else{for(i=0;(node=elem[i]);i++){if(node.nodeType!==8){ret+=getText(node);}}}
return ret;};var Expr=Sizzle.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(elem){return elem.getAttribute("href");},type:function(elem){return elem.getAttribute("type");}},relative:{"+":function(checkSet,part){var isPartStr=typeof part==="string",isTag=isPartStr&&!rNonWord.test(part),isPartStrNotTag=isPartStr&&!isTag;if(isTag){part=part.toLowerCase();}
for(var i=0,l=checkSet.length,elem;i<l;i++){if((elem=checkSet[i])){while((elem=elem.previousSibling)&&elem.nodeType!==1){}
checkSet[i]=isPartStrNotTag||elem&&elem.nodeName.toLowerCase()===part?elem||false:elem===part;}}
if(isPartStrNotTag){Sizzle.filter(part,checkSet,true);}},">":function(checkSet,part){var elem,isPartStr=typeof part==="string",i=0,l=checkSet.length;if(isPartStr&&!rNonWord.test(part)){part=part.toLowerCase();for(;i<l;i++){elem=checkSet[i];if(elem){var parent=elem.parentNode;checkSet[i]=parent.nodeName.toLowerCase()===part?parent:false;}}}else{for(;i<l;i++){elem=checkSet[i];if(elem){checkSet[i]=isPartStr?elem.parentNode:elem.parentNode===part;}}
if(isPartStr){Sizzle.filter(part,checkSet,true);}}},"":function(checkSet,part,isXML){var nodeCheck,doneName=done++,checkFn=dirCheck;if(typeof part==="string"&&!rNonWord.test(part)){part=part.toLowerCase();nodeCheck=part;checkFn=dirNodeCheck;}
checkFn("parentNode",part,doneName,checkSet,nodeCheck,isXML);},"~":function(checkSet,part,isXML){var nodeCheck,doneName=done++,checkFn=dirCheck;if(typeof part==="string"&&!rNonWord.test(part)){part=part.toLowerCase();nodeCheck=part;checkFn=dirNodeCheck;}
checkFn("previousSibling",part,doneName,checkSet,nodeCheck,isXML);}},find:{ID:function(match,context,isXML){if(typeof context.getElementById!=="undefined"&&!isXML){var m=context.getElementById(match[1]);return m&&m.parentNode?[m]:[];}},NAME:function(match,context){if(typeof context.getElementsByName!=="undefined"){var ret=[],results=context.getElementsByName(match[1]);for(var i=0,l=results.length;i<l;i++){if(results[i].getAttribute("name")===match[1]){ret.push(results[i]);}}
return ret.length===0?null:ret;}},TAG:function(match,context){if(typeof context.getElementsByTagName!=="undefined"){return context.getElementsByTagName(match[1]);}}},preFilter:{CLASS:function(match,curLoop,inplace,result,not,isXML){match=" "+match[1].replace(rBackslash,"")+" ";if(isXML){return match;}
for(var i=0,elem;(elem=curLoop[i])!=null;i++){if(elem){if(not^(elem.className&&(" "+elem.className+" ").replace(/[\t\n\r]/g," ").indexOf(match)>=0)){if(!inplace){result.push(elem);}}else if(inplace){curLoop[i]=false;}}}
return false;},ID:function(match){return match[1].replace(rBackslash,"");},TAG:function(match,curLoop){return match[1].replace(rBackslash,"").toLowerCase();},CHILD:function(match){if(match[1]==="nth"){if(!match[2]){Sizzle.error(match[0]);}
match[2]=match[2].replace(/^\+|\s*/g,'');var test=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(match[2]==="even"&&"2n"||match[2]==="odd"&&"2n+1"||!/\D/.test(match[2])&&"0n+"+match[2]||match[2]);match[2]=(test[1]+(test[2]||1))-0;match[3]=test[3]-0;}
else if(match[2]){Sizzle.error(match[0]);}
match[0]=done++;return match;},ATTR:function(match,curLoop,inplace,result,not,isXML){var name=match[1]=match[1].replace(rBackslash,"");if(!isXML&&Expr.attrMap[name]){match[1]=Expr.attrMap[name];}
match[4]=(match[4]||match[5]||"").replace(rBackslash,"");if(match[2]==="~="){match[4]=" "+match[4]+" ";}
return match;},PSEUDO:function(match,curLoop,inplace,result,not){if(match[1]==="not"){if((chunker.exec(match[3])||"").length>1||/^\w/.test(match[3])){match[3]=Sizzle(match[3],null,null,curLoop);}else{var ret=Sizzle.filter(match[3],curLoop,inplace,true^not);if(!inplace){result.push.apply(result,ret);}
return false;}}else if(Expr.match.POS.test(match[0])||Expr.match.CHILD.test(match[0])){return true;}
return match;},POS:function(match){match.unshift(true);return match;}},filters:{enabled:function(elem){return elem.disabled===false&&elem.type!=="hidden";},disabled:function(elem){return elem.disabled===true;},checked:function(elem){return elem.checked===true;},selected:function(elem){if(elem.parentNode){elem.parentNode.selectedIndex;}
return elem.selected===true;},parent:function(elem){return!!elem.firstChild;},empty:function(elem){return!elem.firstChild;},has:function(elem,i,match){return!!Sizzle(match[3],elem).length;},header:function(elem){return(/h\d/i).test(elem.nodeName);},text:function(elem){var attr=elem.getAttribute("type"),type=elem.type;return elem.nodeName.toLowerCase()==="input"&&"text"===type&&(attr===type||attr===null);},radio:function(elem){return elem.nodeName.toLowerCase()==="input"&&"radio"===elem.type;},checkbox:function(elem){return elem.nodeName.toLowerCase()==="input"&&"checkbox"===elem.type;},file:function(elem){return elem.nodeName.toLowerCase()==="input"&&"file"===elem.type;},password:function(elem){return elem.nodeName.toLowerCase()==="input"&&"password"===elem.type;},submit:function(elem){var name=elem.nodeName.toLowerCase();return(name==="input"||name==="button")&&"submit"===elem.type;},image:function(elem){return elem.nodeName.toLowerCase()==="input"&&"image"===elem.type;},reset:function(elem){var name=elem.nodeName.toLowerCase();return(name==="input"||name==="button")&&"reset"===elem.type;},button:function(elem){var name=elem.nodeName.toLowerCase();return name==="input"&&"button"===elem.type||name==="button";},input:function(elem){return(/input|select|textarea|button/i).test(elem.nodeName);},focus:function(elem){return elem===elem.ownerDocument.activeElement;}},setFilters:{first:function(elem,i){return i===0;},last:function(elem,i,match,array){return i===array.length-1;},even:function(elem,i){return i%2===0;},odd:function(elem,i){return i%2===1;},lt:function(elem,i,match){return i<match[3]-0;},gt:function(elem,i,match){return i>match[3]-0;},nth:function(elem,i,match){return match[3]-0===i;},eq:function(elem,i,match){return match[3]-0===i;}},filter:{PSEUDO:function(elem,match,i,array){var name=match[1],filter=Expr.filters[name];if(filter){return filter(elem,i,match,array);}else if(name==="contains"){return(elem.textContent||elem.innerText||getText([elem])||"").indexOf(match[3])>=0;}else if(name==="not"){var not=match[3];for(var j=0,l=not.length;j<l;j++){if(not[j]===elem){return false;}}
return true;}else{Sizzle.error(name);}},CHILD:function(elem,match){var first,last,doneName,parent,cache,count,diff,type=match[1],node=elem;switch(type){case"only":case"first":while((node=node.previousSibling)){if(node.nodeType===1){return false;}}
if(type==="first"){return true;}
node=elem;case"last":while((node=node.nextSibling)){if(node.nodeType===1){return false;}}
return true;case"nth":first=match[2];last=match[3];if(first===1&&last===0){return true;}
doneName=match[0];parent=elem.parentNode;if(parent&&(parent[expando]!==doneName||!elem.nodeIndex)){count=0;for(node=parent.firstChild;node;node=node.nextSibling){if(node.nodeType===1){node.nodeIndex=++count;}}
parent[expando]=doneName;}
diff=elem.nodeIndex-last;if(first===0){return diff===0;}else{return(diff%first===0&&diff/first>=0);}}},ID:function(elem,match){return elem.nodeType===1&&elem.getAttribute("id")===match;},TAG:function(elem,match){return(match==="*"&&elem.nodeType===1)||!!elem.nodeName&&elem.nodeName.toLowerCase()===match;},CLASS:function(elem,match){return(" "+(elem.className||elem.getAttribute("class"))+" ").indexOf(match)>-1;},ATTR:function(elem,match){var name=match[1],result=Sizzle.attr?Sizzle.attr(elem,name):Expr.attrHandle[name]?Expr.attrHandle[name](elem):elem[name]!=null?elem[name]:elem.getAttribute(name),value=result+"",type=match[2],check=match[4];return result==null?type==="!=":!type&&Sizzle.attr?result!=null:type==="="?value===check:type==="*="?value.indexOf(check)>=0:type==="~="?(" "+value+" ").indexOf(check)>=0:!check?value&&result!==false:type==="!="?value!==check:type==="^="?value.indexOf(check)===0:type==="$="?value.substr(value.length-check.length)===check:type==="|="?value===check||value.substr(0,check.length+1)===check+"-":false;},POS:function(elem,match,i,array){var name=match[2],filter=Expr.setFilters[name];if(filter){return filter(elem,i,match,array);}}}};var origPOS=Expr.match.POS,fescape=function(all,num){return"\\"+(num-0+1);};for(var type in Expr.match){Expr.match[type]=new RegExp(Expr.match[type].source+(/(?![^\[]*\])(?![^\(]*\))/.source));Expr.leftMatch[type]=new RegExp(/(^(?:.|\r|\n)*?)/.source+Expr.match[type].source.replace(/\\(\d+)/g,fescape));}
Expr.match.globalPOS=origPOS;var makeArray=function(array,results){array=Array.prototype.slice.call(array,0);if(results){results.push.apply(results,array);return results;}
return array;};try{Array.prototype.slice.call(document.documentElement.childNodes,0)[0].nodeType;}catch(e){makeArray=function(array,results){var i=0,ret=results||[];if(toString.call(array)==="[object Array]"){Array.prototype.push.apply(ret,array);}else{if(typeof array.length==="number"){for(var l=array.length;i<l;i++){ret.push(array[i]);}}else{for(;array[i];i++){ret.push(array[i]);}}}
return ret;};}
var sortOrder,siblingCheck;if(document.documentElement.compareDocumentPosition){sortOrder=function(a,b){if(a===b){hasDuplicate=true;return 0;}
if(!a.compareDocumentPosition||!b.compareDocumentPosition){return a.compareDocumentPosition?-1:1;}
return a.compareDocumentPosition(b)&4?-1:1;};}else{sortOrder=function(a,b){if(a===b){hasDuplicate=true;return 0;}else if(a.sourceIndex&&b.sourceIndex){return a.sourceIndex-b.sourceIndex;}
var al,bl,ap=[],bp=[],aup=a.parentNode,bup=b.parentNode,cur=aup;if(aup===bup){return siblingCheck(a,b);}else if(!aup){return-1;}else if(!bup){return 1;}
while(cur){ap.unshift(cur);cur=cur.parentNode;}
cur=bup;while(cur){bp.unshift(cur);cur=cur.parentNode;}
al=ap.length;bl=bp.length;for(var i=0;i<al&&i<bl;i++){if(ap[i]!==bp[i]){return siblingCheck(ap[i],bp[i]);}}
return i===al?siblingCheck(a,bp[i],-1):siblingCheck(ap[i],b,1);};siblingCheck=function(a,b,ret){if(a===b){return ret;}
var cur=a.nextSibling;while(cur){if(cur===b){return-1;}
cur=cur.nextSibling;}
return 1;};}
(function(){var form=document.createElement("div"),id="script"+(new Date()).getTime(),root=document.documentElement;form.innerHTML="<a name='"+id+"'/>";root.insertBefore(form,root.firstChild);if(document.getElementById(id)){Expr.find.ID=function(match,context,isXML){if(typeof context.getElementById!=="undefined"&&!isXML){var m=context.getElementById(match[1]);return m?m.id===match[1]||typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id").nodeValue===match[1]?[m]:undefined:[];}};Expr.filter.ID=function(elem,match){var node=typeof elem.getAttributeNode!=="undefined"&&elem.getAttributeNode("id");return elem.nodeType===1&&node&&node.nodeValue===match;};}
root.removeChild(form);root=form=null;})();(function(){var div=document.createElement("div");div.appendChild(document.createComment(""));if(div.getElementsByTagName("*").length>0){Expr.find.TAG=function(match,context){var results=context.getElementsByTagName(match[1]);if(match[1]==="*"){var tmp=[];for(var i=0;results[i];i++){if(results[i].nodeType===1){tmp.push(results[i]);}}
results=tmp;}
return results;};}
div.innerHTML="<a href='#'></a>";if(div.firstChild&&typeof div.firstChild.getAttribute!=="undefined"&&div.firstChild.getAttribute("href")!=="#"){Expr.attrHandle.href=function(elem){return elem.getAttribute("href",2);};}
div=null;})();if(document.querySelectorAll){(function(){var oldSizzle=Sizzle,div=document.createElement("div"),id="__sizzle__";div.innerHTML="<p class='TEST'></p>";if(div.querySelectorAll&&div.querySelectorAll(".TEST").length===0){return;}
Sizzle=function(query,context,extra,seed){context=context||document;if(!seed&&!Sizzle.isXML(context)){var match=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(query);if(match&&(context.nodeType===1||context.nodeType===9)){if(match[1]){return makeArray(context.getElementsByTagName(query),extra);}else if(match[2]&&Expr.find.CLASS&&context.getElementsByClassName){return makeArray(context.getElementsByClassName(match[2]),extra);}}
if(context.nodeType===9){if(query==="body"&&context.body){return makeArray([context.body],extra);}else if(match&&match[3]){var elem=context.getElementById(match[3]);if(elem&&elem.parentNode){if(elem.id===match[3]){return makeArray([elem],extra);}}else{return makeArray([],extra);}}
try{return makeArray(context.querySelectorAll(query),extra);}catch(qsaError){}}else if(context.nodeType===1&&context.nodeName.toLowerCase()!=="object"){var oldContext=context,old=context.getAttribute("id"),nid=old||id,hasParent=context.parentNode,relativeHierarchySelector=/^\s*[+~]/.test(query);if(!old){context.setAttribute("id",nid);}else{nid=nid.replace(/'/g,"\\$&");}
if(relativeHierarchySelector&&hasParent){context=context.parentNode;}
try{if(!relativeHierarchySelector||hasParent){return makeArray(context.querySelectorAll("[id='"+nid+"'] "+query),extra);}}catch(pseudoError){}finally{if(!old){oldContext.removeAttribute("id");}}}}
return oldSizzle(query,context,extra,seed);};for(var prop in oldSizzle){Sizzle[prop]=oldSizzle[prop];}
div=null;})();}
(function(){var html=document.documentElement,matches=html.matchesSelector||html.mozMatchesSelector||html.webkitMatchesSelector||html.msMatchesSelector;if(matches){var disconnectedMatch=!matches.call(document.createElement("div"),"div"),pseudoWorks=false;try{matches.call(document.documentElement,"[test!='']:sizzle");}catch(pseudoError){pseudoWorks=true;}
Sizzle.matchesSelector=function(node,expr){expr=expr.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!Sizzle.isXML(node)){try{if(pseudoWorks||!Expr.match.PSEUDO.test(expr)&&!/!=/.test(expr)){var ret=matches.call(node,expr);if(ret||!disconnectedMatch||node.document&&node.document.nodeType!==11){return ret;}}}catch(e){}}
return Sizzle(expr,null,null,[node]).length>0;};}})();(function(){var div=document.createElement("div");div.innerHTML="<div class='test e'></div><div class='test'></div>";if(!div.getElementsByClassName||div.getElementsByClassName("e").length===0){return;}
div.lastChild.className="e";if(div.getElementsByClassName("e").length===1){return;}
Expr.order.splice(1,0,"CLASS");Expr.find.CLASS=function(match,context,isXML){if(typeof context.getElementsByClassName!=="undefined"&&!isXML){return context.getElementsByClassName(match[1]);}};div=null;})();function dirNodeCheck(dir,cur,doneName,checkSet,nodeCheck,isXML){for(var i=0,l=checkSet.length;i<l;i++){var elem=checkSet[i];if(elem){var match=false;elem=elem[dir];while(elem){if(elem[expando]===doneName){match=checkSet[elem.sizset];break;}
if(elem.nodeType===1&&!isXML){elem[expando]=doneName;elem.sizset=i;}
if(elem.nodeName.toLowerCase()===cur){match=elem;break;}
elem=elem[dir];}
checkSet[i]=match;}}}
function dirCheck(dir,cur,doneName,checkSet,nodeCheck,isXML){for(var i=0,l=checkSet.length;i<l;i++){var elem=checkSet[i];if(elem){var match=false;elem=elem[dir];while(elem){if(elem[expando]===doneName){match=checkSet[elem.sizset];break;}
if(elem.nodeType===1){if(!isXML){elem[expando]=doneName;elem.sizset=i;}
if(typeof cur!=="string"){if(elem===cur){match=true;break;}}else if(Sizzle.filter(cur,[elem]).length>0){match=elem;break;}}
elem=elem[dir];}
checkSet[i]=match;}}}
if(document.documentElement.contains){Sizzle.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):true);};}else if(document.documentElement.compareDocumentPosition){Sizzle.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16);};}else{Sizzle.contains=function(){return false;};}
Sizzle.isXML=function(elem){var documentElement=(elem?elem.ownerDocument||elem:0).documentElement;return documentElement?documentElement.nodeName!=="HTML":false;};var posProcess=function(selector,context,seed){var match,tmpSet=[],later="",root=context.nodeType?[context]:context;while((match=Expr.match.PSEUDO.exec(selector))){later+=match[0];selector=selector.replace(Expr.match.PSEUDO,"");}
selector=Expr.relative[selector]?selector+"*":selector;for(var i=0,l=root.length;i<l;i++){Sizzle(selector,root[i],tmpSet,seed);}
return Sizzle.filter(later,tmpSet);}; 

//EXPORT to the crux namespace only (not global)
_.dom.selectorEngine = Sizzle;
_.dom.selectorEngine_matches = Sizzle.matches;

})();

//--------------------------------------------------------------------------------
//--------------------END Sizzle -------------------------------------------------
//--------------------------------------------------------------------------------



})(
    //try to get a reference to the global object, regardless of the scope the code is executed in
    //kangax - http://perfectionkills.com/
    (function(){ return this || (1,eval)('this'); })()
  );