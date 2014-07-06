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
hand-coded LZW implementations, which end up being far slower than
using asm.js (anywhere from 5x-15x depending on image, browser, etc).
By running giflib through emscripten, we can now stay up to date with
the main native gif decoding library, while enjoying the added benefit
of asm.js optimizations.

Note that giflib.js is not meant to replace any of the above projects.
It is all about making encoding/decoding as fast as possible. The plan
is actually to submit patches to provide seperate loading paths for
them using giflib.js for browsers that allow asm.js.

## Tradeoffs

This speed doesn't come without a cost, however.

giflib.js can be quite heavy in terms of both library size (~175k
ungzip'd, roughly 10x-15x the size of other hand written
encoder/decoders) and memory used (We currently have a 32MB emscripten
heap in order to deal with large images). Debugging is also more
difficult due to the complexity of compiled code.

## Requirements

The only requirement for using giflib.js is a browser that supports
asm.js. giflib.js does not provide a fallback path currently, meaning
that any browser that doesn't have asm.js capabilities will probably
en/decode a couple of orders of magnitude slower.

A current build of giflib.js is checked into the repo (release/
directory), so compilation is not required.

## Compilation

However, if you do want to compile giflib.js, you should have the most
recent version of [emscripten](https://github.com/kripken/emscripten/)
and the
[closure compiler](https://developers.google.com/closure/compiler/).
Just run "make" in the repo, and it will download the compatible
version of giflib (currently 5.1.0), create an out of source build
directory, and build the javascript libraries. There are other make
targets for doing debug builds, tests, etc.

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
    for a non-asm.js reader function. There's also a function for
    doing the color map to index matching, since that gets about a 40%
    speedup when done in asm.js.

* The library is big. Can I minify it more?
  * Not recommended. Heavier minification will only shave off about
    20k, and on a couple of minifiers I've run it through, it reduces
    performance by about 50%.

* I'm trying to use gifs that are erroring out due to running out of
heap. What should I do?
  * Up the TOTAL_MEMORY value in the makefile and rebuild.


## License

giflib.js is released under the BSD License:

Copyright (c) 2014, Kyle Machulis/Nonpolynomial Labs
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   * Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.
   * Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in
     the documentation and/or other materials provided with the
     distribution.
   * Neither the name of Nonpolynomial Labs nor the names of its
     contributors may be used to endorse or promote products derived
     from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


giflib.js is built on top of giflib, which is also under the following
(MIT) license:

The GIFLIB distribution is Copyright (c) 1997  Eric S. Raymond

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
