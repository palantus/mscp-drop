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
  readLocallyCachedFilesInfo();
  $("#clearcache").click(clearCache);
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
      await mscp.touch(md5, file.name)
      let f = await mscp.file(md5)
      addFileToList(f)
      storeFileInfoLocally(f)
    }
  };

  reader.readAsBinaryString(file);
}

function addFileToList(f){
  $("#uploadedfiles td:nth-child(2)").each((i, e) => {
    if(e.innerText == f.hash){
      e.parentElement.remove();
    }
  })
  $("#uploadedfiles").prepend(`<tr><td>${f.filename}</td><td>${f.hash}</td><<td><a href="${f.links.download}" target="_blank">Download</a> <a href="${f.links.raw}" target="_blank">Raw</a></td>/tr>`)
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
            addFileToList(f)
            storeFileInfoLocally(f)
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

function storeFileInfoLocally(f){
  let allFiles = JSON.parse(localStorage.dropfiles || "[]")
  let existingFile = allFiles.find(file => file.hash == f.hash)
  if(existingFile){
    existingFile.filename = f.filename
    existingFile.timestamp = f.timestamp
  } else {
    allFiles.push(f)
  }
  allFiles = allFiles.filter(file => new Date(file.timestamp).getTime() > new Date().getTime() - (5*24*60*60*1000)) // 5 days
  localStorage.dropfiles = JSON.stringify(allFiles)
}

function readLocallyCachedFilesInfo(){
  JSON.parse(localStorage.dropfiles || "[]").forEach(f => {
    $("#uploadedfiles").append(`<tr><td>${f.filename}</td><td>${f.hash}</td><<td><a href="${f.links.download}" target="_blank">Download</a> <a href="${f.links.raw}" target="_blank">Raw</a></td></tr>`)
    document.getElementById("clearcache").style.display = "block"
  })
}

function clearCache(){
  localStorage.dropfiles = ""
  $("#uploadedfiles").empty();
  document.getElementById("clearcache").style.display = "none"
}

window.addEventListener("message", (event) => {
  if(typeof event.data === "object" && event.data.message === "GetRecentFiles"){
    if(new URL(event.origin).host.split(".").slice(-2).join(".") != new URL(window.origin).host.split(".").slice(-2).join("."))
      throw "Not allowed from origin " + event.origin

    event.source.postMessage({files: JSON.parse(localStorage.dropfiles || "[]")}, event.origin)
  }
}, false);