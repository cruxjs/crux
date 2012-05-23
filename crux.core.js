/********************************/
//  Crux Javascript Library
/********************************/

// Greg Houldsworth
// Aaron Murray


(function(window){ //create a private scope

  var version = 0.01,
      undefined,
      document = window.document,
      _memorize = {"elementData": {}},
      _hasOwnProperty = Object.prototype.hasOwnProperty,
      _toString       = Object.prototype.toString,
      _trim     = String.prototype.trim,
      _push     = Array.prototype.push,
      _concat   = Array.prototype.concat,
      _slice    = Array.prototype.slice,
      _splice   = Array.prototype.splice;


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
      Array.prototype.splice.apply(this, crux.toArray([0,0], arguments));
      return this.length;
    }
  }

  var _every    = Array.prototype.every,
      _forEach  = Array.prototype.forEach,
      _filter   = Array.prototype.filter,
      _unshift  = Array.prototype.unshift,
      _indexOf  = Array.prototype.indexOf,
      _lastIndexOf = Array.prototype.lastIndexOf;

  
  //export crux object to the global namespace but keep an internal reference as well
  var crux = {
    "version": version,
    "supports"  : {
      "classRECaching"   : true,
      "stringIndexes"    : "d"[0] == "d", //test if the browser supports accessing characters of a string using this notation: str[3]
      "CSSClassAttribute": (function(){
        //create an element to test which attribute contains the actual CSS class string
        var el = document.createElement('div');
        el.innerHTML = '<p class="crux"></p>';
        var attr = el.children[0].getAttribute('className') == 'crux' ? 'className' : 'class';
        el = undefined; //release the reference to the created div
        return attr;
      })()
    },
    
    //optionally assign a different dom selector engine
    "domSelector": null,
    
    //*****************************************************************************************************
    //*****************************************************************************************************
    "str":{
      "isUpper": function isUpper(str){ return _every.call(str, function(ch){ return (ch.toUpperCase() == ch && ch.toLowerCase() != ch); }); },
      "isLower": function isLower(str){ return _every.call(str, function(ch){ return (ch.toLowerCase() == ch && ch.toUpperCase() != ch); }); },
      "right"  : function right(str, length){ return (str + '').substr(str.length - Math.min(length, str.length)); },
      "left"   : function left(str, length){ return (str + '').substr(0, length); },
      "repeat" : function repeat(str, times){
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
      
      "pad"    : function pad(str, length, padWith, onRight){
      	length = Math.max(length, 0);
      	if(length == 0){ return ''; }
        padWith = padWith || '0';
        str = onRight ? crux.str.right(str, length) : crux.str.left(str, length);
        // work on this calculation to only take enough repeats to cover the length
        var s = crux.str.repeat(padWith, Math.max(Math.ceil(length/padWith.length) - str.length, 0));
        return onRight ? str + crux.str.right(s, length-str.length) : crux.str.left(s, length-str.length) + str;
      },
      
      "trim": _trim ? function(str){ return _trim.call(str); } : function(str){
        str += '';
      	//http://blog.stevenlevithan.com/archives/faster-trim-javascript, trim12
        str = str.replace(/^\s\s*/, '');
        var ws = /\s/, i = str.length;
        while(ws.test(str.charAt(--i))){} //there is nothing within the braces. this is not a typo
        return str.slice(0, i + 1);
      },
      

      "parseUri": parseUri,
      
    },
    
    "guidCounter": 0,
    
    //***************************************************************
    //data type tests
    "isArray"   : function isArray(v){    return _toString.call(v) == '[object Array]';    },
    "isString"  : function isString(v){   return _toString.call(v) == '[object String]';   },
    "isFunction": function isFunction(v){ return _toString.call(v) == '[object Function]'; },
    "isDate"    : function isDate(v){     return _toString.call(v) == '[object Date]';     },
    
    //***************************************************************
    //isElement
    "isElement" : function isElement(v){
      var t;
      //1 = ELEMENT_NODE, 9 = DOCUMENT_NODE
      return !!(v && (t = v.nodeType) && (t == 1 || t == 9));
    },
  
    //***************************************************************
    //isObject
    //tests for plain objects {} which are not strings or arrays or DOMElements or functions (and not null) 
    "isObject": function isObject(v){
      //it's not null, has typeof "object", isn't a string, isn't an array, and isn't a function
      return (v !== null && typeof v == 'object' && !crux.isString(v) && !crux.isArray(v) && !crux.isFunction(v) && !crux.isDate(v) && !crux.isElement(v));
    },
    
    "classes": {},
    
    "subclass": function(parentClass, objAugmentWith, arParentArgs){
      function subClass(){
        //execute the default constructor in the context of our new object
        parentClass.call(this);
        //if the subClass has or inherited an init method, execute it with
        //any arguments passed to this consructor
        if(this.init){
          this.init.apply(this, arguments)
        }
      }
      //subClass.prototype = new parentClass();
      subClass.prototype = crux.newApply(parentClass, arParentArgs)
      this.augment(subClass, objAugmentWith);
      subClass.prototype.constructor = subClass;
      subClass.prototype.parentConstructor = parentClass;
      return subClass;
    },
    
    "newApply": function(fnConstructor, arArguments){
      var s='';
      for(var i=0,l=(arArguments ? arArguments.length : 0); i<l; i++){ s += (i==0 ? '' : ',') + 'a[' + i + ']'; }
      return new (new Function("f", "a", 'return new f(' + s + ');'))(fnConstructor, arArguments);
    },
    
    
    "extend": function extend(objTo, objFrom){
      for(var key in objFrom){
        if(_hasOwnProperty.call(objFrom, key)){
          objTo[key] = objFrom[key];
        }
      }
      return objTo;
    },
    
    
    "augment": function augment(fn, obj){
      crux.extend(fn.prototype, obj);
      return fn;
    },
    
    /***************************************************************/
    //forOwnIn
    //iterates over an object's own properties only
    //e.g.
    //var obj = {"inheritedProperty": true};
    //var obj2 = newObjectFrom(obj);
    //obj2.obj2sProperty = 'greg';
    //ddp.f.forOwnIn(obj2, function(key, value, object){
    //  console.log('the value of property "' + key + '" is: ' + value);
    //});
    //will output only "obj2sProperty is: greg" and NOT "inheritedProperty is: true"
    "forOwnIn": function forOwnIn(obj, fn){
      if(!obj || !fn || !_hasOwnProperty){
        return false;
      }
      for(var key in obj){
        if(_hasOwnProperty.call(obj, key) && fn(key, obj[key], obj) === false){
          return false;
        }
      }
      return true;
    },
    
    "dom": function(){
      return crux.newApply(crux.classes.DOMSelection, arguments);
      //return new crux.classes.DOMSelection(criteria, context);
    },
    
    //***************************************************************
    //merge
    //
    "merge": function(){
      //improve performance by applying the Array.prototype.concat method 
      var obj = arguments[0];
      for(var j=1, jl=arguments.length; j<jl; j++){
        var objToAdd = arguments[j];
        if(objToAdd && objToAdd.length){
          for(var i=0, l=objToAdd.length; i<l; i++){
            _push.call(obj, objToAdd[i]);
          }
        }
      }
      return obj;
    },
    
    
    /***************************************************************/
    //toArray 
    //takes an object with 'length' property and returns an actual array
    //(useful for 'arguments' and objects returned from getElementsByTagName(), etc..)
    "toArray" : (function(){
        try{
          //test if nodelists can be used with the array slice method
          //(IE<9 craps out when you try "slice()"ing a DOMNodeList)
          _slice.call(document.getElementsByTagName('head'), 0);
          return true;
        }
        //if an error occurs trying to use the faster approach
        catch(e){ return false; }
      })() ?
      //this approach won't work on DOM nodelists under ie6 (throws a "Jscript object expected" error) 
      function toArray(obj1, obj2, obj3){
        //iterate over the function's arguments
        for(var ar=[], i=0, l=arguments.length, obj=arguments[0]; i<l; obj=arguments[++i]){
          //and only process arguments that are truthy.. no empty strings, empty arrays, nulls, undefineds, etc.
          obj && (ar = ar.concat(crux.isString(obj) ? obj.split('') : _slice.call(obj, 0)));
        }
        return ar;
      } :
      //the slower fallback makeRealArray function which is assigned if the browser doesn't support the "Array.slice" approach
      function toArray(obj1, obj2, obj3){
        var ar = [], jl;
        for(var i=0, il=arguments.length, obj=arguments[i]; i<il; obj=arguments[++i]){
          //if it's a string
          if(crux.isString(obj)){
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
    "unique": function unique(ar, copy){
      var newAr, tmp, i = ar.length;
      
      //if the copy flag is truthy,
      if(copy){
        //create a new array so we don't affect the original
        newAr = [];
        //iterate through the original array backwards
        while(i--){
          //if the value from the original array is not in the new array
          if(_indexOf.call(newAr, tmp = ar[i]) == -1){
            //tack it to the beginning of the array
            _splice.call(newAr, 0, 0, tmp);
          }
        }
        return newAr;
      }
      //change the original array
      while(i--){
        //if occurs at another index in the array (searched from front)
        if(_indexOf.call(ar, ar[i]) !== i){
          //remove the element at this index (at the back of the array)
          _splice.call(ar, i, 1);
        }
      }
      return ar;
    },
    
    
    
    
    
    "g": "b"
  };
  
  
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  function parseUri(str, doc){
   var relativeTo = (doc && doc.location) ? parseUri(doc.location.href) : (crux.isString(doc) ? parseUri(doc) : null);
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
  
  window['crux'] = crux;
  
  
  
  /***************************************************************/
  //findScriptPath
  //TODO: move findScriptPath() into the gui/windowing module
  //find the absolute path of an included script by it's file name
  function findScriptPath(scriptFileName){
    var ind,
        objParts,
        x;
    console.log(document.currentScript);
    if(document.currentScript && (objParts = crux.str.urlParts(document.currentScript)).file == scriptFileName){
      return objParts.path;
    }
    x = document.getElementsByTagName('script');
        
    scriptFileName = scriptFileName.toLowerCase();
    
    for(var i=0,l=x.length; i<l; i++){
      objParts = urlParts(x[i]);
      if(objParts.file == scriptFileName){
        return objParts.path;
      }
    }
    return null;
  }
  
  

 
  
  crux.extend(crux.dom, {
    //***************************************************************
    //childOf 
    //returns true if all elements in the collection are DOM descendents of the supplied dom element, otherwise returns false.
    "childOf": function childOf(elChild, elParent, blnBridgeIframes){
      //var elChild = this.index(0);
      if(!crux.isElement(elChild) || (!crux.isElement(elParent) && !crux.isDocument(elParent))){
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
      return (crux.dom.climb(elChild, function(nodes, elParent){ if(this==elParent) return true; }, [elParent], blnBridgeIframes) === true);
    },
    
    //***************************************************************
    //climbDOMTree
    //climbs up the DOM tree one node at a time, starting from the supplied element "elStart"
    //with each level, fnEvaluate is executed (with it's "this" value being the currently evaluated node)
    //the first argument passed to fnEvaluate will be an array of the previously evaluated nodes, followed by 
    //any arguments passed in the arArguments array 
    "climb": function climb(el, fn, jumpIframes){
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
    
    //***************************************************************
    "getClass": function getClass(el){ return (el && el.getAttribute && el.getAttribute(crux.supports.CSSClassAttribute)) || ''; },
    "setClass": function setClass(el, str){
      if(!el || !el.setAttribute){
        return false;
      }
      if(_getCSSClass(el) !== str){
        el.setAttribute(crux.supports.CSSClassAttribute, str);
      }
      return str;
    },
    
    /***************************************************************/
    //addClass
    //adds a CSS class to the element's className attribute (if it's not already there)
    //accepts a reference to an element and a string containing the class name
    "addClass": function addClass(elementOrArray, strClassToAdd){
      //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
      var ar = crux.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
          l = ar.length,
          i, el, strClassName, re;
          
      crux.str.trim(strClassToAdd).split(' ').forEach(function(str){
        if(!str){ return; }
        re = null;
        i = l;
        while(i--){
          el = ar[i];
          //see if the element implements the html5 classList interface
          if('classList' in el && el.classList.add){
            //browser implementation takes care of not adding duplicates
            el.classList.add(str);
          }
          //if the element passed is valid and the class isn't already there
          else if(el){
            re = re || new RegExp('\\b' + str + '\\b', 'g');
            //get the current class string and test it with the regular expression
            if(!re.test(strClassName = crux.str.trim(_getCSSClass(el)) || '')){
              strClassName += (strClassName ? ' ' : '') + str;
            }
            //put the modified/filtered class string back in the element 
            _setCSSClass(el, strClassName);
          }
        }
      });
      return elementOrArray;
    },
    
    
    /***************************************************************/
    //removeClass
    //removes a CSS class from the element's class attribute
    //accepts a reference to an element and a string containing the class name
    "removeClass": function removeClass(elementOrArray, classToRemove){
      //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
      var ar = crux.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
          l = ar.length,
          i, el, strClass, re;
      //be sure that the original string doesn't have any leading or trailing whitespace
      crux.str.trim(classToRemove).split(' ').forEach(function(str){
        //don't process blanks
        if(!str){ return; }
        re = null; //clear the regular expression for the last string
        i = l; //reset the counter
        while(i--){
          el = ar[i];
          if(!crux.isElement(el)){
            continue;
          }
          
          //if the element implements the html5 classList interface
          if('classList' in el && el.classList.remove){
            el.classList.remove(str);
          }
          //if the class isn't already empty
          else if(strClass = _getCSSClass(el)){
            re = re || new RegExp('\\b' + str + '\\b', 'g');
            //if the modified string is different than the original
            if(strClass != (strClass = crux.str.trim(strClass.replace(re, '')))){
              //update the element with the new class name string
              _setCSSClass(el, strClass);
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
    "hasClass": function hasClass(elementOrArray, strClassToCheckFor){
      //if an array of elements was passed in, just set ar equal to it, otherwise, make an array with a single element
      var ar = crux.isElement(elementOrArray) ? [elementOrArray] : elementOrArray,
          c = crux.supports.classRECaching ? arguments.callee.cache || (arguments.callee.cache = {}) : {},
          l = ar.length,
          arReturn = [],
          i, el, strClass, re;
          
      strClassToCheckFor = crux.str.trim(strClassToCheckFor);
      
      for(i=0; i<l; i++){
        el = ar[i];
        if(!crux.isElement(el)){
          arReturn.push(false);
          continue;
        }
        //see if the element implements the html5 classList interface
        if('classList' in el && el.classList.contains){
          arReturn.push(strClassToCheckFor.split(' ').every(function(str){ return (!str ? true : el.classList.contains(str)); }));
        }
        else if(strClass = _getCSSClass(el)){
          //
          arReturn.push(strClassToCheckFor.split(' ').every(function(str){
            //return (!str ? true : (getRegExp('hasClass_re1_' + str) || addRegExp('hasClass_re1' + str, new RegExp('\\b' + str + '\\b', 'g'))).test(strClass));
            return (!str ? true : (c[str] || (c[str] = new RegExp('\\b' + str + '\\b', 'g'))).test(strClass));
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
    "make": function make(tagName, objAttributes, objEvents, elAppendTo){
      var el = document.createElement(tagName);
      if(!elAppendTo){
        setData(el, '_ddpDetached', true); //serious thought should be put into whether this line should be left in...
      }
      if(objAttributes){
        crux.forOwnIn(objAttributes, function(k, v){
          var lowerK = k.toLowerCase();
          if(lowerK == 'classname' || lowerK == 'class'){
            addClass(el, v);
          }
          else{
            el.setAttribute(k, v);
          }
        });
      }
      if(objEvents){
        crux.forOwnIn(objEvents, function(k, v){ ddp.f.addEvent(el, k, v); });
      }
      if(elAppendTo){
        appendElement(el, elAppendTo);
      }
      return el;
    }
  });
  
  
  
  
  
  
  
  
  
  
  /*-----------------------------------------------*/
  /*-----------------COLLECTION--------------------*/
  /*-----------------------------------------------*/
  crux.classes.Collection = function(){
    this.length = 0;
    this.push.apply(this, arguments);
  };
  crux.classes.Collection.prototype = {
    "constructor": crux.classes.Collection,
    "push"       : _push,
    "splice"     : _splice,
    "every"      : _every,
    "indexOf"    : _indexOf,
    "toString"   : function toString(){    return '[object CruxCollection]';                    },
    "first"      : function first(){       return this.index(0);                                },
    "last"       : function last(){        return this.index(this.length-1);                    },
    "contains"   : function contains(){    return !!(_indexOf.call(ar, val) + 1);               },
    "empty"      : function empty(){       return this.setLength(0);                            },
    "toArray"    : function toArray(){     return crux.toArray(this);                           },
    "unique"     : function unique(copy){  return crux.unique(this, copy);                      },
    "forEach"    : function forEach(){     _forEach.apply(this, arguments);     return this;    },
    "augment"    : function augment(obj){  crux.augment(this.constructor, obj); return this;    },
    "add"        : function add(){         _push.apply(this, arguments);        return this;    },
    "filter"     : function filter(fn){    return new this.constructor(_filter.call(this, fn)); },
    "merge"      : function merge(){       return crux.merge.apply(this, crux.toArray([this], arguments)); },
    "DOMElements": function DOMElements(){ return this.filter(function(v){ return crux.isElement(v); });   },
    
    "index": function(ind){
      //extra check to make sure the index is below the length property
      return new this.constructor((ind < this.length ? this[ind] : null), this.selectionContext);
    },
    
    "setLength": function setLength(newLength){
      var i = this.length;
      newLength -= 1;
      while(i > newLength){
        this[i] = undefined;
        delete this[i--];
      } 
      this.length = newLength + 1;
      return this;
    }
  };
  
  
  
  
  
  /*-----------------------------------------------*/
  /*----------------DOM SELECTION------------------*/
  /*-----------------------------------------------*/
  
  crux.classes.DOMSelection = crux.subclass(
    crux.classes.Collection,
    {
      "toString" : function(){ return '[object CruxDOMSelection]'; },
      
      "init": function(selector, context){
        this.length = 0;
        this.selectionContext = context && this.resolve(context, document)[0] || document;
        arguments.length && this.add.apply(this, arguments);
      },

      "add": function(selector, context){
        var arg,
            sc = context && this.resolve(context, document)[0] || this.selectionContext;

        if(selector){
          selector = crux.isArray(selector) || selector instanceof crux.classes.DOMSelection ? selector : [selector];
          for(var i=0, l=selector.length; i<l; i++){
            arg = selector[i];
            if(crux.isString(arg)){
              this.merge(this.resolve(arg, sc), sc);
            }
            else if(crux.isElement(arg)){
              this.push(arg);
            }
          }
        }
        //remove duplicates
        return this.unique();
      },
      
      "merge": function merge(obj){
        //apply the merge method that would have been inherited from the parent class
        return this.parentConstructor.prototype.merge.apply(this, arguments).unique();
        //remove duplicates
        //return this.unique();
      },
  
      "drop": function drop(selector){
        var ar = (crux.domSelector_matches || Sizzle.matches)(selector, this), i = ar.length;
        while(i--){ this.splice(this.indexOf(ar[i]), 1); }
        return this;
      },
      
      "wait": function wait(msec, fn, data){
        var ts = this;
        window.setTimeout(function(){ fn.call(ts, data); ts = null; }, msec);
        return this;
      },
      
      "append": function append(parent){
      	var df;
      	if(this.length){
          parent = crux.isString(parent) ? this.resolve(parent, document)[0] : parent;
          df = document.createDocumentFragment();
          this.DOMElements().forEach(function(el){ df.appendChild(el); });
          parent.appendChild(df);
        }
        return this;
      },
      
      "resolve"       : function resolve(selector, context, ar){
        //optimise for the case when we're just passing a single element back and forth
        if(crux.isElement(selector) && !ar && !context){ return [selector]; }
        //run the selector through Sizzle or other dom selector library
        return (crux.domSelector || Sizzle)(selector, context, ar);
      },
      
      "find"          : function find(selector){ return new this.constructor((crux.domSelector_matches || Sizzle.matches)(this, selector), this.selectionContext); },
      "remove"        : function remove(){ this.DOMElements().forEach(function(el){ el && el.parentNode && el.parentNode.removeChild(el); }); return this; },
      "addClass"      : function addClass(str){ this.DOMElements().forEach(function(el){ crux.dom.addClass(el, str);    }); return this; },
      "removeClass"   : function removeClass(str){ this.DOMElements().forEach(function(el){ crux.dom.removeClass(el, str); }); return this; },
      "show"          : function show(){ this.DOMElements().forEach(function(el){ el.style.display = ''; return this;});     },
      "hide"          : function hide(){ this.DOMElements().forEach(function(el){ el.style.display = 'none'; return this;}); },      
      //***************************************************************
      //childrenOf 
      //returns a new DOMCollection of elements that are DOM descendents of the supplied parent element
      "childrenOf": function childrenOf(parent, jumpIframes){
      	return this.DOMElements().filter(function(el){ return crux.dom.childOf(el, parent, jumpIframes); });
        //return elements.length ? elements.every(function(el){ return crux.dom.childOf(el, parent, jumpIframes); }) : false;
      },
      
      "climb": function climb(fn){
        return this.DOMElements().every(function(el){ return crux.dom.climb(el, fn); });
      },
      
      "debug": function(str){
        try{ console.log((new Date).getTime() + ': ' + str); }
        catch(e){}
        this.forEach(function(el){ try{console.log(el);} catch(e){} });
        return this;
      }
    }
  );
  









/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
  done = 0,
  toString = Object.prototype.toString,
  hasDuplicate = false,
  baseHasDuplicate = true,
  rBackslash = /\\/g,
  rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
  baseHasDuplicate = false;
  return 0;
});

var Sizzle = function( selector, context, results, seed ) {
  results = results || [];
  context = context || document;

  var origContext = context;

  if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
    return [];
  }
  
  if ( !selector || typeof selector !== "string" ) {
    return results;
  }

  var m, set, checkSet, extra, ret, cur, pop, i,
    prune = true,
    contextXML = Sizzle.isXML( context ),
    parts = [],
    soFar = selector;
  
  // Reset the position of the chunker regexp (start from head)
  do {
    chunker.exec( "" );
    m = chunker.exec( soFar );

    if ( m ) {
      soFar = m[3];
    
      parts.push( m[1] );
    
      if ( m[2] ) {
        extra = m[3];
        break;
      }
    }
  } while ( m );

  if ( parts.length > 1 && origPOS.exec( selector ) ) {

    if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
      set = posProcess( parts[0] + parts[1], context );

    } else {
      set = Expr.relative[ parts[0] ] ?
        [ context ] :
        Sizzle( parts.shift(), context );

      while ( parts.length ) {
        selector = parts.shift();

        if ( Expr.relative[ selector ] ) {
          selector += parts.shift();
        }
        
        set = posProcess( selector, set );
      }
    }

  } else {
    // Take a shortcut and set the context if the root selector is an ID
    // (but not if it'll be faster if the inner selector is an ID)
    if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
        Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

      ret = Sizzle.find( parts.shift(), context, contextXML );
      context = ret.expr ?
        Sizzle.filter( ret.expr, ret.set )[0] :
        ret.set[0];
    }

    if ( context ) {
      ret = seed ?
        { expr: parts.pop(), set: makeArray(seed) } :
        Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

      set = ret.expr ?
        Sizzle.filter( ret.expr, ret.set ) :
        ret.set;

      if ( parts.length > 0 ) {
        checkSet = makeArray( set );

      } else {
        prune = false;
      }

      while ( parts.length ) {
        cur = parts.pop();
        pop = cur;

        if ( !Expr.relative[ cur ] ) {
          cur = "";
        } else {
          pop = parts.pop();
        }

        if ( pop == null ) {
          pop = context;
        }

        Expr.relative[ cur ]( checkSet, pop, contextXML );
      }

    } else {
      checkSet = parts = [];
    }
  }

  if ( !checkSet ) {
    checkSet = set;
  }

  if ( !checkSet ) {
    Sizzle.error( cur || selector );
  }

  if ( toString.call(checkSet) === "[object Array]" ) {
    if ( !prune ) {
      results.push.apply( results, checkSet );

    } else if ( context && context.nodeType === 1 ) {
      for ( i = 0; checkSet[i] != null; i++ ) {
        if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
          results.push( set[i] );
        }
      }

    } else {
      for ( i = 0; checkSet[i] != null; i++ ) {
        if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
          results.push( set[i] );
        }
      }
    }

  } else {
    makeArray( checkSet, results );
  }

  if ( extra ) {
    Sizzle( extra, origContext, results, seed );
    Sizzle.uniqueSort( results );
  }

  return results;
};

Sizzle.uniqueSort = function( results ) {
  if ( sortOrder ) {
    hasDuplicate = baseHasDuplicate;
    results.sort( sortOrder );

    if ( hasDuplicate ) {
      for ( var i = 1; i < results.length; i++ ) {
        if ( results[i] === results[ i - 1 ] ) {
          results.splice( i--, 1 );
        }
      }
    }
  }

  return results;
};

Sizzle.matches = function( expr, set ) {
  return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
  return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
  var set;

  if ( !expr ) {
    return [];
  }

  for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
    var match,
      type = Expr.order[i];
    
    if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
      var left = match[1];
      match.splice( 1, 1 );

      if ( left.substr( left.length - 1 ) !== "\\" ) {
        match[1] = (match[1] || "").replace( rBackslash, "" );
        set = Expr.find[ type ]( match, context, isXML );

        if ( set != null ) {
          expr = expr.replace( Expr.match[ type ], "" );
          break;
        }
      }
    }
  }

  if ( !set ) {
    set = typeof context.getElementsByTagName !== "undefined" ?
      context.getElementsByTagName( "*" ) :
      [];
  }

  return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
  var match, anyFound,
    old = expr,
    result = [],
    curLoop = set,
    isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

  while ( expr && set.length ) {
    for ( var type in Expr.filter ) {
      if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
        var found, item,
          filter = Expr.filter[ type ],
          left = match[1];

        anyFound = false;

        match.splice(1,1);

        if ( left.substr( left.length - 1 ) === "\\" ) {
          continue;
        }

        if ( curLoop === result ) {
          result = [];
        }

        if ( Expr.preFilter[ type ] ) {
          match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

          if ( !match ) {
            anyFound = found = true;

          } else if ( match === true ) {
            continue;
          }
        }

        if ( match ) {
          for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
            if ( item ) {
              found = filter( item, match, i, curLoop );
              var pass = not ^ !!found;

              if ( inplace && found != null ) {
                if ( pass ) {
                  anyFound = true;

                } else {
                  curLoop[i] = false;
                }

              } else if ( pass ) {
                result.push( item );
                anyFound = true;
              }
            }
          }
        }

        if ( found !== undefined ) {
          if ( !inplace ) {
            curLoop = result;
          }

          expr = expr.replace( Expr.match[ type ], "" );

          if ( !anyFound ) {
            return [];
          }

          break;
        }
      }
    }

    // Improper expression
    if ( expr === old ) {
      if ( anyFound == null ) {
        Sizzle.error( expr );

      } else {
        break;
      }
    }

    old = expr;
  }

  return curLoop;
};

Sizzle.error = function( msg ) {
  throw "Syntax error, unrecognized expression: " + msg;
};

var Expr = Sizzle.selectors = {
  order: [ "ID", "NAME", "TAG" ],

  match: {
    ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
    CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
    NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
    ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
    TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
    CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
    POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
    PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
  },

  leftMatch: {},

  attrMap: {
    "class": "className",
    "for": "htmlFor"
  },

  attrHandle: {
    href: function( elem ) {
      return elem.getAttribute( "href" );
    },
    type: function( elem ) {
      return elem.getAttribute( "type" );
    }
  },

  relative: {
    "+": function(checkSet, part){
      var isPartStr = typeof part === "string",
        isTag = isPartStr && !rNonWord.test( part ),
        isPartStrNotTag = isPartStr && !isTag;

      if ( isTag ) {
        part = part.toLowerCase();
      }

      for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
        if ( (elem = checkSet[i]) ) {
          while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

          checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
            elem || false :
            elem === part;
        }
      }

      if ( isPartStrNotTag ) {
        Sizzle.filter( part, checkSet, true );
      }
    },

    ">": function( checkSet, part ) {
      var elem,
        isPartStr = typeof part === "string",
        i = 0,
        l = checkSet.length;

      if ( isPartStr && !rNonWord.test( part ) ) {
        part = part.toLowerCase();

        for ( ; i < l; i++ ) {
          elem = checkSet[i];

          if ( elem ) {
            var parent = elem.parentNode;
            checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
          }
        }

      } else {
        for ( ; i < l; i++ ) {
          elem = checkSet[i];

          if ( elem ) {
            checkSet[i] = isPartStr ?
              elem.parentNode :
              elem.parentNode === part;
          }
        }

        if ( isPartStr ) {
          Sizzle.filter( part, checkSet, true );
        }
      }
    },

    "": function(checkSet, part, isXML){
      var nodeCheck,
        doneName = done++,
        checkFn = dirCheck;

      if ( typeof part === "string" && !rNonWord.test( part ) ) {
        part = part.toLowerCase();
        nodeCheck = part;
        checkFn = dirNodeCheck;
      }

      checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
    },

    "~": function( checkSet, part, isXML ) {
      var nodeCheck,
        doneName = done++,
        checkFn = dirCheck;

      if ( typeof part === "string" && !rNonWord.test( part ) ) {
        part = part.toLowerCase();
        nodeCheck = part;
        checkFn = dirNodeCheck;
      }

      checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
    }
  },

  find: {
    ID: function( match, context, isXML ) {
      if ( typeof context.getElementById !== "undefined" && !isXML ) {
        var m = context.getElementById(match[1]);
        // Check parentNode to catch when Blackberry 4.6 returns
        // nodes that are no longer in the document #6963
        return m && m.parentNode ? [m] : [];
      }
    },

    NAME: function( match, context ) {
      if ( typeof context.getElementsByName !== "undefined" ) {
        var ret = [],
          results = context.getElementsByName( match[1] );

        for ( var i = 0, l = results.length; i < l; i++ ) {
          if ( results[i].getAttribute("name") === match[1] ) {
            ret.push( results[i] );
          }
        }

        return ret.length === 0 ? null : ret;
      }
    },

    TAG: function( match, context ) {
      if ( typeof context.getElementsByTagName !== "undefined" ) {
        return context.getElementsByTagName( match[1] );
      }
    }
  },
  preFilter: {
    CLASS: function( match, curLoop, inplace, result, not, isXML ) {
      match = " " + match[1].replace( rBackslash, "" ) + " ";

      if ( isXML ) {
        return match;
      }

      for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
        if ( elem ) {
          if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
            if ( !inplace ) {
              result.push( elem );
            }

          } else if ( inplace ) {
            curLoop[i] = false;
          }
        }
      }

      return false;
    },

    ID: function( match ) {
      return match[1].replace( rBackslash, "" );
    },

    TAG: function( match, curLoop ) {
      return match[1].replace( rBackslash, "" ).toLowerCase();
    },

    CHILD: function( match ) {
      if ( match[1] === "nth" ) {
        if ( !match[2] ) {
          Sizzle.error( match[0] );
        }

        match[2] = match[2].replace(/^\+|\s*/g, '');

        // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
        var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
          match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
          !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

        // calculate the numbers (first)n+(last) including if they are negative
        match[2] = (test[1] + (test[2] || 1)) - 0;
        match[3] = test[3] - 0;
      }
      else if ( match[2] ) {
        Sizzle.error( match[0] );
      }

      // Move to normal caching system
      match[0] = done++;

      return match;
    },

    ATTR: function( match, curLoop, inplace, result, not, isXML ) {
      var name = match[1] = match[1].replace( rBackslash, "" );
      
      if ( !isXML && Expr.attrMap[name] ) {
        match[1] = Expr.attrMap[name];
      }

      // Handle if an un-quoted value was used
      match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

      if ( match[2] === "~=" ) {
        match[4] = " " + match[4] + " ";
      }

      return match;
    },

    PSEUDO: function( match, curLoop, inplace, result, not ) {
      if ( match[1] === "not" ) {
        // If we're dealing with a complex expression, or a simple one
        if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
          match[3] = Sizzle(match[3], null, null, curLoop);

        } else {
          var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

          if ( !inplace ) {
            result.push.apply( result, ret );
          }

          return false;
        }

      } else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
        return true;
      }
      
      return match;
    },

    POS: function( match ) {
      match.unshift( true );

      return match;
    }
  },
  
  filters: {
    enabled: function( elem ) {
      return elem.disabled === false && elem.type !== "hidden";
    },

    disabled: function( elem ) {
      return elem.disabled === true;
    },

    checked: function( elem ) {
      return elem.checked === true;
    },
    
    selected: function( elem ) {
      // Accessing this property makes selected-by-default
      // options in Safari work properly
      if ( elem.parentNode ) {
        elem.parentNode.selectedIndex;
      }
      
      return elem.selected === true;
    },

    parent: function( elem ) {
      return !!elem.firstChild;
    },

    empty: function( elem ) {
      return !elem.firstChild;
    },

    has: function( elem, i, match ) {
      return !!Sizzle( match[3], elem ).length;
    },

    header: function( elem ) {
      return (/h\d/i).test( elem.nodeName );
    },

    text: function( elem ) {
      var attr = elem.getAttribute( "type" ), type = elem.type;
      // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc) 
      // use getAttribute instead to test this case
      return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
    },

    radio: function( elem ) {
      return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
    },

    checkbox: function( elem ) {
      return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
    },

    file: function( elem ) {
      return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
    },

    password: function( elem ) {
      return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
    },

    submit: function( elem ) {
      var name = elem.nodeName.toLowerCase();
      return (name === "input" || name === "button") && "submit" === elem.type;
    },

    image: function( elem ) {
      return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
    },

    reset: function( elem ) {
      var name = elem.nodeName.toLowerCase();
      return (name === "input" || name === "button") && "reset" === elem.type;
    },

    button: function( elem ) {
      var name = elem.nodeName.toLowerCase();
      return name === "input" && "button" === elem.type || name === "button";
    },

    input: function( elem ) {
      return (/input|select|textarea|button/i).test( elem.nodeName );
    },

    focus: function( elem ) {
      return elem === elem.ownerDocument.activeElement;
    }
  },
  setFilters: {
    first: function( elem, i ) {
      return i === 0;
    },

    last: function( elem, i, match, array ) {
      return i === array.length - 1;
    },

    even: function( elem, i ) {
      return i % 2 === 0;
    },

    odd: function( elem, i ) {
      return i % 2 === 1;
    },

    lt: function( elem, i, match ) {
      return i < match[3] - 0;
    },

    gt: function( elem, i, match ) {
      return i > match[3] - 0;
    },

    nth: function( elem, i, match ) {
      return match[3] - 0 === i;
    },

    eq: function( elem, i, match ) {
      return match[3] - 0 === i;
    }
  },
  filter: {
    PSEUDO: function( elem, match, i, array ) {
      var name = match[1],
        filter = Expr.filters[ name ];

      if ( filter ) {
        return filter( elem, i, match, array );

      } else if ( name === "contains" ) {
        return (elem.textContent || elem.innerText || Sizzle.getText([ elem ]) || "").indexOf(match[3]) >= 0;

      } else if ( name === "not" ) {
        var not = match[3];

        for ( var j = 0, l = not.length; j < l; j++ ) {
          if ( not[j] === elem ) {
            return false;
          }
        }

        return true;

      } else {
        Sizzle.error( name );
      }
    },

    CHILD: function( elem, match ) {
      var type = match[1],
        node = elem;

      switch ( type ) {
        case "only":
        case "first":
          while ( (node = node.previousSibling) )  {
            if ( node.nodeType === 1 ) { 
              return false; 
            }
          }

          if ( type === "first" ) { 
            return true; 
          }

          node = elem;

        case "last":
          while ( (node = node.nextSibling) )  {
            if ( node.nodeType === 1 ) { 
              return false; 
            }
          }

          return true;

        case "nth":
          var first = match[2],
            last = match[3];

          if ( first === 1 && last === 0 ) {
            return true;
          }
          
          var doneName = match[0],
            parent = elem.parentNode;
  
          if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
            var count = 0;
            
            for ( node = parent.firstChild; node; node = node.nextSibling ) {
              if ( node.nodeType === 1 ) {
                node.nodeIndex = ++count;
              }
            } 

            parent.sizcache = doneName;
          }
          
          var diff = elem.nodeIndex - last;

          if ( first === 0 ) {
            return diff === 0;

          } else {
            return ( diff % first === 0 && diff / first >= 0 );
          }
      }
    },

    ID: function( elem, match ) {
      return elem.nodeType === 1 && elem.getAttribute("id") === match;
    },

    TAG: function( elem, match ) {
      return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
    },
    
    CLASS: function( elem, match ) {
      return (" " + (elem.className || elem.getAttribute("class")) + " ")
        .indexOf( match ) > -1;
    },

    ATTR: function( elem, match ) {
      var name = match[1],
        result = Expr.attrHandle[ name ] ?
          Expr.attrHandle[ name ]( elem ) :
          elem[ name ] != null ?
            elem[ name ] :
            elem.getAttribute( name ),
        value = result + "",
        type = match[2],
        check = match[4];

      return result == null ?
        type === "!=" :
        type === "=" ?
        value === check :
        type === "*=" ?
        value.indexOf(check) >= 0 :
        type === "~=" ?
        (" " + value + " ").indexOf(check) >= 0 :
        !check ?
        value && result !== false :
        type === "!=" ?
        value !== check :
        type === "^=" ?
        value.indexOf(check) === 0 :
        type === "$=" ?
        value.substr(value.length - check.length) === check :
        type === "|=" ?
        value === check || value.substr(0, check.length + 1) === check + "-" :
        false;
    },

    POS: function( elem, match, i, array ) {
      var name = match[2],
        filter = Expr.setFilters[ name ];

      if ( filter ) {
        return filter( elem, i, match, array );
      }
    }
  }
};

var origPOS = Expr.match.POS,
  fescape = function(all, num){
    return "\\" + (num - 0 + 1);
  };

for ( var type in Expr.match ) {
  Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
  Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}

var makeArray = function( array, results ) {
  array = Array.prototype.slice.call( array, 0 );

  if ( results ) {
    results.push.apply( results, array );
    return results;
  }
  
  return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
  Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
  makeArray = function( array, results ) {
    var i = 0,
      ret = results || [];

    if ( toString.call(array) === "[object Array]" ) {
      Array.prototype.push.apply( ret, array );

    } else {
      if ( typeof array.length === "number" ) {
        for ( var l = array.length; i < l; i++ ) {
          ret.push( array[i] );
        }

      } else {
        for ( ; array[i]; i++ ) {
          ret.push( array[i] );
        }
      }
    }

    return ret;
  };
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
  sortOrder = function( a, b ) {
    if ( a === b ) {
      hasDuplicate = true;
      return 0;
    }

    if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
      return a.compareDocumentPosition ? -1 : 1;
    }

    return a.compareDocumentPosition(b) & 4 ? -1 : 1;
  };

} else {
  sortOrder = function( a, b ) {
    // The nodes are identical, we can exit early
    if ( a === b ) {
      hasDuplicate = true;
      return 0;

    // Fallback to using sourceIndex (in IE) if it's available on both nodes
    } else if ( a.sourceIndex && b.sourceIndex ) {
      return a.sourceIndex - b.sourceIndex;
    }

    var al, bl,
      ap = [],
      bp = [],
      aup = a.parentNode,
      bup = b.parentNode,
      cur = aup;

    // If the nodes are siblings (or identical) we can do a quick check
    if ( aup === bup ) {
      return siblingCheck( a, b );

    // If no parents were found then the nodes are disconnected
    } else if ( !aup ) {
      return -1;

    } else if ( !bup ) {
      return 1;
    }

    // Otherwise they're somewhere else in the tree so we need
    // to build up a full list of the parentNodes for comparison
    while ( cur ) {
      ap.unshift( cur );
      cur = cur.parentNode;
    }

    cur = bup;

    while ( cur ) {
      bp.unshift( cur );
      cur = cur.parentNode;
    }

    al = ap.length;
    bl = bp.length;

    // Start walking down the tree looking for a discrepancy
    for ( var i = 0; i < al && i < bl; i++ ) {
      if ( ap[i] !== bp[i] ) {
        return siblingCheck( ap[i], bp[i] );
      }
    }

    // We ended someplace up the tree so do a sibling check
    return i === al ?
      siblingCheck( a, bp[i], -1 ) :
      siblingCheck( ap[i], b, 1 );
  };

  siblingCheck = function( a, b, ret ) {
    if ( a === b ) {
      return ret;
    }

    var cur = a.nextSibling;

    while ( cur ) {
      if ( cur === b ) {
        return -1;
      }

      cur = cur.nextSibling;
    }

    return 1;
  };
}

// Utility function for retreiving the text value of an array of DOM nodes
Sizzle.getText = function( elems ) {
  var ret = "", elem;

  for ( var i = 0; elems[i]; i++ ) {
    elem = elems[i];

    // Get the text from text nodes and CDATA nodes
    if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
      ret += elem.nodeValue;

    // Traverse everything else, except comment nodes
    } else if ( elem.nodeType !== 8 ) {
      ret += Sizzle.getText( elem.childNodes );
    }
  }

  return ret;
};

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
  // We're going to inject a fake input element with a specified name
  var form = document.createElement("div"),
    id = "script" + (new Date()).getTime(),
    root = document.documentElement;

  form.innerHTML = "<a name='" + id + "'/>";

  // Inject it into the root element, check its status, and remove it quickly
  root.insertBefore( form, root.firstChild );

  // The workaround has to do additional checks after a getElementById
  // Which slows things down for other browsers (hence the branching)
  if ( document.getElementById( id ) ) {
    Expr.find.ID = function( match, context, isXML ) {
      if ( typeof context.getElementById !== "undefined" && !isXML ) {
        var m = context.getElementById(match[1]);

        return m ?
          m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
            [m] :
            undefined :
          [];
      }
    };

    Expr.filter.ID = function( elem, match ) {
      var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

      return elem.nodeType === 1 && node && node.nodeValue === match;
    };
  }

  root.removeChild( form );

  // release memory in IE
  root = form = null;
})();

(function(){
  // Check to see if the browser returns only elements
  // when doing getElementsByTagName("*")

  // Create a fake element
  var div = document.createElement("div");
  div.appendChild( document.createComment("") );

  // Make sure no comments are found
  if ( div.getElementsByTagName("*").length > 0 ) {
    Expr.find.TAG = function( match, context ) {
      var results = context.getElementsByTagName( match[1] );

      // Filter out possible comments
      if ( match[1] === "*" ) {
        var tmp = [];

        for ( var i = 0; results[i]; i++ ) {
          if ( results[i].nodeType === 1 ) {
            tmp.push( results[i] );
          }
        }

        results = tmp;
      }

      return results;
    };
  }

  // Check to see if an attribute returns uniqued href attributes
  div.innerHTML = "<a href='#'></a>";

  if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
      div.firstChild.getAttribute("href") !== "#" ) {

    Expr.attrHandle.href = function( elem ) {
      return elem.getAttribute( "href", 2 );
    };
  }

  // release memory in IE
  div = null;
})();

if ( document.querySelectorAll ) {
  (function(){
    var oldSizzle = Sizzle,
      div = document.createElement("div"),
      id = "__sizzle__";

    div.innerHTML = "<p class='TEST'></p>";

    // Safari can't handle uppercase or unicode characters when
    // in quirks mode.
    if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
      return;
    }
  
    Sizzle = function( query, context, extra, seed ) {
      context = context || document;

      // Only use querySelectorAll on non-XML documents
      // (ID selectors don't work in non-HTML documents)
      if ( !seed && !Sizzle.isXML(context) ) {
        // See if we find a selector to speed up
        var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );
        
        if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
          // Speed-up: Sizzle("TAG")
          if ( match[1] ) {
            return makeArray( context.getElementsByTagName( query ), extra );
          
          // Speed-up: Sizzle(".CLASS")
          } else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
            return makeArray( context.getElementsByClassName( match[2] ), extra );
          }
        }
        
        if ( context.nodeType === 9 ) {
          // Speed-up: Sizzle("body")
          // The body element only exists once, optimize finding it
          if ( query === "body" && context.body ) {
            return makeArray( [ context.body ], extra );
            
          // Speed-up: Sizzle("#ID")
          } else if ( match && match[3] ) {
            var elem = context.getElementById( match[3] );

            // Check parentNode to catch when Blackberry 4.6 returns
            // nodes that are no longer in the document #6963
            if ( elem && elem.parentNode ) {
              // Handle the case where IE and Opera return items
              // by name instead of ID
              if ( elem.id === match[3] ) {
                return makeArray( [ elem ], extra );
              }
              
            } else {
              return makeArray( [], extra );
            }
          }
          
          try {
            return makeArray( context.querySelectorAll(query), extra );
          } catch(qsaError) {}

        // qSA works strangely on Element-rooted queries
        // We can work around this by specifying an extra ID on the root
        // and working up from there (Thanks to Andrew Dupont for the technique)
        // IE 8 doesn't work on object elements
        } else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
          var oldContext = context,
            old = context.getAttribute( "id" ),
            nid = old || id,
            hasParent = context.parentNode,
            relativeHierarchySelector = /^\s*[+~]/.test( query );

          if ( !old ) {
            context.setAttribute( "id", nid );
          } else {
            nid = nid.replace( /'/g, "\\$&" );
          }
          if ( relativeHierarchySelector && hasParent ) {
            context = context.parentNode;
          }

          try {
            if ( !relativeHierarchySelector || hasParent ) {
              return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
            }

          } catch(pseudoError) {
          } finally {
            if ( !old ) {
              oldContext.removeAttribute( "id" );
            }
          }
        }
      }
    
      return oldSizzle(query, context, extra, seed);
    };

    for ( var prop in oldSizzle ) {
      Sizzle[ prop ] = oldSizzle[ prop ];
    }

    // release memory in IE
    div = null;
  })();
}

(function(){
  var html = document.documentElement,
    matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

  if ( matches ) {
    // Check to see if it's possible to do matchesSelector
    // on a disconnected node (IE 9 fails this)
    var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
      pseudoWorks = false;

    try {
      // This should fail with an exception
      // Gecko does not error, returns false instead
      matches.call( document.documentElement, "[test!='']:sizzle" );
  
    } catch( pseudoError ) {
      pseudoWorks = true;
    }

    Sizzle.matchesSelector = function( node, expr ) {
      // Make sure that attribute selectors are quoted
      expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

      if ( !Sizzle.isXML( node ) ) {
        try { 
          if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
            var ret = matches.call( node, expr );

            // IE 9's matchesSelector returns false on disconnected nodes
            if ( ret || !disconnectedMatch ||
                // As well, disconnected nodes are said to be in a document
                // fragment in IE 9, so check for that
                node.document && node.document.nodeType !== 11 ) {
              return ret;
            }
          }
        } catch(e) {}
      }

      return Sizzle(expr, null, null, [node]).length > 0;
    };
  }
})();

(function(){
  var div = document.createElement("div");

  div.innerHTML = "<div class='test e'></div><div class='test'></div>";

  // Opera can't find a second classname (in 9.6)
  // Also, make sure that getElementsByClassName actually exists
  if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
    return;
  }

  // Safari caches class attributes, doesn't catch changes (in 3.2)
  div.lastChild.className = "e";

  if ( div.getElementsByClassName("e").length === 1 ) {
    return;
  }
  
  Expr.order.splice(1, 0, "CLASS");
  Expr.find.CLASS = function( match, context, isXML ) {
    if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
      return context.getElementsByClassName(match[1]);
    }
  };

  // release memory in IE
  div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
  for ( var i = 0, l = checkSet.length; i < l; i++ ) {
    var elem = checkSet[i];

    if ( elem ) {
      var match = false;

      elem = elem[dir];

      while ( elem ) {
        if ( elem.sizcache === doneName ) {
          match = checkSet[elem.sizset];
          break;
        }

        if ( elem.nodeType === 1 && !isXML ){
          elem.sizcache = doneName;
          elem.sizset = i;
        }

        if ( elem.nodeName.toLowerCase() === cur ) {
          match = elem;
          break;
        }

        elem = elem[dir];
      }

      checkSet[i] = match;
    }
  }
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
  for ( var i = 0, l = checkSet.length; i < l; i++ ) {
    var elem = checkSet[i];

    if ( elem ) {
      var match = false;
      
      elem = elem[dir];

      while ( elem ) {
        if ( elem.sizcache === doneName ) {
          match = checkSet[elem.sizset];
          break;
        }

        if ( elem.nodeType === 1 ) {
          if ( !isXML ) {
            elem.sizcache = doneName;
            elem.sizset = i;
          }

          if ( typeof cur !== "string" ) {
            if ( elem === cur ) {
              match = true;
              break;
            }

          } else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
            match = elem;
            break;
          }
        }

        elem = elem[dir];
      }

      checkSet[i] = match;
    }
  }
}

if ( document.documentElement.contains ) {
  Sizzle.contains = function( a, b ) {
    return a !== b && (a.contains ? a.contains(b) : true);
  };

} else if ( document.documentElement.compareDocumentPosition ) {
  Sizzle.contains = function( a, b ) {
    return !!(a.compareDocumentPosition(b) & 16);
  };

} else {
  Sizzle.contains = function() {
    return false;
  };
}

Sizzle.isXML = function( elem ) {
  // documentElement is verified for cases where it doesn't yet exist
  // (such as loading iframes in IE - #4833) 
  var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

  return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context ) {
  var match,
    tmpSet = [],
    later = "",
    root = context.nodeType ? [context] : context;

  // Position selectors must be done after the filter
  // And so must :not(positional) so we move all PSEUDOs to the end
  while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
    later += match[0];
    selector = selector.replace( Expr.match.PSEUDO, "" );
  }

  selector = Expr.relative[selector] ? selector + "*" : selector;

  for ( var i = 0, l = root.length; i < l; i++ ) {
    Sizzle( selector, root[i], tmpSet );
  }

  return Sizzle.filter( later, tmpSet );
};

//--------------------------------------------------------------------------------
//--------------------END Sizzle -------------------------------------------------
//--------------------------------------------------------------------------------








})(
    //try to get a reference to the global object, regardless of the scope the code is executed in
    //kangax - http://perfectionkills.com/
    (function(){ return this || (1,eval)('this') })()
  );