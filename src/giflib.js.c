#include <stdint.h>
#include <stdio.h>
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

void CopyImage(GifFileType* gif, int frame, uint8_t* dest) {
  if (frame > gif->ImageCount) {
    return;
  }
  ColorMapObject* colorMap;
  if (gif->SavedImages[frame].ImageDesc.ColorMap) {
    colorMap = gif->SavedImages[frame].ImageDesc.ColorMap;
  } else {
    colorMap = gif->SColorMap;
  }
  for(int i = 0; i < gif->SWidth * gif->SHeight; i++) {
    uint8_t index = gif->SavedImages[frame].RasterBits[i];
    dest[i * 4 + 0] = colorMap->Colors[index].Red;
    dest[i * 4 + 1] = colorMap->Colors[index].Green;
    dest[i * 4 + 2] = colorMap->Colors[index].Blue;
    dest[i * 4 + 3] = 255;
  }
}

