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
  var filesChosen = $("#chosenfile")[0];
  for(let file of filesChosen.files){
    readFile(file, formData)
  }
}

function readFile(file, formData){
  var reader = new FileReader();

  reader.onloadend = async function(event) {
    let binary = reader.result;//event.target.result;
    let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()

    let exists = await mscp.exists(md5)
    if(!exists){
      doUploadFile(formData)
    } else {
      let f = await mscp.file(md5)
      $("#uploadedfiles").append(`<tr><td>${f.filename}</td><td>${f.hash}</td><<td><a href="${f.links.download}" target="_blank">Download</a> <a href="${f.links.raw}" target="_blank">Raw</a></td>/tr>`)
    }
  };

  reader.readAsBinaryString(file);
}

function doUploadFile(formData, accessKey){
  $.ajax({
        url: '/api/upload' + (accessKey ? "?accessKey=" + accessKey : ''),
        type: 'POST',
        data: formData,
        async: true,
        cache: false,
        contentType: false,
        processData: false,
        success: function (returndata) {
          let files = returndata.result;
          for(let f of files){
            $("#uploadedfiles").append(`<tr><td>${f.filename}</td><td>${f.hash}</td><<td><a href="${f.links.download}" target="_blank">Download</a> <a href="${f.links.raw}" target="_blank">Raw</a></td></tr>`)
          }
        },
        error: function(e){
          if(e.status == 403){
            let key = prompt("You do not have access to this functionality. Enter an access key to continue.")
            if(key){
              return doUploadFile(formData, key)
            } else {
              throw "No AccessKey entered"
            }
          } else {
            alert("Could not upload file");
          }
        }
    });
}
