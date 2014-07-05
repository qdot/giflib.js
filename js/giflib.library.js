var GifColorTypeStruct = [['red', 'i32'],
                          ['green', 'i32'],
                          ['blue', 'i32']];

var ColorMapObjectStruct = [['colorCount', 'i32'],
                            ['bitsPerPixel', 'i32'],
                            ['sortFlag', 'i32'],
                            ['gifColorTypePtr', 'i32']];

// TODO: This is... not horribly useful this way
var ExtensionTypes = { 0x00: "continuation subblock",
                       0xfe: "comment",
                       0xf9: "graphics control",
                       0x01: "plaintext",
                       0xff: "application block"};

var ExtensionBlockStruct = [['byteCount', 'i32'],
                            ['bytesPtr', 'i32'],
                            ['function', 'i32']];


var GifImageDescStruct = [['left', 'i32'],
                          ['top', 'i32'],
                          ['width', 'i32'],
                          ['height', 'i32'],
                          ['interlace', 'i32'],
                          ['colorMapObjPtr', 'i32']];

var SavedImageStruct = [['imageDesc', GifImageDescStruct],
                        ['rasterBitsPtr', 'i32'],
                        ['extensionBlockCount', 'i32'],
                        ['extensionBlockPtr', 'i32']];

var GifFileTypeStruct = [['width', 'i32'],
                         ['height', 'i32'],
                         ['colorResolution', 'i32'],
                         ['backgroundColor', 'i32'],
                         ['aspectByte', 'i32'],
                         ['colorMapObjPtr', 'i32'],
                         ['imageCount', 'i32'],
                         ['image', GifImageDescStruct],
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
    if (typeof aStructType[i][1] == 'string') {
      Object.defineProperty(o, aStructType[i][0], {
        // TODO: This should probably just overlay the heap
        value: getValue(aPtr + offset, aStructType[i][1])
      });
      offset = offset + type_sizes[aStructType[i][1]];
    } else if (typeof aStructType[i][1] == 'object') {
      var struct = makeStruct(aStructType[i][1], aPtr + offset);
      Object.defineProperty(o, aStructType[i][0], {
        value: struct
      });
      offset = offset + struct.__struct_size;
    }
  }
  Object.defineProperty(o, "__struct_size", {
    value: offset
  });
  Object.defineProperty(o, "__struct_origin", {
    value: aPtr
  });
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
      var error = 0;
      //TODO: Fix passing of error since it's expecting a pointer
      var f = Module.ccall('DGifOpenJS', 'number', ['number', 'number'], [dataHeap.byteOffset, error]);
      Module.ccall('DGifSlurp', 'void', ['number'], [f]);
      Module._free(dataHeap.byteOffset);
      var g = makeStruct(GifFileTypeStruct, f);
      defer.resolve(g);
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

var closeGifFile = function(fileStruct) {
  var errorPtr = Module._malloc(4);
  Module.ccall('DGifCloseFile', 'number', ['number', 'number'], [fileStruct.__struct_origin, errorPtr]);
  var error = getValue(errorPtr);
  Module._free(errorPtr);
  return error;
};
