# giflib.js

By Kyle Machulis (qDot)

## Description

giflib.js is an emscripten'd version of the
[giflib](http://giflib.sourceforge.net/) library. It allows for
extremely fast encoding and decoding of static and animated gifs on
browsers that support asm.js.

While there have been other libraries that have done gif encoding and
decoding, such as [jsgif](http://slbkbs.org/jsgif/),
[gif.js](http://jnordberg.github.io/gif.js/), and
[libgif-js](https://github.com/buzzfeed/libgif-js), all of these use
hand-coded LZW implementations, which may be slower than using asm.js
(I haven't tested it so I'm not going to shoot my mouth off. Yet.). By
running giflib through emscripten, we can now stay up to date with the
main native gif decoding library, while enjoying the added benefit of
asm.js optimizations.

This speed doesn't come without a cost, however. giflib.js can be
quite heavy in terms of both library size (~175k) and memory used (We
currently have a 32MB heap in order to deal with large images).

Note that giflib.js is not meant to replace any of the above projects.
It is all about making encoding/decoding as fast as possible. The plan
is actually to submit patches to provide seperate loading paths for
them using giflib.js for browsers that allow asm.js.

## Requirements

The only requirement for using giflib.js is a browser that supports
asm.js. giflib.js does not provide a fallback path, meaning that any
browser that doesn't have asm.js capabilities will probably en/decode
a couple of orders of magnitude slower.

A current build of giflib.js is checked into the repo (release/
directory), so compilation is not required.

## Compilation

To compile giflib.js, you should have the most recent version of
emscripten. Just run "make" in the repo, and it will download the
compatible version of giflib (currently 5.1.0), create an out of
source build directory, and build the javascript libraries.

## Example

An example application is included in the example directory. This
allows developers to load a local gif using the File API. It will then
load the gif, and render it to a canvas. If it is animated,
back/forward controls will be provided.

This application can also be used as a debugging harness for working
on the library. Simply comment or uncomment the script URLs in the
header as needed to test against either the release compiled version
or the seperate debug files.

## FAQ

* What functions have been added to the native library?
  * Any C functions that need to be added can be found in the src/
    directory. Currently, there is a DOpenGifJS() function that is a
    wrapper around the DOpenGif function. This allows us to set the
    input reader function in C, and have it compiled into asm.js.
    While the reader consists solely of a memcpy, having that compiled
    makes for about a 30% speed up over sending in a function pointer
    for a non-asm.js reader function.

* The library is big. Can I minify it more?
  * Not recommended. Heavier minification will only shave off about
    20k, and on a couple of minifiers I've run it through, it reduces
    performance by about 50%.

* I'm trying to use gifs that are erroring out due to running out of
heap. What should I do?
  * Up the TOTAL_MEMORY value in the makefile and rebuild.
