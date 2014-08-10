var GifLibFile = function(f) {
  this.file = f;
  this.decompBuffer = undefined;
  this.GifColorTypeStruct = [['red', 'i8'],
                             ['green', 'i8'],
                             ['blue', 'i8']];

  this.ColorMapObjectStruct = [['colorCount', 'i32'],
                               ['bitsPerPixel', 'i32'],
                               ['sortFlag', 'i32'],
                               ['gifColorTypePtr', 'i32']],

  // TODO: This is... not horribly useful this way
  this.ExtensionTypes = { 0x00: 'continuation subblock',
                          0xfe: 'comment',
                          0xf9: 'graphics control',
                          0x01: 'plaintext',
                          0xff: 'application block'},

  this.ExtensionBlockStruct = [['byteCount', 'i32'],
                               ['bytesPtr', 'i32'],
                               ['func', 'i32']];

  this.GifImageDescStruct = [['left', 'i32'],
                             ['top', 'i32'],
                             ['width', 'i32'],
                             ['height', 'i32'],
                             ['interlace', 'i32'],
                             ['colorMapObjPtr', 'i32']];

  this.SavedImageStruct = [['imageDesc', this.GifImageDescStruct],
                           ['rasterBitsPtr', 'i32'],
                           ['extensionBlockCount', 'i32'],
                           ['extensionBlockPtr', 'i32']];

  this.GifFileTypeStruct = [['width', 'i32'],
                      ['height', 'i32'],
                      ['colorResolution', 'i32'],
                      ['backgroundColor', 'i32'],
                      ['aspectByte', 'i32'],
                      ['colorMapObjPtr', 'i32'],
                      ['imageCount', 'i32'],
                      ['image', this.GifImageDescStruct],
                      ['savedImagesPtr', 'i32'],
                      ['extensionBlockCount', 'i32'],
                      ['extensionBlockPtr', 'i32'],
                      ['error', 'i32'],
                      ['userDataPtr', 'i32'],
                      ['privatePtr', 'i32']];

};

GifLibFile.prototype = {
  makeStruct: function(aStructType, aPtr) {
    var type_sizes = {'i32': 4,
                      'i8': 1,
                      'u8': 1};
    var o = {};
    var offset = 0;
    for (var i = 0; i < aStructType.length; ++i) {
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

        var struct = this.makeStruct(aStructType[i][1], aPtr + offset);
        Object.defineProperty(o, aStructType[i][0], {
          value: struct
        });
        offset = offset + struct.__struct_size;
      }
    }
    Object.defineProperty(o, '__struct_size', {
      value: offset
    });
    Object.defineProperty(o, '__struct_origin', {
      value: aPtr
    });
    return o;
  },

  load: function() {
    var defer = {};
    var promise = new Promise(function(resolve, reject) {
                                defer.resolve = resolve;
                                defer.reject = reject;
                              });
    var h = new FileReader();
    h.onloadend = (function(evt) {
                     if (evt.target.readyState == FileReader.DONE) {
                       var rawFile = evt.target.result;
                       var data = new Uint8Array(rawFile,
                                                 0,
                                                 rawFile.byteLength);
                       var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
                       var rawFilePtr = Module._malloc(nDataBytes);
                       var rawFileHeap = new Uint8Array(Module.HEAPU8.buffer,
                                                        rawFilePtr,
                                                        nDataBytes);
                       rawFileHeap.set(new Uint8Array(data.buffer));

                       var errorPtr = Module._malloc(4);

                       var f = Module.ccall('DGifOpenJS',
                                            'number',
                                            ['number', 'number'],
                                            [rawFileHeap.byteOffset, errorPtr]);

                       var g;
                       var error;
                       if (!f) {
                         error = getValue(errorPtr, 'i32');
                         defer.reject(error);
                       } else {
                         g = this.makeStruct(this.GifFileTypeStruct, f);
                         error = Module.ccall('DGifSlurp',
                                              'void',
                                              ['number'],
                                              [f]);
                         if (error == 0) {
                           console.log('Slurp Error: ' + error + ' ' + g.error);
                           defer.reject(g.error);
                         }
                       }
                       Module._free(rawFileHeap.byteOffset);
                       Module._free(errorPtr);
                       defer.resolve(g);
                       this.decompBuffer = Module._malloc(g.width * g.height * 4);
                     }
                   }.bind(this));
    h.onprogress = function(e) {
      if (e.lengthComputable) {
        console.log('Loaded ' + e.loaded + ' of ' + e.total);
      }
    };
    h.onerror = function() {
      console.log('Load error!');
      defer.reject();
    };
    h.readAsArrayBuffer(this.file);
    return promise;
  },

  close: function(fileStruct) {
    var errorPtr = Module._malloc(4);
    Module.ccall('DGifCloseFile',
                 'number',
                 ['number', 'number'],
                 [fileStruct.__struct_origin, errorPtr]);
    var error = getValue(errorPtr);
    Module._free(errorPtr);
    return error;
  },

  getFrameStruct: function(gif, frame_idx) {
    var imgPtr = gif.savedImagesPtr;
    var imgPtrFirst = this.makeStruct(this.SavedImageStruct, imgPtr);
    if (frame_idx == 0) {
      return imgPtrFirst;
    }
    return this.makeStruct(this.SavedImageStruct,
                           imgPtr + (frame_idx * imgPtrFirst.__struct_size));
  },

  copyImageToCanvas: function(gif, imageIdx, canvas) {
    canvas.width = gif.width;
    canvas.height = gif.height;
    var frame = canvas.getContext('2d');
    var img = this.getFrameStruct(gif, imageIdx);
    var offset = 0;
    var farr = new Uint8ClampedArray(this.decompBuffer);
    var cData = frame.getImageData(img.imageDesc.left,
                                   img.imageDesc.top,
                                   img.imageDesc.width,
                                   img.imageDesc.height);
    Module.ccall('CopyImage',
                 'void',
                 ['number', 'number', 'number'],
                 [gif.__struct_origin, imageIdx, this.decompBuffer]);
    var imgSize = img.imageDesc.width * img.imageDesc.height * 4;
    var arr = Module.HEAPU8.subarray(this.decompBuffer, this.decompBuffer + imgSize);
    cData.data.set(new Uint8ClampedArray(arr));
    //Module._free(rawImgData);
    frame.putImageData(cData, img.imageDesc.left, img.imageDesc.top);
  },

  getFrameDelay: function(gif, imageIdx) {
    var img = this.getFrameStruct(gif, imageIdx);
    var extensionBlock = this.makeStruct(this.ExtensionBlockStruct, img.extensionBlockPtr);

    //The delay is stored in the second and third extension data bytes.
    var extensionBytes = Module.getValue(extensionBlock.bytesPtr, '*');
    var low = (extensionBytes & 0x0000ff00) >> 8;
    var high = (extensionBytes & 0x00ff0000) >> 8;

    //Times 10 because it's stored as hundreds of a second and JS usually uses thousands (ms).
    return (high | low) * 10;
  }
};
