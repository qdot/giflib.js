#include <string.h>
#include "gif_lib.h"

int total = 0;

int infunc(GifFileType* gif, GifByteType* bytes, int size) {
  memcpy(bytes, gif->UserData + total, size);
  total += size;
  return size;
}

GifFileType* DGifOpenJS(void* userData, int* err) {
  total = 0;
  return DGifOpen(userData, infunc, err);
}
