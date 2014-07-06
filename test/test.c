#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "gif_lib.h"

int main(int argc, char** argv) {
  int err;
  GifFileType* gif = DGifOpenFileName(argv[1], &err);
  if(!gif) {
    printf("Error: %d\n", err);
    return 1;
  }
  err = DGifSlurp(gif);
  if(!err) {
    printf("Error: %d %d\n", err, gif->Error);
    return 1;
  }
  printf("Info:\n");
  printf("%d %d %d %d %d %d\n", gif->ImageCount, gif->SWidth, gif->SHeight, gif->Image.Interlace, gif->SColorMap->ColorCount, gif->SColorMap->BitsPerPixel);
  /* if(gif->Image.ColorMap) { */
  printf("Global Color Map: %d\n", gif->SColorMap);//gif->Image.ColorMap->ColorCount, gif->Image.ColorMap->BitsPerPixel, gif->Image.ColorMap->SortFlag);
  /* } */
  /* for (int i = 0; i < gif->ImageCount; ++i) {//ColorMap->ColorCount; ++i) { */
  /*   printf("Image %d Color Map: %d\n", i, gif->SavedImages[i].ImageDesc.ColorMap); */
  /* } */
// gif->SavedImages[0].ImageDesc.ColorMap->ColorCount, gif->SavedImages[0].ImageDesc.ColorMap->BitsPerPixel, gif->SavedImages[0].ImageDesc.ColorMap->SortFlag);
  /* printf("Map:\n"); */
  for (int i = 0; i < gif->SColorMap->ColorCount; ++i) {
    printf("%d %d %d\n", gif->SColorMap->Colors[i].Red, gif->SColorMap->Colors[i].Green, gif->SColorMap->Colors[i].Blue);
  }
  return 0;
};
