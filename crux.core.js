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
    
    //-------------------------------------
    //objects to house our main modules 
    _events   = {},
    _str      = {},
    _ajax     = {},
    _config   = {
      "classRECaching" : true
    },
    _cache    = {
      "elementData": {}
    },
    
    _externalName   = 'crux',
    _guidCounter    =  0,
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
  docElement : document.documentElement,
  stringIndexes    : "d"[0] == "d", //test if the browser supports accessing characters of a string using this notation: str[3]
  //test if Array.prototype.slice can be used on DOMNodeLists 
  //(IE<9 craps out when you try "slice()"ing a nodelist)
  sliceNodeLists : !!(function(){
    try{ return _slice.call(document.documentElement.children, 0); }
    catch(e){}
  })(),
  IECreateElement: !!(function(){
    //try to create the element using IE's funked up syntax
    try{ return document.createElement('<input type="radio" name="x">'); }
    catch(e){}
  })(),
  //detect the 
  CSSClassAttribute : (function(){
    //create an element to test which attribute contains the actual CSS class string
    var el = _ce('div');
    el.innerHTML = '<p class="X"></p>';
    return el.children[0].getAttribute('className') == 'X' ? 'className' : 'class';
  })(),
  //create an element to test if the styleFloat property is not undefined
  floatProperty: (function(){ return (_ce('div').style.styleFloat !== undefined) ? 'styleFloat' : 'cssFloat'; })(),
  //detect which event module the browser uses to create custom event types
  customEventsModule: (function(){
    try{ document.createEvent('CustomEvent'); return 'CustomEvent'; }
    catch(e){ return 'HTMLEvents'; }
  })()
};


//internal reference to the library core object is "_"
var _ = window[_externalName] = {
  version  : _version,
  config   : _config,
  detected : _detected,
  events   : _events,
  str      : _str,
  ajax     : _ajax,
  _cache   : _cache,

  ready: function ready(fn){ _events.listen(document, 'ready', fn); },
  
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
  //extendKeys
  //copies only properties from multiple objects into one object if
  //they are present in the supplied "keys" array.
  extendKeys: function extendKeys(keys, obj, obj1, obj2){
    var key, source, i, il, j, jl = keys.length;
    //if(keys === true){ return _.extend.apply(_slice.call(arguments, 1)); }
    obj = obj || {};
    for(var i=1, l=arguments.length; i<l; i++){
      source = arguments[i];
      j = jl;
      while(j--){
        key = keys[j];
        if(_hasOwnProperty.call(source, key)){
          obj[key] = source[key];
        }
      }
    }
    return obj;
  },
  
  //--------------------------------------------------
  //extend
  //copies properties from multiple objects into one object
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
    //if a second argument was passed, use it, even if the value is undefined
    var v = arguments.length == 2 ? root : window, ar = chain.split('.');
    //iterate over the properties in the chain and stop if the value is 
    //undefined or null (with type coercion, null == undefined)
    for(var i=0, l=ar.length; i<l && v != null; v = v[ar[i++]]){}
    //return the last property even if it's undefined
    return v;
  },
  
  
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
        if(!unique && (_detected.sliceNodeLists || (oia && _.isArray(objAdd)))){
          //console.log([obj.length,0].concat(_slice.call(objAdd, 0)));
          _splice.apply(obj, [obj.length,0].concat(_.isArray(objAdd) ? objAdd : _slice.call(objAdd, 0)));
        }
        else{
          //TODO: add check for DOMElements (they have a length but no indexes)
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
  //makes a "copy" of the object passed to it.(creates a new object with the passed object's constructor and copies properties into it)
  //optional parameter "allProperties", if set to true, copies properties inherited through it's prototype
  //deep clone also clones the properties of the object that are objects as well (with cyclical references, this can cause an issue)
  clone: function clone(obj, deep, constructor){
    var cloned, key;
    //obj == null also matches obj === undefined through type coersion
    if(obj == null || typeof obj !== 'object'){ return obj; }
    if(_.isElement(obj)){ return _dom.cloneElement.apply(this, arguments); }
    constructor && (cloned = new (constructor === true ? (obj.constructor || Object) : constructor));
    cloned = cloned || {};
    clone.depth = (clone.depth === undefined) ? 0 : clone.depth;
    deep = (deep === true ? MAX_CLONE_DEPTH : Math.min(deep, MAX_CLONE_DEPTH)) || 0;
    //iterate through the object's properties
    for(key in obj){
      //check to see if the property in question belongs to the object
      //if it doesn't, skip over this property
      if(_hasOwnProperty.call(obj, key)){
        //if it's not an "unknown" type (happens with some native and activeX objects in ie < 8)
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
    //this approach won't work on DOM nodelists under ie8 (throws a "Jscript object expected" error) 
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
   
 
    
    
  //**************************************************************
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
      while(i-- > start){
        //if the value from the original array is not in the new array
        if(_indexOf.call(newAr, tmp = ar[i]) == -1){
          //tack it to the beginning of the array
          _splice.call(newAr, 0, 0, tmp);
        }
      }
      return newAr;
    }
    //change the original array
    while(i-- > start){
      //if occurs at another index in the array (searched from front)
      if(_indexOf.call(ar, ar[i]) !== i){
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
  
  //partial application (currying) helper
  //careful. creates closures.
  partial: function partial(fn){
    var f = function partialized(){ return fn.apply(this, _.toArray(partialized.args, arguments)); };
    f.args = _slice.call(arguments, 1);
    f.original = fn;
    return f;
  },
  
  
  _checkReady: function(){
    //set the default trap events
    //(when listen tries to add more handlers after they've fired once, the "added" handler is executed immediately)
    _events.latch(window, 'load');
    _events.latch(document, 'ready');
    
    function fireDOMReady(objEvent){
      if(fireDOMReady.done){
        return;
      }
      //remove the handlers from the document/window objects
      _.unlisten(document, 'DOMContentLoaded', fireDOMReady);
      _.unlisten(window, 'load', fireDOMReady);
      //record a timestamp of when it was ready 
      //ddp.f.documentReadyTime = (new Date().getTime());
      //ddp.f.documentReadyMethod = objEvent.type;
      fireDOMReady.done = true;
      _events.fire(document, 'ready', {"cancelable":false});
    }
    
    var elLast = document.getElementsByTagName ? document.getElementsByTagName('*') : null;
    //if the 
    if(document.readyState == 'complete' || (document.readyState === undefined && elLast[elLast.length-1] !== undefined) ){
      fireDOMReady({"type": "readyState_alreadyComplete"});
      //add something here to fire only the window.load events added by this instance
      //_.fire(document, 'ready', {"cancelable":false});
    }
    else{
      //code block below taken almost straight-up from jQuery (credit to Diego Perini and John Resig)
      if(document.attachEvent){
        document.attachEvent('onreadystatechange', function checkstate(){
          if(document.readyState == 'complete'){
            document.detachEvent('onreadystatechange', checkstate);
            fireDOMReady({"type": "readyState"});
          }
        });
        
        //not inside an iframe
        if(window == top){
          setTimeout(function scrollCheckLoop(){
            try{ document.documentElement.doScroll("left"); }
            catch(e){
              if(!fireDOMReady.done){
                setTimeout(scrollCheckLoop, 0);
              }
              return;
            }
            fireDOMReady({"type": "doScroll"});
          }, 0);
        }
      }
    
      //if the browser supports the DOMContentLoaded event,
      //then we'll just attach a handler and use it to fire our custom document "ready"
      _events.listen(document, 'DOMContentLoaded', fireDOMReady);
      //fallback to firing the document "ready" on window "load" if it hasn't already been fired by another method
      _events.listen(window, 'load', fireDOMReady);
    }
  },
  
  
  //-----------------------------------------------
  //-----------------CRUX OBJECT-------------------
  //-----------------------------------------------
  
  "Object": (function(){
    function CruxObject(){}
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
        this._super.subclasses = (this._super.subclasses ? (this._super.subclasses.push(sub) && this._super.subclasses): [sub]) 
        return this.constructor = sub;
      }
    };
    return CruxObject;
  })()
};




//-----------------------------------------------
//-----------------COLLECTION--------------------
//-----------------------------------------------
_.Collection = (new _.Object).subclass({
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
  },
  listen  : function(type, listener){ _events._demux.apply(null, _.mergeIndexes([_events.listen, this], arguments)); },
  unlisten: function(type, listener){ _events._demux.apply(null, _.mergeIndexes([_events.unlisten, this], arguments)); },
  fire: function(types, obj, manualBubble){ _events._demux.apply(null, _.mergeIndexes([_events.fire, this], arguments)); }
});



(function(){
//----------------------------------------------------------------------------------
//EVENTS MODULE
//----------------------------------------------------------------------------------
_.extend(_events, {
  /***************************************************************/
  //---------------------------------------------------------------------------
  //_demux
  //takes arguments for the event methods and demultiplexes then from arrays,
  //collections and space separated strings, calling the "this" for each combination of arguments
  // eg. _demux.call(_listen, "div, .someClass", ")
  //---------------------------------------------------------------------------
  
  _demux: function _demux(fn, demuxTarget, targets, types){
    //console.log(arguments);
    var successes = 0, i, il, j, jl;
    //resolve the selector string if that's what "targets" contains
    if(demuxTarget && !(targets = _.isString(targets) ? _dom.selectorEngine(targets) : targets)){ return 0; }
    if(_.isString(types)){
      //trim whitespace from either end and replace multiple whitespace chars with a single space
      types = _.str.trim(types).replace(/\s{2,}/g, ' ');
      //split space separated words into an array
      types = (types.indexOf(' ') > -1 ? types.split(' ') : types);
    }
    //if null or undefined, make it an asterisk
    types = (types == null) ? '*' : types;
    //an array of event types can be passed and each event type on the target element will have the listener added to it
    types = (_.isArray(types) || types instanceof _.Collection) ? types : [types];
    //an array of event targets can be passed and each target element will have the event type listener added to it
    targets = (!demuxTarget || _.isArray(targets) || targets instanceof _.Collection) ? targets : [targets];
    for(i=0, il=(demuxTarget ? targets.length : 0); i<il; i++){
      for(j=0, jl=types.length; j<jl; j++){
        successes += fn.apply(this, _.toArray([(demuxTarget ? targets[i] : targets), types[j]], _slice.call(arguments, 4)));
      }
    }
    return successes;
  },
  
  listenMany  : function listenMany(ar, types, listener){ return _events._demux.apply(null, _.toArray([_events.listen, true], arguments)); },
  unlistenMany: function unlistenMany(ar, types, listener){ return _events._demux.apply(null, _.toArray([_events.unlisten, true], arguments)); },
  fireMany    : function fireMany(ar, types, obj, manualBubble){ return _events._demux.apply(null, _.toArray([_events.fire, true], arguments)); },
  
  listenOnce : function listenOnce(target, type, listener){ return _events.listen(target, type, listener, arguments[3], true); },
  
  //listen  
  listen: function listen(target, type, listener){
      var noWrap = arguments[3], //don't show the internally used "noWrap" argument
        once = arguments[4],
        emulate = _events.emulate,
        eventNamespace = '',
        arResults,
        i, l, //iterator and length for looping
        savedSelector = target,
        e,
        listeners,
        listenerContainer;
    
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([listen, _.isString(target)], arguments));
    }
    
    //we don't accept the asterisk in this method
    type = (type == '*') ? null : type;
    
    //if we don't have all the arguments we need..
    if(!target || !listener || !type){
      //compose an error description string
      var strErrDesc =  'Error: DDP -> F -> addEvent: Event target or listener or type missing. ' +
                        '\nTarget: ' + (target ? (target.id || target.className || savedSelector || 'none') : savedSelector || 'none') +
                        '\nType: "' + (eventNamespace ? eventNamespace + '.' + type : type) + '"' +
                        '\nListener: "' + (listener ? listener.toString().substr(0, 100).replace('\n', '') : 'none') + '"';
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
      return 0;
    }
    
    //separate the namespace from the event type, if both were included
    if(type.indexOf('.') > -1){
      eventNamespace = type.split('.');
      type = eventNamespace.pop();
      eventNamespace = eventNamespace.join('.');
    }
    //console.log('ns', eventNamespace, 'ty', type);
    
    //get the current listener container or create a new one
    listenerContainer = _.getData(target, '__listeners__') || _.setData(target, '__listeners__', {});
    //get the listeners array if it exists and check if it's an array, if it's not then
    //create a new array and assign it to both the listener container and our local variable "listeners"
    listeners = (_.isArray(listeners = listenerContainer[type])) ? listeners : listenerContainer[type] = [];
  
    
    //emulate events that are in "emulatedEvents" if the browser doesn't support them
    if(emulate[type] && !listeners.emulated && !_events.supported(type, target)){
      //mark the element as having the emulation set up (so we don't try to do it again)
      listeners.emulated = true;
      //add any prerequisite emulated events (ie. mouseenter emulation depends on the mouseleave event and vise-versa)
      if(emulate[type].prerequisiteEvents){
        emulate[type].prerequisiteEvents.split(' ').forEach(function(emuType){
          //add a listener for the prerequisite event type (and don't return a CruxEvent object to the listener, just the plain browser event)
          _events.listen(target, emulate[emuType].attachToEvent, emulate[emuType].fn, true);
        });
      }
      //if it's a one-time event
      if(emulate[type].isLatch){
        //set it as such
        _events.latch(target, type);
      }
      //add the listener that performs the emulation to the event that can be used to trigger the emulation
      _events.listen(emulate[type].attachToElement || target, emulate[type].attachToEvent, function(e){ return emulate[type].fn && emulate[type].fn.call(target, e); }, true);
    }
    
    
    //if this is a one-time event (such as window 'load'), and it has already been fired,
    //(supposed to be a single equals sign, we're assigning the value to e, then testing if it's truthy)  
    if(e = _events.latchClosed(target, type)){
      //then execute the event listener right away (using the event target as "this" and passing a new event object to it).
      listener.call(target, e);
      return; //indicate a one time event re-fire
    }
    
    //create a function to repair the scope and redirect the proper event object. 
    var fn = function(ev){
      //use the event object passed as an argument, or try to use the global event object available in IE <10
      var rv, objEvent = (ev = ev || window);
      if(!noWrap && ev.eventModel !== 3){
        objEvent = ev.cruxEvent || new _events.Event;
        !objEvent.normalized && objEvent.normalize(objEvent.nativeEvent || ev);
        objEvent.currentTarget = objEvent.currentTarget || this;//_events.Event.prototype.converters.target(ev);
      }
      
      //if there is no event namespace or the event namespace matches the listener namespace
      if(_events.namespaceMatch(objEvent.eventNamespace, fn.namespace)){
        //white a property on the event object with the current listener namespace 
        objEvent.listenerNamespace = fn.namespace;
        //if it's a listenOnce event, unlisten the listener, once it fires.
        if(once){ _events.unlisten(target, type, fn.innerFn); }
        //call the listener using the current target as it's "this" (scope of the target object) 
        rv = fn.innerFn.call(objEvent.currentTarget || target, objEvent);
        if(rv === false || (objEvent.type === 'beforeunload' && isString(rv))){
          objEvent.returnValue = rv;
        }
        else{
          rv = objEvent.returnValue;
        }
      }
      //if it's a 'beforeunload' event and the return value from the listener was a string, use the listener return value.
      //otherwise, use the event objest returnValue property
      return rv;
    };
    //record the inner function (actual event listener) on the fn function (so we can remove it, tell is it's already attached)
    fn.innerFn = listener;
    fn.namespace = eventNamespace;
    
    
    //if there are no listeners in the array or the new listener isn't present in the array
    //TODO: figure out if we need to allow a listener for each namespace
    if(listeners.length == 0 || !listeners.some(function(fn){ return fn.innerFn == listener; })){
      //just push the listener onto the end of the array
      listeners.push(fn);
    }
    //the listener has already been added
    else{
      //return zero
      return 0;
    }
    
    //w3c standard browsers
    //add the event listener. specify false for the last argument to use the bubbling phase (to mirror IE's limitation to only bubble)
    //(if the addEventListener method returns false, move to the next event model)
    if(target.addEventListener && (listeners.__eventModel__ === 1 || !listeners.__eventModel__) && target.addEventListener(type, fn, false) !== false){
      //return the event model used to add the event listener
      listeners.__eventModel__ = 1;
    }
    //Internet Explorer
    //typeof target['on' + type] != 'undefined' &&
    else if(target.attachEvent && (listeners.__eventModel__ === 2 || !listeners.__eventModel__) && _events.supported(type, target)){
      //attach the event using the IE event model (bubble only)
      target.attachEvent('on' + type, fn);
      //if it's the first time a listener has been added
      if(!listeners.__eventModel__){
        //add a listener to the window onunload event so that we can detach this event when the window unloads
        //(try to relase event listener memory on old IEs)
        window.attachEvent('onunload', function(){
          //remove the listner container object and get a reference to it
          var ar, listenerContainer = _.getData(target, '__listeners__');
          
          //if there is an array for this event type
          if(listenerContainer && _.isArray(ar = listenerContainer[type])){
            //go through each listener and remove it
            for(var i=0, l=ar.length; i<l; i++){ target.detachEvent('on' + type, ar[i]); }
            //clear the array
            ar.length = 0;
            //clear the contents of the listener container key
            _.setData(target, '__listeners__', undefined);
          }
        });
        //return the event model used to add the event listener
        listeners.__eventModel__ = 2;
      }
    }
    //if nothing has worked yet... fallback to the AERM method
    else{
      //if this is a DOMElement or the window object and if the
      //object doesn't have our "on" + type function assigned to "fireAERMListeners"
      //(which means this is the first time an aerm listener has been added for this type)
      if((_.isElement(target) || target == window) && target['on' + type] != _events._executeListeners){
        //record the old value (in case someone manually assigned a listener already, or it was in the HTML)
        var fnOldStyleFunction = target['on' + type];
        //assign our listener
        target['on' + type] = _events._executeListeners;
        //and if the 
        if(typeof fnOldStyleFunction == 'function'){
          //add the old manual style event listener (global namespace)
          listen(target, type, fnOldStyleFunction, true);
        }
      }
      //record the event model used to attach the listener
      listeners.__eventModel__ = 3;
    }
    
    //return the event model that was used to attach the listener
    //return listeners.__eventModel__;
    return 1;
  },
  
  
  //------------------------------------------------------------------------------
  //unlisten
  //------------------------------------------------------------------------------
  unlisten: function unlisten(target, type, listener){
    var eventNamespace = '',
        returnValue = [],
        arResults,
        listeners,
        savedSelector,
        listenerContainer,
        tmpParts, i, l, fn;
        
    type = (type == null) ? '*' : type;
    //see if there was a namespace included in the event type
    if(type.indexOf('.') > -1){
      eventNamespace = type.split('.');
      type = eventNamespace.pop();
      eventNamespace = eventNamespace.join('.');
    }
    
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([unlisten, _.isString(target)], arguments));
    }
    
    //if we aren't able to get a reference to the ddplisteners object, quit
    if(!(listenerContainer = _.getData(target, '__listeners__'))){
      return returnValue;
    }
    
    if(type == '*'){
      arResults = [];
      for(var key in listenerContainer){
        if(_hasOwnProperty.call(listenerContainer, key)){
          _push.apply(arResults, unlisten(target, eventNamespace ? eventNamespace + '.' + key : key, listener));
        }
      }
      return arResults;
    }
    
   
    //if there is an array of listeners for this event type
    if(_.isArray(listeners = listenerContainer[type])){
      //record the array length and set a decrementor
      i = l = listeners.length;
      while(i--){
        fn = listeners[i];
        
        if((fn.innerFn == listener || !listener) && _events.namespaceMatch(eventNamespace, fn.namespace)){
          listeners.splice(i, 1);
          
          if(listeners.__eventModel__ == 1){
            target.removeEventListener(type, fn, false);
          }
          else if(listeners.__eventModel__ == 2){
            target.detachEvent('on' + type, fn);
          }
          else if(target['on' + type] == _events._executeListeners){
            target['on' + type] = undefined;
          }
          //if the last event listener was just removed. should we clean up arrays and tracking objects?
          if(--l==0){}
          //a function reference was supplied
          if(listener){ return fn.innerFn; }
          //otherwise, add the fn to the array
          returnValue.push(fn.innerFn);
        }
      }
    }
    
    return returnValue;
  },
  
  
  fire: function fire(target, type, obj, manualBubble){
    var objEvent,
        objBrowserEvent,
        eventNamespace = '',
        arResults, i, l,
        eventModel,
        listenerContainer,
        listeners;
        
    //alow for the single object parameter that contains all the relevent arguments
    if(arguments.length==1){
      obj = target;
      target = obj.target;
      type = obj.type;
      manualBubble = obj.manualBubble;
    }
    
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([fire, _.isString(target)], arguments));
    }
  
    //see if there was a namespace included in the event type
    if(type.indexOf('.') > -1){
      eventNamespace = type.split('.');
      type = eventNamespace.pop();
      eventNamespace = eventNamespace.join('.');
    }
    
    
    //get the event model used to add the listeners for this event type (or null)
    eventModel = ((listenerContainer = _.getData(target, '__listeners__')) && (listeners = listenerContainer[type]) ? listeners.__eventModel__ : null);
    
    if(type == '*'){
      arResults = [];
      for(var key in listenerContainer){
        if(_hasOwnProperty.call(listenerContainer, key)){
          arResults = arResults.concat(_events.fire(target, eventNamespace ? eventNamespace + '.' + key : key, obj, manualBubble));
        }
      }
      return arResults;
    }
    
    //make sure "obj" exists
    obj = obj || {};
    
    //set some properties that will be passed to the event object
    objEvent = _.clone(obj, false, _events.Event);
    objEvent.eventNamespace = eventNamespace;
    objEvent.manualBubble = !!manualBubble;
    if(objEvent.manualBubble){
      objEvent.bubbles = true;
    }
    
    if((eventModel == 1 || !eventModel) && target.dispatchEvent){
      //obj.eventModel = 
      objEvent.eventModel = 1;
      //create a browser event object on the fly using our event type and extended event properties
      objBrowserEvent = _events._createBrowserEventObject(type, obj);
      objBrowserEvent.cruxEvent = objEvent;
      //and fire the event, returning "1" (to report the firing method used)  or false, if it was unsuccessful
      target.dispatchEvent(objBrowserEvent);  //fire the event
    }
    else if(eventModel == 2 && target.fireEvent){
      //obj.eventModel = 
      objEvent.eventModel = 2;
      //create a browser event object on the fly using our event type and extended event properties
      objBrowserEvent = _events._createBrowserEventObject(type, obj);
      objBrowserEvent.cruxEvent = objEvent;
      //and fire the event, returning "1" (to report the firing method used)  or false, if it was unsuccessful
      target.fireEvent('on' + type, objBrowserEvent) ? 2 : false; //fire the event
    }
    //if no other model was used, default to the aerm
    else{
      var exec = _events._executeListeners;
      objEvent.eventModel = 3;
      //
      objEvent.normalize(obj);
      objEvent.type = type;
      objEvent.target = objEvent.currentTarget = target;
      //since this is not going to be a browser event, just clone the obj object to act as our event object
      exec(objEvent);
      //if this event bubbles, climb up the DOM tree and fire the listeners on each parent node 
      while(objEvent.cancelBubble !== false && (objEvent.bubbles || objEvent.manualBubble) && objEvent.currentTarget.parentNode && !_.getData(objEvent.currentTarget.parentNode, 'cruxOTE_' + type)){
        objEvent.currentTarget = objEvent.currentTarget.parentNode;
        exec(objEvent);
      }
    }
      
    //return the event object
    return objEvent;
  },
  
  
  
  
  //--------------------------------------------------------------------------------------------
  //listeners
  //--------------------------------------------------------------------------------------------
  listeners: function listeners(target, type, fn, callback){
    var listenerContainer = _.getData(target, '__listeners__'),
        arResults = [],
        listeners,
        eventNamespace = '',
        i, tmpParts;
        
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([listeners, _.isString(target)], arguments));
    }
        
    if(type === null || type === undefined){
      type = '*';
    }
    else{
      //see if there was a namespace included in the event type
      tmpParts = type.split('.');
      if(tmpParts.length>1){
        eventNamespace = tmpParts[0];
        type = tmpParts[1];
      }
    }
    
    if(type == '*'){
      for(var key in listenerContainer){
        if(_hasOwnProperty.call(listenerContainer, key)){
          //arResults = arResults.concat(_events.listeners(target, eventNamespace ? eventNamespace + '.' + key : key, fn));
          _push.apply(arResults, listeners(target, eventNamespace ? eventNamespace + '.' + key : key, fn));
        }
      }
      return arResults;
    }
        
    if(listenerContainer && _.isArray(listeners = listenerContainer[type]) && (i = listeners.length)){
      while(i--){
        if((!fn || listeners[i].innerFn === fn) && _events.namespaceMatch(eventNamespace, listeners[i].namespace)){
          arResults.push(listeners[i].innerFn);
          callback && callback(i, listeners, eventNamespace, type);
        }
      }
    }
    return arResults;
  },
 
  latch: function latch(target, type){
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([latch, _.isString(target)], arguments));
    }
    var obj = _.getData(target, '__listeners__') || _.setData(target, '__listeners__', {});
    var listeners = !_.isArray(obj[type]) ? (obj[type] = []) : obj[type];
    //if the element has already been assigned as a "one time event" for this event type
    //don't overwrite the values already present
    if(listeners.__latchEvent__){ return 0; }
    
    //set a flag so that we can identify this element+event as a "one time" and mark it as "not yet fired"
    listeners.__latchEvent__ = false;
    //add an handler that marks the object+event as fired and preserves the event object
    _events.listenOnce(target, type, function(e){ listeners.__latchEvent__ = e; });
    return 1;
  },
  
  unlatch: function unlatch(target, type){
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([unlatch, _.isString(target)], arguments));
    }
    var obj = _.getData(target, '__listeners__');
    !_.isArray(obj[type]) && (obj[type].__latchEvent__ = undefined);
    //_.setData(target, '__latchEvent__' + type, undefined);
    return 1;
  },
  
  
  isLatch: function isLatch(target, type){
    var x = _events.latchClosed(target, type);
    //if the element has already been assigned as a "trap event" for this event type 
    return !!(x === false || x);
  },
  
  
  //can return undefined, false, or an event object
  latchClosed: function latchClosed(target, type){
    var obj = _.getData(target, '__listeners__');
    if(obj && _.isArray(obj[type])){
      return obj[type].__latchEvent__;
    }
  },
    
  
  /***************************************************************/
  //setOneTimeEvent
  //flags an event on an object as a "one time event"
  relatch: function relatch(target, type){
    if(_.isString(target) || (_.isString(type) && type.indexOf(' ') > -1) || _.isArray(type)){
      return _events._demux.apply(this, _.toArray([relatch, _.isString(target)], arguments));
    }
    var e = _events.latchClosed(target, type);
    //is one, but hasn't fired yet so it doesn't need to be reset 
    if(e === false){ return 0; }
    //if it's already been "closed", unlatch it
    e && _unlatch(target, type);
    //re-set up the trap event
    _latch(target, type);
    return 1;
  },
  
  
  namespaceMatch: function namespaceMatch(eventNS, listenerNS){
    //console.log(eventNS, listenerNS);
    if(!listenerNS || !eventNS || eventNS == '*' || listenerNS == '*' || eventNS == listenerNS){ return true; }
    eventNS = (eventNS + '').split('.');
    listenerNS = (listenerNS + '').split('.');
    var l = eventNS.length;
    while(l--){
      if(eventNS[l] !== listenerNS[l]){
        return false;
      }
    }
    return true;
  },
  
  /***************************************************************/
  //Modified from an original posted April 1st, 2009 by kangax
  //additional functionality from diego perini
  //http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
  //this method has fairly decent accuracy in ie8 and under but has a lot of issues in other browsers. False positives and negatives.
  supported: function supported(eventName, el){
    var EVENT_TAGNAMES = {'select':'input', 'change':'input', 'submit':'form', 'reset':'form', 'error':'img', 'load':'img', 'abort':'img'};
    //plain objects should return false;
    if(typeof el == 'object' && !el.nodeType && el != window){
      return false;
    }
      
    //if an element wasn't passed in, create an appropriate one for the event type
    el = el || document.createElement(EVENT_TAGNAMES[eventName] || "div");
    
    //check if the event name exists as a property on the element or if the event type is enumerated in the window.Event object
    var isSupported = "on" + eventName in el ||
        "on" + eventName.toLowerCase() in el ||
        top.Event &&
        typeof top.Event == "object" &&
        eventName.toUpperCase() in top.Event;
  
    if(!isSupported){
      eventName = "on" + eventName;
      if(!el.setAttribute && (el == window || el == document)){
        el = document.createElement("div");
      }
      if(el.setAttribute && el.removeAttribute){
        el.setAttribute(eventName, "");
        isSupported = typeof el[eventName] == "function";
        if(typeof el[eventName] != "undefined"){
          try{
            //el[eventName] = void(0); //stops JSLint from parsing any further
            el[eventName] = undefined;
          }
          catch(e){}
        }
        el.removeAttribute(eventName);
      }
    }
    el = null;
    return !!isSupported; //!! ensures "undefined" is not passed back 
  },
  
  //this object contains the events emulated by DDP for browsers that don't support them
  emulate: {
    //emulate the IE mouseeenter event for FF/Opera
    "mouseenter":{
      "attachToEvent": "mouseover",
      "prerequisiteEvents": "mouseleave",
      "fn": function(e){
        //if "relatedTarget"(FF) or "fromElement"(Opera) is not a child of the original event target (this)
        if(!_dom.isChild(e.relatedTarget || e.fromElement, this) && !_.getData(this, '__mouseEntered__')){
          //sorry, adding an expando. memory leakage should be minimal with the boolean value
          _.setData(this, '__mouseEntered__', true);
          //clone the browser generated event object (this preserves mouse coordinates, originating time, etc..)
          //set the bubbles property to false (when passed to the fireEvent function, this will stop the fired event from bubbling)
          //(which we want because we're trying to mimic the IE 'mouseenter' behaviour)
          //fire the mouseleave event manually (using the cloned event object as a parameter)
          return _events.fire(this, 'mouseenter', _.extend({}, e, {bubbles: false, nativeEvent: e})).returnValue;
        }
      }
    },
    
    //emulate the IE mouseeleave event for FF/Opera
    "mouseleave":{
      "attachToEvent": "mouseout",
      "prerequisiteEvents": "mouseenter",
      "fn": function(e){
        //if "relatedTarget"(FF) or "toElement"(Opera) is not a child of the original event target (this) AND "relatedTarget" is not the original target
        if(!_dom.isChild(e.relatedTarget || e.toElement, this) && e.relatedTarget != this){
          //delete the expando.
          _.setData(this, '__mouseEntered__', undefined);
          //clone the browser generated event object (this preserves mouse coordinates, originating time, etc..)
          //set the bubbles property to false (when passed to the fireEvent function, this will stop the fired event from bubbling)
          //(which we want because we're trying to mimic the IE 'mouseleave' behaviour)
          //fire the mouseleave event manually (using the cloned event object as a parameter)
          return _events.fire(this, 'mouseleave', _.extend({}, e, {bubbles: false, nativeEvent: e})).returnValue;
        }
      }
    },
    
    //emulate the mozilla/w3c event DOMMouseScroll on ie and opera
    "DOMMouseScroll":{
      "attachToEvent": "mousewheel",
      "fn": function(e){
        //fire the event so that it looks like it came from the event type we're emulating
        //return the returnValue (in case IE wants to prevent the default action)
        return _events.fire(this, 'DOMMouseScroll', e).returnValue;
      }
    },
    
    //emulate a new type of event which is fired when the enter key is pressed on an element (e.g. <input>)
    "enterkeypress":{
      "attachToEvent": "keypress",
      "fn": function(e){
        //using the convertor for the "key" property (from the CruxEvent object), figure out the code of the key pressed
        if(_events.Event.prototype.converters.key(e) == 13){
          //clone the browser generated event object (preserves mouse coordinates, originating time, etc..)
          //fire the enterkey event manually (using the cloned event object as a parameter)
          return _events.fire(this, 'enterkeypress', _.extend({}, e, {bubbles: false, nativeEvent: e})).returnValue;
        }
      }
    },
    //emulate a new type of event which is fired when the enter key is pressed on an element (e.g. <input>)
    "focusin":{
      "attachToEvent": "DOMFocusIn",
      "fn": function(e){
        //clone the browser generated event object (preserves mouse coordinates, originating time, etc..)
        //fire the emulated event manually (using the cloned event object as a parameter)
        return _events.fire(this, 'focusin', _.extend({}, e, {bubbles: false, nativeEvent: e})).returnValue;
      }
    }
    /*
    "inview":{
      "attachToEvent": "scroll resize load",
      "attachToElement": window,
      "isLatch": true,
      "fn": function(objWindowEvent){
        var et = _events.Event.prototype.target(objWindowEvent);
        if(et != window && et != document && et != document.documentElement && et !== null)
          return;
        if(_events.trapFired(this, 'inview')){
          return;
        }
        var bg = _dom.geometry();
        var ep = _dom.position(this, null, true);
        
        if(bg.viewportHeight + bg.verticalScroll >= ep.y &&
           bg.verticalScroll <= ep.y &&
           bg.viewportWidth + bg.horizontalScroll >= ep.x &&
           bg.horizontalScroll <= ep.x){
          
          //clone the browser generated event object (preserves mouse coordinates, originating time, etc..)
          var objEventProperties = _.clone(objWindowEvent);
          objEventProperties.bubbles = false;
          
          //fire the inview event manually (using the cloned event object as a parameter)
          //Also, the 5th argument tells the function to return the event object created during the firing process 
          var objReturnEvent = _events.fire(this, 'inview', objEventProperties, false, true);
          
          if(objReturnEvent.returnValue === false){
            //TODO: fix line below
            //preventEventDefault(objKeypressEvent);
          }
          if(objReturnEvent.cancelBubble){
            //TODO: fix line below
            //stopEventPropagation(objKeypressEvent);
          }
          return objReturnEvent.returnValue;
        }
      }
    },
    "pagehide":{
      "attachToEvent": "unload",
      "fn": function(objUnloadEvent){
        //
        if(objUnloadEvent.persisted){
          //clone the browser generated event object (preserves mouse coordinates, originating time, etc..)
          var objEventProperties = cloneObject(objUnloadEvent, true);
          objEventProperties.bubbles = false;
          //fire the enterkey event manually (using the cloned event object as a parameter)
          //Also, the 5th argument tells the function to return the event object created during the firing process 
          var objReturnEvent = fireEvent(this, 'pagehide', objEventProperties, false, true);
          
          if(objReturnEvent.returnValue === false){
            preventEventDefault(objKeypressEvent);
          }
          if(objReturnEvent.cancelBubble){
            stopEventPropagation(objKeypressEvent);
          }
          return objReturnEvent.returnValue;
        }
      }
    }
    */
  },
  
  
  modules : ['HTMLEvents', 'UIEvents', 'MouseEvents', 'MutationEvents'],
  
  typeHash : {
    //HTMLEvents
    'abort': 0,
    'blur': 0,
    'change': 0,
    'error': 0,
    'focus': 0,
    'load': 0,
    'reset': 0,
    'resize': 0,
    'scroll': 0,
    'select': 0,
    'submit': 0,
    'unload': 0,
    'beforeunload': 0,
    
    //UIEvents
    'DOMActivate': 1,
    'DOMFocusIn': 1,
    'DOMFocusOut': 1,
    'keydown': 1,
    'keypress': 1,
    'keyup': 1,
    
    //MouseEvents
    'click': 2,
    'dblclick': 2,
    'mousedown': 2,
    'mousemove': 2,
    'mouseout': 2,
    'mouseover': 2,
    'mouseup': 2,
    'mouseenter': 2, //ie only
    'mouseleave': 2, //ie only
    
    //MutationEvents
    'DOMAttrModified': 3,
    'DOMNodeInserted': 3,
    'DOMNodeRemoved': 3,
    'DOMCharacterDataModified': 3,
    'DOMNodeInsertedIntoDocument': 3,
    'DOMNodeRemovedFromDocument': 3,
    'DOMSubtreeModified': 3
  },
  
  //the function that will be called when the actual event is fired.
  _executeListeners: function _executeListeners(evt){
    var objEvent = evt || window.event,
        elDocEl = document.documentElement,
        target = (objEvent && objEvent.currentTarget) || this,
        obj = _.getData(target, '__listeners__'),
        fnTmp;
  
    //if the element has a listener container
    if(obj){
      //take a copy of the handlers that were effective at the time the event was fired
      var listeners = _.toArray(obj[objEvent.type]);
      //execute the listeners in the order they were added
      for(var i=0, l=listeners.length; i<l; i++){
        _events.BEEP(listeners[i], [objEvent], target);
      }
    }
    
    //return the event return value
    return objEvent.returnValue;
  },
  
  
  
  /***************************************************************/
  //internal function for creating an event object, cross-browser wise
  _createBrowserEventObject: function _createBrowserEventObject(type, objEventProperties){
    var objEvent, //our new event object
        ep = objEventProperties || {},
        //detect if the event properties object supports the hasOwnProperty method
        supportsHOP = !!ep.hasOwnProperty,
        //if the objEventProperties object was passed and contains a "cancelable" property which is false, then be false, otherwise true. 
        blnCancelable = ep.cancelable !== false,
        blnBubbles    = ep.bubbles    !== false;
    
    //w3c standard browsers
    if(document.createEvent){
      //try to detect the events module that the browser wants us to use for this event type
      ep.eventModule = _hasOwnProperty.call(_events.typeHash, type) ? _events.modules[_events.typeHash[type]] : crux.detected.customEventsModule;
      objEvent = document.createEvent(ep.eventModule); //create an event object using the proper event module (for FF anyway..)
      
      //use the appropriate event initializer according to the event module and
      //whether or not the browser has implemented the initializer method
      //if it's a mouse event
      if(ep.eventModule == 'MouseEvents' && objEvent.initMouseEvent){
        //use the mouse event initializer
        objEvent.initMouseEvent(
          type, blnBubbles, blnCancelable, ep.view || window,
          ep.detail || null, ep.screenX || 0, ep.screenY || 0, ep.clientX || 0, ep.clientY || 0,
          ep.ctrlKey || 0, ep.altKey || 0, ep.shiftKey || 0, ep.metaKey || 0, ep.button || 0, ep.relatedTarget || null
        );
      }
      else if(ep.eventModule == 'UIEvents' && objEvent.initUIEvent){
        objEvent.initUIEvent(type, blnBubbles, blnCancelable, ep.view || window, ep.detail || null);
      }
      else if(ep.eventModule == 'KeyboardEvent' && objEvent.initKeyEvent){
       event.initKeyEvent(type, blnBubbles, blnCancelable, ep.view || window, ep.ctrlKey, 
                          ep.altKey, ep.shiftKey, ep.metaKey, ep.keyCode, ep.charCode);
      }
      //there may be issues with events from the MutationEvents Module. FF documentation is unclear on arguments
      //to the initMutationEvent method and in the w3c spec DOM Mutation events have been deprecated in their current
      //form due to performance issues. 
      else if(ep.eventModule == 'MutationEvents' && objEvent.initMutationEvent){
        objEvent.initMutationEvent(type, blnBubbles, blnCancelable, ep.relatedNode, 
                                   ep.prevValue, ep.newValue, ep.attrName, ep.attrChange);
      }
      else if(ep.eventModule == 'CustomEvent' && objEvent.initCustomEvent){
        objEvent.initCustomEvent(type, blnBubbles, blnCancelable, ep.detail);
      }
      else{
        objEvent.initEvent(type, blnBubbles, blnCancelable);
      }
    }
    //the IE Event Model
    else if(document.createEventObject){
      objEvent = document.createEventObject(); //create an event object
      objEvent.type = type;            //set the proper event type
      objEvent.cancelable = blnCancelable;     //set the cancelable property of the event object
      objEvent.bubbles = blnBubbles;           //set the bubbles property of the event object
    }
    
    if(objEventProperties){
      //iterate through the object's properties (no particular order)
      for(var key in ep){
        if( key != 'type' && key != 'cancelable'&& key != 'bubbles' && (!supportsHOP || ep.hasOwnProperty(key)) ){
          try{
            //i don't like doing this. it's unreliable to count on the event object allowing us to write to a property
            objEvent[key] = ep[key]; //set the event object's property from the passed object's
          }
          catch(e){
            //try{ console.log('native event object didn\'t like us writing to the "' + key + '" property'); } catch(e){}
          }
        }
      }
    }
    
    return objEvent;
  },
  
  
  //Browser Encapsulated Event Procedure
  //executes a function within the context of a browser event.
  //provides the ability to stop errors from stopping all handlers from failing 
  BEEP: (function(){
    var el = document.documentElement,
        type = 'cruxBEEPEvent',
        opc = "onpropertychange",
        //event object, function to encapsulate, this, arguments, return value
        w3cEvent, f, t, a, r;
    //some fuctionality for allowing custom events to be executed within an actual browser event listener
    //(allows for a less tragic result when errors are encountered within the event handlers)
    if(el){
      //w3c
      if(el.addEventListener){
        //add the w3c event listsner for a custom event (cruxBEEPEvent)
        el.addEventListener(type, function(objEvent){ r = undefined; if(f){ r = f.apply(t, a);} }, false);
        
        return function BEEP(fn, args, ths){
          f = fn;
          t = ths || null;
          a = args;
          r = undefined;
          //re-use the previous browser event object, if it exists
          w3cEvent = w3cEvent || _events._createBrowserEventObject(type, {"cancelable": false, "bubbles": false});
          //firing the DDPAERMEvent on the document element (usually <HTML>), executes "currentHandler" within a browser event
          //which provides the ability to show errors but keep them from breaking the rest of the framework
          el.dispatchEvent(w3cEvent);
          return r;
        };
      }
      //ie<9
      else if(el.attachEvent && el.detachEvent){
        //add a listener (below) for the onpropertychange event
        el.attachEvent(opc, testEvent);
        //if the browser supports the event, the "fired" flag is set
        function testEvent(){ testEvent.fired = true; }
        //changing the "cruxBEEPEvent" property of the document element should trigger the onpropertychange event (if it's supported)
        el[type] = 1;
        //detach the test listener, so it isn't repeatedly executed
        el.detachEvent(opc, testEvent);
        //if the browser supports the onproprtychange event
        if(testEvent.fired){
          //add the listener that will always exist and execute the passed in function
          //(in the listener, check that it was the "cruxBEEPEvent" property that was changed and execute the listener, if there is one)
          el.attachEvent(opc, function(){ (event.propertyName === type) && f && (r = f.apply(t, a)); });
          //return a function that will set the propr local vars and trigger the browser event
          return function BEEP(fn, args, ths){
            f = fn;
            t = ths || null;
            a = args;
            r = undefined;
            //this fires the IE "onpropertychange" event on the documentElement (flips the value between 1 and -1)
            //which executes the currentHandler from within an actual browser event
            el[type] *= -1;
            return r;
          };
        }
      }
    }
    //no support for encapsulating execution within a browser event
    //just flat out execute it
    return function BEEP(fn, args, ths){ return fn.apply(ths || null, args); };
  })(),
  
  
  //TODO: determin if regular objects with handlers will have their events cloned properly
  //if so, move this method into the crux.dom namespace
  cloneListeners: function cloneListeners(source, dest, deep){
    var v = _.clone(_.getData(source, '__listeners__'), 2),
        sc = source.children,
        dc = dest.children;
        
    if(deep && sc && dc){
      var i = sc.length;
      //make sure the elements have the same number of children
      if(i == dc.length){
        while(i-- && sc[i] && cd[i]){
          cloneListeners(sc[i], cd[i], true);
        }
      }
    }
    if(_.isElement(dest, true) || dest == window){
      for(var key in v){
        if(_hasOwnProperty.call(v, key)){
          v[key].__eventModel__ = null;
          //set up each event type
          _.listen(dest, key, function(){});
        }
      }
    }
    //this will overwrite the listeners added above but maintain the main trigger DOM listener
    return _.setData(dest, '__listeners__', v);
  },
  
  
  Event : (function (){
    function CruxEvent(obj){
      //this.nativeEvent = {};
      this._defaultPrevented = false;
      obj && this.normalize(obj);
    }
    CruxEvent.prototype = {
      normalize : function(obj){
        var c = this.converters;
        obj = obj ? (this.nativeEvent = obj) : this.nativeEvent;
        for(var k in c){ _hasOwnProperty.call(c, k) && (this[k] = (c[k] === true ? obj[k] : c[k](obj, this))); }
        this.normalized = true;
        return this;
      },
      toString: function(){
        return '[object CruxEvent]';
      },
      converters: {
        //true indicated direct copy
        currentTarget: true,
        altKey       : true,
        cancelBubble : true,
        button       : true,
        ctrlKey      : true,
        metaKey      : true,
        shiftKey     : true,
        type: function(e, t){ return t.type || e.type; },
        bubbles: function(e){ return !!(e.cancelable !== false); },
        cancelable: function(e){ return !(e.bubbles !== true); },
        target: function(e){
          var t = e.target || e.sourceElement || e.srcElement;
          t && t.nodeType == 3 && t.parentNode && (t = t.parentNode); //safari bug
          return t;
        },
        timeStamp: function(e){
          //Opera < 10 doesn't have a timestamp property on it's event object
          return e.timeStamp || (new Date).getTime();
        },
        detail: function(e){
          var detail = e.detail || 0;
          //['click', 'dblclick', 'mousedown', 'mouseup']
          //the detail property indicates how many times the mouse has been clicked in the same location
          if(['mousescroll', 'mousewheel'].indexOf(e.type) + 1){
            // IE/Opera
            if(!detail && e.wheelDelta){
              //wheelDelta gives us 120 or -120. this calc gives us 3 or -3 to bring the value in sync with the mozilla/w3c value.
              detail = e.wheelDelta/120*3;
              //if it's IE (i realize saying "not opera" isn't the same as "is IE", but for all intents and purposes this will have to do.)
              if(!window.opera){
                detail *= -1;
              }
            }
          }
          return detail;
        },
        key: function(e){
          return e.charCode || e.which || e.keyCode || false; // gh - 31-dec-2010
        },
        x: function(e){ return (e.pageX != null || e.pageY != null) ? e.pageX : (e.clientX + document.body.scrollLeft - document.body.clientLeft); },
        y: function(e){ return (e.pageX != null || e.pageY != null) ? e.pageY : (e.clientY + document.body.scrollTop  - document.body.clientTop); },
        related: function(e){
          //TODO: fix this... don't think the whole to/from logic works.
          return e.relatedTarget || e.fromElement || e.toElement;
        }
      },
      prevent : function(){
        var obj = this.nativeEvent;
        obj.preventDefault && obj.preventDefault();
        obj.returnValue = false;
      },
      prevented: function(){
        var obj = this.nativeEvent;
        return !obj.returnValue;
      },
      stop: function(){
        var obj = this.nativeEvent;
        if(obj.cancelable){
          obj.stopPropagation && obj.stopPropagation();
          obj.cancelBubble = true;
          return true;
        }
      },
      cancel: function(){ this.prevent(); this.stop(); }
    };
    return CruxEvent;
  })()
});




_.listen    = _events.listen;
_.unlisten  = _events.unlisten;
_.listeners = _events.listeners;
_.fire      = _events.fire;


//end events module
})();




//-----------------------------------------------------------------------------------------------------
// String Module
//-----------------------------------------------------------------------------------------------------
_.extend(_str, {
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
  
  pad: function pad(str, length, padWith, onRight){
    padWith = padWith || '0';
    if((length = Math.max(length, 0)) == 0){ return ''; }
    if(str.length >= length){ return onRight ? _.str.right(str, length) : _.str.left(str, length); }
    //generate the repeated string to pad the passed one with
    //(may be larger than the length required if "padWith" contains multiple characters)
    var s = _.str.repeat(padWith, Math.max(Math.ceil(length/padWith.length) - str.length, 0));
    return onRight ? str + _.str.right(s, length-str.length) : _.str.left(s, length-str.length) + str;
  },
  
  //check and see if the built-in String.prototype.trim exists
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
});





//---------------------------------------------------------------
// DOM Module
//---------------------------------------------------------------

function _dom(selector, context){
  return new _dom.DOMSelection(selector, context, arguments[2]);
}

(function(){ //encapulate

_.extend(_.dom = _dom, {
  //we can't assign this until Sizzle is instanciated at the end of this file 
  selectorEngine: null, //by default will be Sizzle()
  selectorEngine_matches: null, //by default will be Sizzle.matches()
  
  //***************************************************************
  //childOf
  //returns true if all elements in the collection are DOM descendents of the supplied dom element, otherwise returns false.
  childOf: function childOf(elChild, elParent, blnBridgeIframes){
    
    if(!_.isElement(elChild) || !_.isElement(elParent, true)){
      return null;
    }
    //if the browser supports the "contains" method (basically everyone but Firefox)
    if(elParent.contains){
      return elParent.contains(elChild);
    }
    //Firefox
    if(elChild.compareDocumentPosition){
      return !!(elParent.compareDocumentPosition(elChild) & 16); //single & is the bitwise AND operator, not a typo (compareDocumentPosition returns a bitmask).
    }
    //fallback to calculating it ourselves
    return (_dom.climb(elChild, function(nodes, elParent){ if(this==elParent) return true; }, [elParent], blnBridgeIframes) === true);
  },
  
  //***************************************************************
  //cloneElement
  //
  cloneElement: function(el, deep, listeners){
    var e = el.cloneNode(deep || false);
    //TODO: make element cloning actually work
    //apply all the fixes to compensate for browser deficiencies (IE, i'm looking at you)
    //copy event handlers to the new element (if specified) 
    listeners && _.cloneListeners(el, e, deep);
    return e;
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
  //TODO: apparently is broken in FF 12
  getStyle: function getStyle(el, str){
    if(str=='opacity'){ return _dom.getOpacity(el); }
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
    if(_dom.getClass(el) !== str){
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
          if(!re.test(strClassName = _.str.trim(_dom.getClass(el)) || '')){
            strClassName += (strClassName ? ' ' : '') + str;
          }
          //put the modified/filtered class string back in the element 
          _dom.setClass(el, strClassName);
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
        else if(strClass = _dom.getClass(el)){
          re = re || cache[str] || (cache[str] = new RegExp('\\b' + str + '\\b', 'g'));
          //if the modified string is different than the original
          if(strClass != (strClass = _.str.trim(strClass.replace(re, '')))){
            //update the element with the new class name string
            _dom.setClass(el, strClass);
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
      else if(strClass = _dom.getClass(el)){
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
    var el, key, attrs = '';
    /*
    if(!elAppendTo){
      setData(el, '_ddpDetached', true); //serious thought should be put into whether this line should be left in...
    }
    */
    //fix for an ie issue where, unless the element is created with a "name" attribute in
    //the funky ie syntax, radio groups dont' work properly
    if(_detected.IECreateElement){
      attrs = '';
      ['type', 'name', 'value', 'checked', 'defaultChecked'].forEach(function(str){
        if(str in objAttributes && _hasOwnProperty.call(objAttributes, str)){
          attrs += ' ' + str + '="' + objAttributes[str] + '"';
        }
      });
      el = _ce('<' + tagName + '' + attrs + '>');
    }
    else{
      el = _ce(tagName);
    }
    for(key in objAttributes){
      if(_hasOwnProperty.call(objAttributes, key)){
        el.setAttribute(key, objAttributes[key]);
      }
    }
    if(_hasOwnProperty.call(objAttributes, 'className') || _hasOwnProperty.call(objAttributes, 'classname')){
      _dom.addClass(el, objAttributes.className || objAttributes.classname);
    }
    for(key in objEvents){
      if(_hasOwnProperty.call(objEvent, key)){
        _events.listen(el, key, objEvent[key]);
      }
    }
    //TODO: add the appendTo functionality when we've figured out how that will work
    /*
    if(elAppendTo){
      appendElement(el, elAppendTo);
    }
    */
    return el;
  },
  
  geometry: function(){
    //these won't necessarily contain valid references, but it
    //will prevent a bunch of scope chain lookups further in.
    var w = window;
    var documentElement = document.documentElement;
    var body = document.body;
    
    //set up the caching flag listener
    _events.listen(window, 'scroll resize', function(o){ _cache.geometryChanged = true; }, true);
    
    var docGeometry = function(){
      if(w.innerHeight && w.scrollMaxY){ // Firefox
        return (docGeometry = function(){
          return {
            width : w.innerWidth + w.scrollMaxX,
            height: w.innerHeight + w.scrollMaxY
          };
        })();
      }
      else if(body && body.scrollHeight > body.offsetHeight){ // all but Explorer Mac
        return (docGeometry = function(){
          return {
            width : body.scrollWidth,
            height: body.scrollHeight
          };
        })();
      }
      else if(body){// works in Explorer 6 Strict, Mozilla (not FF) and Safari
        return (docGeometry = function(){
          return {
            width : body.offsetWidth + body.offsetLeft,
            height: body.offsetHeight + body.offsetTop
          };
        })();
      }
      return {width: 0, height: 0};
    };
    
    if(typeof w.innerWidth == 'number'){
      //Non-IE
      return (_dom.geometry = function geometry(){
        var dg = docGeometry();
        var ch = _cache.geometryChanged;
        _cache.geometryChanged = false;
        return ((!ch && _cache.geometry) ? _cache.geometry : _cache.geometry = {
          viewportWidth   : w.innerWidth,
          viewportHeight  : w.innerHeight,
          horizontalScroll: w.pageXOffset,
          verticalScroll  : w.pageYOffset,
          documentWidth   : dg.width,
          documentHeight  : dg.height
        });
      })();
    }
    else if(documentElement && (documentElement.clientWidth || documentElement.clientHeight)){
      //IE 6+ in 'standards compliant mode'
      return (_dom.geometry = function geometry(){
        var dg = docGeometry();
        var ch = _cache.geometryChanged;
        _cache.geometryChanged = false;
        return ((!ch && _cache.geometry) ? _cache.geometry : _cache.geometry = {
          viewportWidth   : documentElement.clientWidth,
          viewportHeight  : documentElement.clientHeight,
          horizontalScroll: documentElement.scrollLeft,
          verticalScroll  : documentElement.scrollTop,
          documentWidth   : dg.width,
          documentHeight  : dg.height
        });
      })();
    }
    else if(body && ( body.clientWidth || body.clientHeight)){
      //IE 4 compatible
      return (_dom.geometry = function geometry(){
        var dg = docGeometry();
        var ch = _cache.geometryChanged;
        _cache.geometryChanged = false;
        return ((!ch && _cache.geometry) ? _cache.geometry : _cache.geometry = {
          viewportWidth   : body.clientWidth,
          viewportHeight  : body.clientHeight,
          horizontalScroll: body.scrollLeft,
          verticalScroll  : body.scrollTop,
          documentWidth   : dg.width,
          documentHeight  : dg.height
        });
      })();
    }
    return {viewportWidth: 0, viewportHeight: 0, horizontalScroll: 0, verticalScroll: 0, documentWidth: 0, documentHeight: 0};
  },
  
  
  
  /***************************************************************/
  //getRadioValue
  //gets the value of a radio group by it's name
  //arguments:
  //strNameOrRef  - string or element reference   - the name of a radio group or one of the elements in the group
  //elContainer   - element reference *optional*  - an element to confine the search to
  //returns the value of the selected radio button or null if there are none selected
  getRadioValue: function getRadioValue(strNameOrRef, elContainer){
    //if a container was specified, only look within it, otherwise look at the whole document
    if(!elContainer)
      elContainer = document;
    //if the arg was an element, use it's "name" property, otherwise just use the arg value
    var strRadioName = (!_.isString(strNameOrRef) && typeof strNameOrRef == 'object') ? strNameOrRef.name : strNameOrRef;
    //get the elements with the supplied name within the container (or the whole document if the element doesn't support the getElementsByName method)
    var objInputs = (elContainer.getElementsByName) ? elContainer.getElementsByName(strRadioName) : document.getElementsByName(strRadioName);
    //step through the elements and pick the first one that's checked
    for(var i=0, l=objInputs.length; i<l; i++)
      //if one of the elements is checked and it's within the container
      if(objInputs[i].checked && (elContainer == document || _.dom.childOf(objInputs[i], elContainer)))
        //return it's value
        return objInputs[i].value;
    
    //if none were selected, return null
    return null;
  },
  
  
  
  /***************************************************************/
  //setRadioValue
  //sets the value of a radio group by it's name
  //arguments:
  //strNameOrRef  - string or element reference   - the name of a radio group or one of the elements in the group
  //strValue      - the value of the input to find and check
  //elContainer   - element reference *optional*  - an element to confine the search to
  //returns true if the value was found within the group and set, false if it wasn't found
  setRadioValue: function setRadioValue(strNameOrRef, strValue, elContainer){
    //if a container was specified, only look within it, otherwise look at the whole document
    if(!elContainer)
      elContainer = document;
    var blnSuccess = false;
    //if the arg was an element, use it's "name" property, otherwise just use the arg value
    var strRadioName = (!_.isString(strNameOrRef) && typeof strNameOrRef == 'object') ? strNameOrRef.name : strNameOrRef;
    //get the elements with the supplied name within the container (or the whole document if the element doesn't support the getElementsByName method)
    var objInputs = (elContainer.getElementsByName) ? elContainer.getElementsByName(strRadioName) : document.getElementsByName(strRadioName);
    //step through the elements and find the one matching the specified value
    for(var i=0, l=objInputs.length; i<l; i++)
      //if the value of the input matched the value specified
      if(objInputs[i].value == strValue){
        //set the checked attribute
        objInputs[i].setAttribute('checked', 'checked');
        blnSuccess = true;
      }
    
    return blnSuccess;
  },
  
  
  clearRadioGroup: function clearRadioGroup(strNameOrRef, elContainer){
    //if a container was specified, only look within it, otherwise look at the whole document
    if(!elContainer)
      elContainer = document;
    //if the arg was an element, use it's "name" property, otherwise just use the arg value
    var strRadioName = (!_.isString(strNameOrRef) && typeof strNameOrRef == 'object') ? strNameOrRef.name : strNameOrRef;
    //get the elements with the supplied name within the container (or the whole document if the element doesn't support the getElementsByName method)
    var objInputs = (elContainer.getElementsByName) ? elContainer.getElementsByName(strRadioName) : document.getElementsByName(strRadioName);
    //step through the elements and pick the first one that's checked
    for(var i=0, l=objInputs.length; i<l; i++){
      //if one of the elements is checked and it's within the container
      if(objInputs[i].checked != false){
        //clear the checked box
        objInputs[i].checked = false;
      }
    }
    return;
  },
  
  
  
  /***************************************************************/
  //accepts a form element and iterates through it's child elements looking for elements with a name and value property
  //returns a string of name value pairs eg. "varname=varvalue&vartwo=vartwovalue" 
  parseForm: function parseForm(elForm, blnSkipBlankFields, blnReturnAnObject){
  
    //make sure we're dealing with an HTML element (probably a form but doesn't have to be)
    if(!elForm || !elForm.getElementsByTagName)
      throw new Error('ddp.forms.parseForm - Error: elForm is not an element.')
    
    //create an object to hold our properties
    var objReturn = {};
    //get all child elements of the form
    var arElements = elForm.getElementsByTagName('*');
    //iterate throught the elements
    for(var i=0, l=arElements.length; i<l; i++){
      //if the element has a name property which isn't blank and a value property AND we don't already have a return property by that name
      if(typeof arElements[i].name != 'undefined' && arElements[i].name != '' && typeof arElements[i].value != 'undefined'){
        
        //default to the element's value
        var elementValue = arElements[i].value;
        
        //if it's an <input> element and it has a "type" property
        if(arElements[i].tagName.toLowerCase() == 'input' && typeof arElements[i].type != 'undefined'){
          //if it's a radio element
          if(arElements[i].type.toLowerCase() == 'radio'){
            //if there is already a record for the radio group by this name
            if(typeof objReturn[arElements[i].name] != 'undefined')
              //skip the rest of this iteration and move to the next array index
              continue;
            //get the radio group's return value (only radio's with the specified name that are within "elForm")
            elementValue = getRadioValue(arElements[i].name, elForm);
            if(elementValue === null) //if the function returned null
              elementValue = ''; //then set the value for the serialization to blank
          }
          else if(arElements[i].type.toLowerCase() == 'checkbox'){
            if(!arElements[i].checked)
              elementValue = '';
          }
          //if it's a file input,
          else if(arElements[i].type.toLowerCase() == 'file'){
            //then tell them not to do it this way...
            elementValue = '"' + arElements[i].name + '" - File inputs can\'t be serialized with ddp.forms.serializeObject. (try ddp.ajax.submitToForm)';
            try{ console.log(elementValue); }catch(e){}
          }
        }
        //if it's a multiple selection <select> input
        else if(arElements[i].tagName.toLowerCase() == 'select' && arElements[i].multiple){
          //get the <select>'s <option>s
          var arOptions = arElements[i].getElementsByTagName('option');
          //make the a new array for return values
          var arSelectedOptions = [];
          //go through the option elements
          for(var j=0, jl=arOptions.length; j<jl; j++){
            if(arOptions[j].selected) //and if they are selected
              arSelectedOptions.push(arOptions[j].value); //add them to the array
          }
              
          if(arSelectedOptions.length == 0) //if there were none selected
            elementValue = ''; //set the value to blank (so it can be not-included)
          else if(arSelectedOptions.length == 1) //if there was only one selected
            elementValue = arSelectedOptions[0]; //uncomplicate things and just make it a single string
          else //otherwise
            elementValue = arSelectedOptions; //just return the new array of values
        }
        
        //if we aren't skipping blank fields,
        if(!(blnSkipBlankFields == true && elementValue == '')){
          //if the property doesn't exist
          if(typeof objReturn[arElements[i].name] == 'undefined')
            //add this property to the object we're building
            objReturn[arElements[i].name] = elementValue;
          else if(ddp.f.isArray(objReturn[arElements[i].name])) //if the property is already an array
            //add this property to the object we're building
            objReturn[arElements[i].name].push(elementValue);
          else //the property exists already but it's not an array
            //make it an array, assign it's first element to be the old property value, and add the new value
            objReturn[arElements[i].name] = [objReturn[arElements[i].name], elementValue];
        }
      }
    }
  
    //serialize the object into a URI encoded string (only "hasOwnProperty" properties will be included)
    return (blnReturnAnObject == true) ? objReturn : ddp.a.serializeObject(objReturn, true);
  },
  
  
  
  //-----------------------------------------------
  //----------------DOM SELECTION------------------
  //-----------------------------------------------
  DOMSelection: (new _.Collection).subclass({
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
      
      selector = _.isArray(selector) || selector instanceof _dom.DOMSelection ? selector : [selector];
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
      var ar = _dom.selectorEngine_matches(selector, this), i = ar.length;
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
      return _dom.selectorEngine(selector, context, ar);
    },
    
    find          : function find(selector){ return new this.constructor(_dom.selectorEngine_matches(this, selector), this.selectionContext); },
    remove        : function remove(){ this.DOMElements().forEach(function(el){ el && el.parentNode && el.parentNode.removeChild(el); }); return this; },
    addClass      : function addClass(str){    return _dom.addClass(this, str);    },
    removeClass   : function removeClass(str){ return _dom.removeClass(this, str); },
    show          : function show(){ this.DOMElements().forEach(function(el){ el.style.display = ''; return this;});     },
    hide          : function hide(){ this.DOMElements().forEach(function(el){ el.style.display = 'none'; return this;}); },
    climb         : function climb(fn){ return this.DOMElements().every(function(el){ return _dom.climb(el, fn); }); },      
    //***************************************************************
    //childrenOf 
    //returns a new DOMCollection of elements that are DOM descendents of the supplied parent element
    childrenOf: function childrenOf(parent, jumpIframes){
      return this.DOMElements().filter(function(el){ return _dom.childOf(el, parent, jumpIframes); });
      //return elements.length ? elements.every(function(el){ return _dom.childOf(el, parent, jumpIframes); }) : false;
    },
    
    debug: function(str){
      try{
        console.log((new Date).getTime() + ': ' + (str || ''));
        this.forEach(function(el){ console.log(el); });
      }
      catch(e){}
      return this;
    }
  })
  
});

})();//end dom module




//-----------------------------------------------------------------------------------------------------
// AJAX Module
//-----------------------------------------------------------------------------------------------------
(function(){
  //if the jsonp callback container doesn't exist yet, create it
  _.getData(window, '__cruxCallbacks__') || _.setData(window, '__cruxCallbacks__', {});
  
  var inProgress = [];
  
  var Request = (new _.Object).subclass({
    className: "Request",
    init: function(params){
      //console.log("request", arguments);
      
      _events.latch(this, 'start complete success failure abort');
      _events.listen(this, 'start', function(e){ inProgress.push(e.target); });
      _events.listen(this, 'complete', function(e){ inProgress.splice(inProgress.indexOf(e.target), 1); });
      
      var defaults = {
        method: 'GET',
        type: "xhr",
        parentNode: _ajax
      };
      for(var key in defaults){
        if(_hasOwnProperty.call(defaults, key)){
          this[key] = (params && params[key] ? params[key] : defaults[key]);
        }
      }
      
    },
    z: function(){}
  });
  
  var XHR = (new Request).subclass({
    "className": "XHR",
    "init": function(){
      console.log("xhr", arguments);
    },
    "execute": function(){},
    "x": "a"
  });
  
  
  var JSONPRequest = (new Request).subclass({
    "className": "JSONPRequest",
    "init": function(){
      console.log("JSONPRequest", arguments);
    },
    "execute": function(){
      //use an underscore as the first character so we can be sure there isn't a number for the first char
      var cid = '_' + _.guid();
      var cb = '__cruxData__.__cruxCallbacks__[' + cid + ']';
      
    },
    "x": "a"
  });
  
  
  var PostMessageRequest = (new Request).subclass({
    "className": "JSONPRequest",
    "init": function(){
      console.log("JSONPRequest", arguments);
    },
    "execute": function(){},
    "x": "a"
  });
  
  
  
  //---------------------------------------------------------------------------
  //if no XMLHTTPRequest function exists, try top polyfill with 
  //a microsoft activeX version.
  //---------------------------------------------------------------------------
  var XMLHttpRequest = window.XMLHttpRequest || function(){
    //TODO: eliminate IE6/7 component. IE8 comes with native support for XMLHTTPRequest
    //create the request (IE)
    if(typeof ActiveXObject != 'undefined'){
      var XMLHTTP_IDS = [
        'Msxml2.XMLHTTP.6.0', //installed with IE7. ships with vista out-of-the-box.
        'MSXML2.XMLHTTP.4.0', //designed to support legacy applications.
        'MSXML2.XMLHTTP.3.0', //installed on all Win2k (sp4) and up Microsoft OSs. Does not support "Xml Schema" (XSD 1.0)
        'MSXML2.XMLHTTP.5.0', //installed with Office 2003 but is off by default in IE7 and causes a "gold bar" to pop up when instanciated in IE7. better than nothing.
        'MSXML2.XMLHTTP',     //really old (no support for abort() method)
        'Microsoft.XMLHTTP'   //really old (no support for abort(), among other things)
      ];
      
      for(var i=0; i<XMLHTTP_IDS.length && !objXHR; i++){
        try{
          var objXHR = new ActiveXObject(XMLHTTP_IDS[i]);
          if(objXHR){
            XMLHttpRequest = function(){ return new ActiveXObject(XMLHTTP_IDS[i]); };
            return objXHR;
          }
        }
        catch(e){}
      }
    }
    throw 'No support for xmlhttprequest';
  };

  
  _.extend(_ajax, {
    request: function(){
      var r = new _ajax.Request;
      r.init.apply(r, arguments);
      return r;
    }
  });
  
  //make available on the root object
  _.request = _ajax.request;
  
})();



//------------------------------------------------------------------------
//    json2.js
//    2011-10-19
//    Public Domain.
//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//    See http://www.JSON.org/js.html
//------------------------------------------------------------------------
var JSON;if(!JSON){JSON={};}
(function(){'use strict';function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());




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
_dom.selectorEngine = Sizzle;
_dom.selectorEngine_matches = Sizzle.matches;

})();

//--------------------------------------------------------------------------------
//--------------------END Sizzle -------------------------------------------------
//--------------------------------------------------------------------------------

//run the routine to check the document ready state and fire the event.
_._checkReady();

})(
    //try to get a reference to the global object, regardless of the scope the code is executed in
    //kangax - http://perfectionkills.com/
    (function(){ return this || (1,eval)('this'); })()
  );