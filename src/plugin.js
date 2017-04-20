const addMathJaxScript = document => {
  const mathJaxUrl = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-MML-AM_HTMLorMML';
  const head = document.head;
  const script = document.createElement('script');
  script.type = 'text/x-mathjax-config';
  script.text = "MathJax.Hub.Config({tex2jax: {inlineMath: [['$$','$$']], displayMath: [['$$$', '$$$']]}});";
  head.appendChild(script);

  const script2 = document.createElement('script');
  script2.type = 'text/javascript';
  script2.src = mathJaxUrl;
  script2.defer = true;
  head.appendChild(script2);
};

const stopPropagating = event => {
  if (event.stopPropagation) {
    event.stopPropagation();
    event.preventDefault();
  } else {
    event.cancelBubble = true;
    event.returnValue = false;
  }
};

const plugin = (editor) => {
  let lastAMnode;
  editor.addCommand('runMathJax', element => {
    const MathJax = editor.contentWindow.MathJax;
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
  });
  const getAllJax = element => {
    const MathJax = editor.contentWindow.MathJax;
    const allJax = MathJax.Hub.getAllJax(element);
    return allJax;
  };
  const removeJax = (originalText, inputType) => {
    if (inputType === 'AsciiMath') {
      return `\`${originalText}\``;
    }
    if (inputType === 'TeX') {
      return `\$\$${originalText}\$\$`;
    }
  };
  const wrapWithAM = () => {
    const content = editor.selection.getContent();
    const entity = `<span class="AM">\`${content}<span id="customBookmark"></span>\`</span>&nbsp;`;

    editor.selection.setContent(entity);
    editor.selection.setCursorLocation(editor.dom.get('customBookmark'));
    editor.dom.remove('customBookmark');
    return editor.selection.getNode();
  };
  const setCursorAfter = element => {
    element.insertAdjacentHTML('afterEnd', '<span id="customBookmark2"></span>&nbsp;');
    const customBookMark = editor.dom.get('customBookmark2');
    const idx = Array.prototype.indexOf.call(customBookMark.parentNode.childNodes, customBookMark) + 2;
    editor.selection.setCursorLocation(customBookMark.parentNode, idx);
    editor.dom.remove('customBookmark2');
  }
  // const disableMathJax = () => {
  //   const MathJax = editor.contentWindow.MathJax;
  //   let HTML = MathJax.HTML, jax = MathJax.Hub.getAllJax();
  //   for (let i = 0, m = jax.length; i < m; i++) {
  //     let script = jax[i].SourceElement(), tex = jax[i].originalText;
  //     if (script.type.match(/display/)) {tex = "\\\\["+tex+"\\\\]"} else {tex = "\\\\("+tex+"\\\\)"}
  //     jax[i].Remove();
  //     let preview = script.previousSibling;
  //     if (preview && preview.className === "MathJax_Preview") {
  //       preview.parentNode.removeChild(preview);
  //     }
  //     preview = HTML.Element("span",{className:"MathJax_Preview"},[tex]);
  //     script.parentNode.insertBefore(preview,script);
  //   }
  // };
  const exitAMmode = () => {
    if (lastAMnode) {
      const element = lastAMnode;
      lastAMnode = null;
      editor.execCommand('runMathJax', element);
      return true;
    }
    return false;
  };
  const testAMclass = element => element.className == 'AM';
  editor.on('init', args => {
    addMathJaxScript(args.target.dom.doc);
  });
  editor.on('keypress', event => {
    if (event.key == '`') {
      if (lastAMnode == null) {
        lastAMnode = wrapWithAM();
      } else if (editor.selection.getNode() == lastAMnode) {
        const element = lastAMnode;
        exitAMmode();
        setCursorAfter(element);
      }
      stopPropagating(event);
    }
  });
  editor.on('keydown', (event) => {
    if (event.keyCode == 13 || event.keyCode == 10) {
      const element = lastAMnode;
      if (exitAMmode()) {
        setCursorAfter(lastAMnode);
        event.stopPropagation();
        event.preventDefault();
      }
    }
  });
  editor.on('nodechange', event => {
    const element = event.element;
    const mathNode = testAMclass(element) ? element : editor.dom.getParent(element, testAMclass);
    if (mathNode) {
      const allJax = getAllJax(mathNode);
      if (allJax.length) {
      console.log('allJax', allJax);
        const jax = allJax[0];
        const plainText = removeJax(jax.originalText, jax.inputJax);
        mathNode.innerHTML = plainText;
      }
      if (lastAMnode !== mathNode) {
        exitAMmode();
        lastAMnode = mathNode;
      }
    } else if (lastAMnode) {
      if (lastAMnode.innerHTML.match(/`(&nbsp;|\s|\u00a0|&#160;)*`/) || lastAMnode.innerHTML.match(/^(&nbsp;|\s|\u00a0|&#160;)*$/)) {
        const p = lastAMnode.parentNode;
        p.removeChild(lastAMnode);
      }
      exitAMmode();
    }
  });
  editor.on('PostProcess', event => {
    console.log('event', event);
  });

  // Register the command so that it can be invoked by using tinyMCE.activeEditor.execCommand('mceAsciimath');
  editor.addCommand('mceAsciimath', value => {
    if (lastAMnode == null) {
      lastAMnode = wrapWithAM();
    }
    if (value) {
      editor.selection.setContent(value);
    }
  });
  const url = '.';

  editor.addCommand('mceAsciimathDlg', () => {
    editor.windowManager.open({
      file : url + '/amcharmap.htm',
      width : 1000,
      height : 400,
      inline : 1,
      title: 'Math symbols'
    });
  });

  editor.addButton('asciimath', {
    tooltip : 'Add New Math',
    cmd : 'mceAsciimath',
    image : url + '/img/ed_mathformula2.gif'
  });

  editor.addButton('asciimathcharmap', {
    tooltip : 'Math Symbols',
    cmd : 'mceAsciimathDlg',
    image : url + '/img/ed_mathformula.gif'
  });
};

export default plugin;
