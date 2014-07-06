BUILD_DIR=$(shell pwd)/build
EMSCRIPTEN_DIR=/home/qdot/code/mozbuild/emscripten
GIFLIB_DIR=$(shell pwd)/giflib-5.1.0
EXPORT_FUNCS="['_DGifOpenJS', '_infunc', '_DGifOpen', '_DGifSlurp', '_DGifCloseFile', '_CopyImage']"
TOTAL_MEMORY=32000000

.PHONY: download configure bootstrap release debug debug-opt clean all default

default: all

all: bootstrap release

bootstrap: $(GIFLIB_DIR) $(BUILD_DIR)

$(BUILD_DIR): $(GIFLIB_DIR)
	mkdir -p $(BUILD_DIR)
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emconfigure $(GIFLIB_DIR)/configure --disable-shared

$(GIFLIB_DIR):
	wget "http://downloads.sourceforge.net/project/giflib/giflib-5.1.0.tar.bz2"
	tar xf giflib-5.1.0.tar.bz2
	rm giflib-5.1.0.tar.bz2

release: bootstrap
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emmake make
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emcc -O3 lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTAL_MEMORY)
	cat $(BUILD_DIR)/giflib.emscripten.js $(BUILD_DIR)/../js/giflib.library.js > $(BUILD_DIR)/giflib.js

debug: bootstrap
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emmake make
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emcc lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTAL_MEMORY) -s ASSERTIONS=1

debug-opt: bootstrap
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emmake make
	cd $(BUILD_DIR) && $(EMSCRIPTEN_DIR)/emcc -O3 lib/*.o ../src/giflib.js.c -o $(BUILD_DIR)/giflib.emscripten.js -I$(GIFLIB_DIR)/lib -s EXPORTED_FUNCTIONS=$(EXPORT_FUNCS) -s TOTAL_MEMORY=$(TOTALMEMORY) -s ASSERTIONS=1

clean:
	rm -rf $(BUILD_DIR)

distclean: clean
	rm -rf $(GIFLIB_DIR)
