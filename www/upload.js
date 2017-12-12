$(function() {
    init();
})


async function init(){
  await mscp.ready;
  $("#fileupload").submit(function (event) {
    event.preventDefault();
    fileUploadClicked($(this)[0])
    return false;
  });
}

function fileUploadClicked(form){
  var formData = new FormData(form);
  var file = $("#chosenfile")[0];
  var reader = new FileReader();

  reader.onloadend = async function(event) {
    let binary = reader.result;//event.target.result;
    let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()

    let exists = await mscp.exists(md5)
    if(!exists){
      doUploadFile(formData)
    } else {
      let f = await mscp.file(md5)
      $("#uploadedfiles").append(`<tr><td>${f.filename}</td><td><a href="${f.links.download}">Download</a> <a href="${f.links.raw}">Raw</a></td></tr>`)
    }
  };

  reader.readAsBinaryString(file.files[0]);
}

function doUploadFile(formData){
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
}
