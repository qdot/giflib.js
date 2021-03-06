CODE_DIR=$(shell pwd)
BUILD_DIR=$(CODE_DIR)/build
RELEASE_DIR=$(CODE_DIR)/release
BUILD_DIR_HOST=$(BUILD_DIR)/host
HOST_LIB_DIR=$(BUILD_DIR_HOST)/lib
GIFLIB_DIR=$(CODE_DIR)/giflib-5.1.0
EXPORT_FUNCS="['_DGifOpenJS', '_infunc', '_DGifOpen', '_DGifSlurp', '_DGifCloseFile', '_CopyImage']"
TOTAL_MEMORY=32000000

.PHONY: download configure bootstrap release debug debug-opt clean all default giflib-host

default: all

all: bootstrap release

bootstrap: $(GIFLIB_DIR) $(BUILD_DIR)

$(BUILD_DIR): $(GIFLIB_DIR)
	mkdir -p $(BUILD_DIR)
	cd $(BUILD_DIR) && emconfigure $(GIFLIB_DIR)/configure --disable-shared

$(GIFLIB_DIR):
	wget "http://downloads.sourceforge.net/project/giflib/giflib-5.1.0.tar.bz2"
	tar xf giflib-5.1.0.tar.bz2
	rm giflib-5.1.0.tar.bz2

$(HOST_LIB_DIR): bootstrap
	mkdir -p $(BUILD_DIR_HOST)
	cd $(BUILD_DIR_HOST) && $(GIFLIB_DIR)/configure --prefix=$(BUILD_DIR_HOST) && make install

giflib-host: $(HOST_LIB_DIR)

testc: bootstrap $(HOST_LIB_DIR)
	gcc -I ~/usr/include -std=c99 $(CODE_DIR)/test/test.c $(HOST_LIB_DIR)/libgif.a -g -o $(BUILD_DIR)/test

release: bootstrap
	cd $(BUILD_DIR) && emmake make
	cd $(BUILD_DIR) && emcc -O3 lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTAL_MEMORY)
	closure-compiler --js js/giflib.library.js --js_output_file $(BUILD_DIR)/giflib.library.min.js
	cat $(BUILD_DIR)/giflib.emscripten.js $(BUILD_DIR)/giflib.library.min.js > $(BUILD_DIR)/giflib.js
	cp $(BUILD_DIR)/giflib.js $(RELEASE_DIR)

debug: bootstrap
	cd $(BUILD_DIR) && emmake make
	cd $(BUILD_DIR) && emcc lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTAL_MEMORY) -s ASSERTIONS=1

debug-opt: bootstrap
	cd $(BUILD_DIR) && emmake make
	cd $(BUILD_DIR) && emcc -O3 lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTALMEMORY) -s ASSERTIONS=1

clean:
	rm -rf $(BUILD_DIR)

distclean: clean
	rm -rf $(GIFLIB_DIR)

