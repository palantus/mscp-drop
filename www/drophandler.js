$(function() {
  $("#uploadbutton").on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    $("#uploadbutton").addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    $("#uploadbutton").removeClass('is-dragover');
  })
  .on('drop', function(e) {
    let droppedFiles = e.originalEvent.dataTransfer.files;

    for(let f of droppedFiles){
      let formData = new FormData();
      formData.append(f.name, f);
      readFile(f, formData);
    }
  });
})
