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

    var g = loadGifFile(document.getElementById('fileinput').files[0]);
    var gifLoaded = function (gif) {
      console.log(gif);
    };
    var gifLoadFailed = function (gif) {
      console.log("Load failure!");
    };
    g.then(gifLoaded, gifLoadFailed);
  });
});
