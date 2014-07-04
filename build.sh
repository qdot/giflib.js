#!/bin/sh

. ./config.sh

cd $BUILD_DIR && $EMSCRIPTEN_DIR/emmake make
cd $BUILD_DIR && $EMSCRIPTEN_DIR/emcc -O2 lib/*.o ../src/giflib.js.c -o $BUILD_DIR/giflib.emscripten.js -I$GIFLIB_DIR/lib -s EXPORTED_FUNCTIONS="['_DGifOpenJS', '_infunc', '_DGifOpen', '_DGifSlurp', '_printStruct']" -s ASSERTIONS=1 -profiling
cat $BUILD_DIR/giflib.emscripten.js $BUILD_DIR/../js/giflib.library.js > $BUILD_DIR/giflib.js
