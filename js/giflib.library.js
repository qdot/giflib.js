var GifImageDescStruct = [['left', 'i32'],
                          ['top', 'i32'],
                          ['width', 'i32'],
                          ['height', 'i32'],
                          ['interlace', 'i8'],
                          ['colorMapObjPtr', 'i32']];
var GifFileTypeStruct = [['width', 'i32'],
                         ['height', 'i32'],
                         ['colorResolution', 'i32'],
                         ['backgroundColor', 'i32'],
                         ['aspectByte', 'i32'],
                         ['colorMapObjPtr', 'i32'],
                         ['imageCount', 'i32'],
                         // THIS IS WRONG FIX IT
                         // ['image', GifImageDescStruct],
                         ['image', 'i32'],
                         ['savedImagesPtr', 'i32'],
                         ['extensionBlockCount', 'i32'],
                         ['extensionBlockPtr', 'i32'],
                         ['error', 'i32'],
                         ['userDataPtr', 'i32'],
                         ['privatePtr', 'i32']];

var makeStruct = function(aStructType, aPtr) {
  var type_sizes = {'i32': 4,
                    'i8': 1};
  var o = {};
  var offset = 0;
  for(var i = 0; i < aStructType.length; ++i) {
    Object.defineProperty(o, aStructType[i][0], {
      value: getValue(aPtr + offset, aStructType[i][1])
    });
    offset = offset + type_sizes[aStructType[i][1]];
  }
  return o;
};

var loadGifFile = function(f) {
  var defer = {};
  var promise = new Promise(function(resolve, reject) {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  var h = new FileReader();
  h.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) {
      var myTypedArray = evt.target.result;
      var data = new Uint8Array(myTypedArray, 0, myTypedArray.byteLength);
      // Get data byte size, allocate memory on Emscripten heap, and get pointer
      var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
      var dataPtr = Module._malloc(nDataBytes);

      // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
      var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
      dataHeap.set(new Uint8Array(data.buffer));
      var f = Module.ccall('gif_from_js', 'number', ['number'], [dataHeap.byteOffset]);
      Module._free(dataHeap.byteOffset);
      defer.resolve(makeStruct(GifFileTypeStruct, f));
    }
  };
  h.onprogress = function(e) {
    if (e.lengthComputable) {
      console.log("Loaded " + e.loaded + " of " + e.total);
    }
  };
  h.onerror = function() {
    console.log("Load error!");
    defer.reject();
  };
  h.readAsArrayBuffer(f);
  return promise;
};
