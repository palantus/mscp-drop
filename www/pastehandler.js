$(function() {
  // Add the paste event listener
  window.addEventListener("paste", pasteHandler);

})

/* Handle paste events */
async function pasteHandler(e) {
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
        } else if(items[i].type.indexOf("text") !== -1) {
           var content = await new Promise((r) => items[i].getAsString((s) => r(s)));

           var blob = new Blob([content], {type: "text/plain;charset=utf-8"});

           let formData = new FormData();
           formData.append("text", blob, "text.txt");
           doUploadFile(formData);
        }
     }
  }
}
