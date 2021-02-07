import {MDCRipple} from '@material/ripple/index';
// const ripple = new MDCRipple(document.querySelector('.mdc-button'));
import {MDCChipSet} from '@material/chips';
import {MDCChip} from '@material/chips';
import {MDCTextField} from '@material/textfield';
import $ from "jquery";

const textFields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(el) {
    return new MDCTextField(el);
});

const chips = [].map.call(document.querySelectorAll('.mdc-chip'), function(el) {
    return new MDCChip(el);
});

// chips.forEach(element => {
//     element.shouldRemoveOnTrailingIconClick(true)
// }); 


const chipSetEl = document.querySelector('.mdc-chip-set');

const chipSet = new MDCChipSet(chipSetEl);

const chipInput = document.querySelector('#imageKeywords');


chipInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
      const inputValue = chipInput.value;
      console.log(inputValue);

      const chipDiv = document.createElement('div');
      chipDiv.setAttribute("class", "mdc-chip");
      chipDiv.setAttribute("role", "row");

      const rippleDiv = document.createElement('div');
      rippleDiv.setAttribute("class", "mdc-chip__ripple");

      const cellSpan = document.createElement('span');
      cellSpan.setAttribute("role", "gridcell");

      const tabSpan = document.createElement('span');
      tabSpan.setAttribute("role", "button");
      tabSpan.setAttribute("tabindex", "0");
      tabSpan.setAttribute("class", "mdc-chip__primary-action");

      const textSpan = document.createElement('span');
      textSpan.setAttribute("class", "mdc-chip__text");

      var chipText = document.createTextNode(inputValue);

      textSpan.appendChild(chipText);
      tabSpan.appendChild(textSpan);
      cellSpan.appendChild(tabSpan);

      const iconSpan = document.createElement("span");
      iconSpan.setAttribute("role", "gridcell");

      const chipIcon = document.createElement("i");
      chipIcon.setAttribute("class", "material-icons mdc-chip__icon mdc-chip__icon--trailing");
      chipIcon.setAttribute("tabindex","-1");
      chipIcon.setAttribute("role", "button");

      const iconText = document.createTextNode("cancel");
      chipIcon.appendChild(iconText);

      iconSpan.appendChild(chipIcon);

      chipDiv.appendChild(rippleDiv);
      chipDiv.appendChild(cellSpan);
      chipDiv.appendChild(iconSpan);
      // ... perform operations to properly populate/decorate chip element ...
      chipSetEl.appendChild(chipDiv);
      chipInput.value = "";
      chipSet.addChip(chipDiv);

      console.log(chips)
    }
  });

chipSet.listen('MDCChip:removal', function(event) {
    console.log("Removing");
    chipSetEl.removeChild(event.detail.root);
});


const uploadBtn = document.querySelector("#uploadImgBtn");
uploadBtn.addEventListener("click", function(){
    let keywords = []
    const chipIds = chipSet.chips;
    chipIds.forEach((chip)=>{
        // console.log(chip.root.textContent);
        // console.log(chip.root.innerHTML);
        let chipText = chip.root.innerText;
        var word = 'cancel';
        var newWord = '';
        var n = chipText.lastIndexOf(word);
        chipText = chipText.slice(0, n) + chipText.slice(n).replace(word, newWord);
        chipText = chipText.trim();
        console.log(chipText);
        keywords.push(chipText);
    });
    console.log(keywords);

    const input = document.querySelector('#imageUpload');

          const formData = new FormData();
          formData.append('file', input.files[0]);
          formData.append("imageName", $("#imageName").val());
          formData.append("imageDescription", $("#imageDescription").val());
          formData.append("imagePrice", $("#imagePrice").val());
          formData.append("imageKeywords", JSON.stringify(keywords));

          $.ajax({
            url: '/upload/',
            dataType: "JSON",
            data: formData,
            type: "POST",
            processData: false,
            contentType: false,
          })
          .then((result)=>{
            console.log(result);
            if(result.success === true){
                alert("Image uploaded successfully");
                $("#imageName").val("");
                $("#imageDescription").val("");
                $("#imagePrice").val("");
                chipSet.chips.forEach((chip)=>{
                    chip.beginExit();
                    
                });
            }
          })
          .catch((err)=>{
            console.log(err)
          })
    // let id = chipIds[0];
    // const input = document.querySelector('#my-input');

    // const formData = new FormData();
    // formData.append('myFile', input.files[0]);

    // axios.post('/upload', formData, {
    //     headers: {
    //         'Content-Type': 'multipart/form-data'
    //     }
    // });
// console.log(document.getElementById(id));
// console.log(chipIds);

// $.ajax({
//     url:"/upload/saveImage",
//     dataType: "JSON",
//     type: "POST",
//     data: {}
// })
// .then((result)=>{
//     console.log(result)
// })
// .catch((err)=>{
//     console.log(err)
// })
});


