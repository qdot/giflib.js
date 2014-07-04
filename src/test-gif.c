#include <string.h>
#include <stdint.h>
#include <stdio.h>
#include <sys/time.h>
#include "gif_lib.h"

int total = 0;

int infunc(GifFileType* gif, GifByteType* bytes, int size) {
  //printf("Requesting read of size %d at offset %d\n", size, total);
  memcpy(bytes, gif->UserData + total, size);
  total += size;
  return size;
}

GifFileType* parse_gif(GifFileType* f) {
  int err;
  struct timeval before, after;

  printf("slurping\n");
  gettimeofday(&before, NULL);
  DGifSlurp(f);
  gettimeofday(&after, NULL);
  printf("finished decode in %f seconds\n",
         ((after.tv_sec * 1000000 + after.tv_usec) -
          (before.tv_sec * 1000000 + before.tv_usec))/1000000.0);
  printf("Width: %d Height: %d Images: %d\n", f->SWidth, f->SHeight, f->ImageCount);
  printf("closing\n");
  //DGifCloseFile(f, &err);
  printf("error returned: %d\n", err);
  return f;
}

GifFileType* gif_from_js(uint8_t* ptr) {
  int err;
  total = 0;
  printf("Checking original at 0x%x\n", ptr);
  for(int i = 0; i < 6; ++i) {
    printf("0x%02x ", ptr[i]);
  }
  printf("\n");
  GifFileType* f = DGifOpen(ptr, infunc, &err);
  printf("error returned: %d\n", err);
  return parse_gif(f);
}

void parse_gif_from_file() {
  int err;
  printf("opening file\n");
  GifFileType* f = DGifOpenFileName("test.gif", &err);
  printf("error returned: %d\n", err);
  parse_gif(f);
}

int main(int argc, char* argv[]) {
  parse_gif_from_file();
  return 0;
}
