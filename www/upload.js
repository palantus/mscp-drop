$(function() {
    init();
})


function init(){
  $("#fileupload").submit(function (event) {
    event.preventDefault();
    //grab all form data
    var formData = new FormData($(this)[0]);

    $.ajax({
          url: '/api/upload',
          type: 'POST',
          data: formData,
          async: true,
          cache: false,
          contentType: false,
          processData: false,
          success: function (returndata) {
            let files = returndata.result;
            for(let f of files){
              $("#uploadedfiles").append(`<tr><td>${f.filename}</td><td><a href="${f.links.download}">Download</a> <a href="${f.links.raw}">Raw</a></td></tr>`)
            }
          },
          error: function(){
              alert("error in ajax form submission");
              }
      });

    return false;
    });
}
