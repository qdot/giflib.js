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
      console.log(gif);
      var finish = new Date();
      var difference = new Date();
      difference.setTime(finish.getTime() - start.getTime());
      console.log("TIME: " + difference.getMilliseconds() );
      var tmpCanvas = document.getElementById('gifcanvas');
      start = new Date();
      copyImageToCanvas(gif, 0, tmpCanvas);
      finish = new Date();
      difference = new Date();
      difference.setTime(finish.getTime() - start.getTime());
      console.log("TIME: " + difference.getMilliseconds() );
      console.log("Finished");
    };
    var gifLoadFailed = function (error) {
      console.log("Load failure! Error Code: " + error);
    };
    g.then(gifLoaded, gifLoadFailed);
  });
});
