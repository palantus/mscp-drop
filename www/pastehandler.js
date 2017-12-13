$(function() {
  // Add the paste event listener
  window.addEventListener("paste", pasteHandler);

})

/* Handle paste events */
function pasteHandler(e) {
   if (!e.clipboardData)
    return;

  // Get the items from the clipboard
  var items = e.clipboardData.items;
  if (items) {
     // Loop through all items, looking for any kind of image
     for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
           // We need to represent the image as a file,
           var blob = items[i].getAsFile();

            let formData = new FormData();
            formData.append("image", blob);
            doUploadFile(formData);
        }
     }
  }
}
