#!/bin/sh

. ./config.sh

cd $BUILD_DIR && $EMSCRIPTEN_DIR/emconfigure $GIFLIB_DIR/configure --disable-shared

