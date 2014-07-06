'use strict';

$(document).ready(function() {
  $('#filebutton').click(function(e) {
    $('#fileinput').click();
  });

  $('#fileinput').change(function(e) {
    $('#fileselect').val($('#fileinput').val());
  });
  $('#gobutton').click(function() {
    if (document.getElementById('fileinput').files.length == 0) {
      return;
    }
    var start = new Date();
    var g = loadGifFile(document.getElementById('fileinput').files[0]);

    var gifLoaded = function (gif) {
      updateFrame(gif);
      console.time("loading");
    };
    var imgIdx = 0;

    var updateFrame = function (gif) {

      var tmpCanvas = document.getElementById('gifcanvas');
      copyImageToCanvas(gif, imgIdx, tmpCanvas);
      imgIdx = imgIdx + 1;
      if(imgIdx < gif.imageCount) {
        setTimeout(updateFrame.bind(undefined, gif), 0);
      } else {
        closeGifFile(gif);
        console.timeEnd("loading");
      }
    };

    var gifLoadFailed = function (error) {
      console.log("Load failure! Error Code: " + error);
    };
    g.then(gifLoaded, gifLoadFailed);
  });
});
