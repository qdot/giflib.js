#!/bin/sh

. ./config.sh

cd $BUILD_DIR && $EMSCRIPTEN_DIR/emmake make
cd $BUILD_DIR && $EMSCRIPTEN_DIR/emcc -O2 lib/*.o ../src/test-gif.c -o $BUILD_DIR/giflib.js -I$GIFLIB_DIR/lib -s EXPORTED_FUNCTIONS="['_gif_from_js', '_parse_gif_from_file']" -s ASSERTIONS=1
