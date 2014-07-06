var GifColorTypeStruct = [['red', 'i8'],
                          ['green', 'i8'],
                          ['blue', 'i8']];

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
      if (aStructType[i][1] == 'u8') {
        Object.defineProperty(o, aStructType[i][0], {
          value: Module.HEAPU8[aPtr + offset]
        });
      } else {
        Object.defineProperty(o, aStructType[i][0], {
            get: function(loc, type) {
              return getValue(loc, type[1]);
            }.bind(this, aPtr + offset, aStructType[i])
        });
      }
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
      var rawFile = evt.target.result;
      var data = new Uint8Array(rawFile, 0, rawFile.byteLength);
      var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
      var rawFilePtr = Module._malloc(nDataBytes);
      var rawFileHeap = new Uint8Array(Module.HEAPU8.buffer, rawFilePtr, nDataBytes);
      rawFileHeap.set(new Uint8Array(data.buffer));

      var errorPtr = Module._malloc(4);

      var f = Module.ccall('DGifOpenJS', 'number', ['number', 'number'], [rawFileHeap.byteOffset, errorPtr]);

      var g;
      if (!f) {
        var error = getValue(errorPtr, 'i32');
        defer.reject(error);
      } else {
        g = makeStruct(GifFileTypeStruct, f);
        error = Module.ccall('DGifSlurp', 'void', ['number'], [f]);
        if (error == 0) {
          console.log("Slurp Error: " + error + " " + g.error);
          defer.reject(g.error);
        }
      }
      Module._free(rawFileHeap.byteOffset);
      Module._free(errorPtr);
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

var getFrameStruct = function(gif, frame_idx) {
  var imgPtr = gif.savedImagesPtr;
  var imgPtrFirst = makeStruct(SavedImageStruct, imgPtr);
  if (frame_idx == 0) {
    return imgPtrFirst;
  }
  return makeStruct(SavedImageStruct, imgPtr + (frame_idx * imgPtrFirst.__struct_size));
};

var getColorMap = function(colorMapPtr) {
  return makeStruct(ColorMapObjectStruct, colorMapPtr);
};

var getColors = function(count, ptr) {
  var colors = [];
  for(var i = 0; i < count; ++i) {
    var s = makeStruct(GifColorTypeStruct, ptr + (3 * i));
    colors.push([s.red < 0 ? s.red + 256 : s.red,
                 s.green < 0 ? s.green + 256 : s.green,
                 s.blue < 0 ? s.blue + 256 : s.blue]);
  }
  return colors;
};

var copyImageToCanvas = function(gif, imageIdx, canvas) {
  canvas.width = gif.width;
  canvas.height = gif.height;
  var frame = canvas.getContext('2d');
  var img = getFrameStruct(gif, imageIdx);
  var rawImgData = Module._malloc(gif.width * gif.height * 4);
  Module.ccall('CopyImage', 'void', ['number', 'number', 'number'], [gif.__struct_origin, imageIdx, rawImgData]);
  var cData = frame.getImageData(img.imageDesc.left,
                                 img.imageDesc.top,
                                 img.imageDesc.width,
                                 img.imageDesc.height);
  arr = new Uint8ClampedArray(Module.HEAPU8.subarray(rawImgData, rawImgData + (img.imageDesc.width * img.imageDesc.height * 4)));
  cData.data.set(arr);
  Module._free(rawImgData);
  frame.putImageData(cData, img.imageDesc.left, img.imageDesc.top);
};
