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
  int i = 0;
  if (frame > gif->ImageCount) {
    return;
  }
  ColorMapObject* colorMap;
  if (gif->SavedImages[frame].ImageDesc.ColorMap) {
    colorMap = gif->SavedImages[frame].ImageDesc.ColorMap;
  } else {
    colorMap = gif->SColorMap;
  }
  uint8_t transparent_index;
  bool t = false;
  if(gif->SavedImages[frame].ExtensionBlockCount > 0) {
    for(i = 0; i < gif->SavedImages[frame].ExtensionBlockCount; ++i) {
      if (gif->SavedImages[frame].ExtensionBlocks[i].Function == GRAPHICS_EXT_FUNC_CODE) {
        t = true;
        transparent_index = gif->SavedImages[frame].ExtensionBlocks[i].Bytes[3];
        //printf("Transparent index: %d\n", transparent_index);
      }
    }
  }
  for(i = 0; i < gif->SWidth * gif->SHeight; i++) {
    uint8_t index = gif->SavedImages[frame].RasterBits[i];
    if (t && index == transparent_index) {
      //dest[i * 4 + 3] = 0;
      continue;
    }
    dest[i * 4 + 0] = colorMap->Colors[index].Red;
    dest[i * 4 + 1] = colorMap->Colors[index].Green;
    dest[i * 4 + 2] = colorMap->Colors[index].Blue;
    dest[i * 4 + 3] = 255;
  }
}

