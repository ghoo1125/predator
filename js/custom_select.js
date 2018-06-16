(function addSelectListener() {
  let select = document.getElementsByClassName('custom-select');
  for (let i = 0; i < select.length; i++) {
    let button;
    let node = select[i].firstChild;
    while (node.nextSibling) {
      if (node.constructor.name == 'HTMLButtonElement' &&
          node.className == 'custom-button') {
        button = node;
        break;
      }
      node = node.nextSibling;
    }

    button.addEventListener('click', function(e) {
      // Do not let document hide the options
      e.stopPropagation();

      // Need to navigate again since the dom tree might change
      node = select[i].firstChild;
      let options = [];

      while (node.nextSibling) {
        if (node.constructor.name == 'HTMLDivElement' &&
            node.className == 'custom-option') {
          options.push(node);
        }
        node = node.nextSibling;
      }

      for (let i = 0; i < options.length; i++) {
        options[i].style.display = 'block';

        let buttonLeft = button.offsetLeft;
        let buttonTop = button.offsetTop;
        let buttonWidth = button.getBoundingClientRect().width;
        let buttonHeight = button.getBoundingClientRect().height;
        let optionWidth = options[0].getBoundingClientRect().width;
        let optionHeight = options[0].getBoundingClientRect().height;
        options[i].style.top = buttonTop + buttonHeight + optionHeight * i + 'px';
        options[i].style.left = buttonLeft + (buttonWidth - optionWidth) / 2 + 'px';

        options[i].addEventListener('click', function() {
          for (let j = 0; j < options.length; j++) {
            options[j].style.display = 'none';
          }
          button.innerHTML = options[i].innerHTML;
        });
      }
    });
  }

  document.addEventListener('click', function() {
    let options = document.getElementsByClassName('custom-option');
    for (let i = 0; i < options.length; i++) {
      options[i].style.display = 'none';
    }
  });
}) ();
