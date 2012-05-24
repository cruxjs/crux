//****************************************
// Crux Javascript Library - GUI Module
//  Greg Houldsworth
//  Aaron Murray
//****************************************


//create a private scope
(function(window){
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
  
  
  var gui = _.gui = {
    "version": version,
    "eventXY": function eventXY(objEvent){
      //TODO: eliminate the try block here by checking if the document is ready first (when implemented)
      try{
        return (
          (objEvent.pageX || objEvent.pageY) ? 
          {
            "x":objEvent.pageX,
            "y":objEvent.pageY
          } :
          {
            "x": objEvent.clientX + document.body.scrollLeft - document.body.clientLeft,
            "y": objEvent.clientY + document.body.scrollTop  - document.body.clientTop
          }
        );
      }
      catch(e){
        //in IE6 if this method is executed before the page fully loads, it throws an error...
        return {x:0,y:0};
      }
    }
  };
  
  //_.extend(_.gui, {});
  
  
  
  /***************************************************************/
  //findScriptPath
  //find the absolute path of an included script by it's file name
  function findScriptPath(scriptFileName){
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
  
  /***************************************************************/
  
  


})(
    //try to get a reference to the global object, regardless of the scope the code is executed in
    //kangax - http://perfectionkills.com/
    (function(){ return this || (1,eval)('this') })()
  );