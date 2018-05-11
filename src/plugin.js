const mathJaxDefaultConfig = {
  showMathMenu: false,
  showMathMenuMSIE: false,
  TeX: {
    extensions: ["cancel.js"],
  },
  messageStyle: "none",
  asciimath2jax: {ignoreClass: ".*", processClass: 'AM'},
  tex2jax: {ignoreClass: ".*", processClass: 'AM', inlineMath: [['$$','$$']], displayMath: [['$$$','$$$']]},
  "HTML-CSS": {
    availableFonts: ["STIX"],
    preferredFont: "STIX",
    webFont: "STIX-Web",
    imageFont: null,
  },
  AsciiMath: {
    decimalsignAlternative: ","
  }
};
const mathJaxDefaultSymbol = [
  {input:"strike", tag:"menclose", output:"strike", atname:"notation", atval:"horizontalstrike", tex:"sout", ttype: "UNARY"},
  {input:"rlarw", tag:"mo", output:"\u21c4", tex:"\\rightleftarrows", ttype: "CONST" },
  {input:"permille", tag:"mo", output:"\u2030",  tex:"text{\\textperthousand}", ttype: "CONST"},
  {input:"nwarr", tag:"mo", output:"\u2196", tex:"nwarr;", ttype: "CONST"},
  {input:"nearr", tag:"mo", output:"\u2197", tex:"nearr;", ttype: "CONST"},
  {input:"searr", tag:"mo", output:"\u2198", tex:"searr;", ttype: "CONST"},
  {input:"swarr", tag:"mo", output:"\u2199", tex:"swarr;", ttype: "CONST"},
  {input:"+-", tag:"mo", output:"\u00B1", tex:"plusmn;", ttype: "CONST"},
  {input:"mcirc", tag:"mo", output:"\u26AA", ttype: "CONST"},
  {input:"mdiamond", tag:"mo", output:"\u2B26", ttype: "CONST"}
];
const mathJaxDefaultUrl = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-MML-AM_HTMLorMML';

const addMathJaxScript = (document, mathJaxCustomUrl, mathJaxCustomConfig, mathJaxCustomSymbol) => {
  const mathJaxUrl = mathJaxCustomUrl || mathJaxDefaultUrl;
  const mathJaxConfig = mathJaxCustomConfig || mathJaxDefaultConfig;
  const mathJaxSymbol = mathJaxCustomSymbol || mathJaxDefaultSymbol;
  const head = document.head;
  const script = document.createElement('script');
  script.type = 'text/x-mathjax-config';
  script.text = `
    MathJax.Hub.Register.StartupHook("AsciiMath Jax Config",() => {
      const mathJaxSymbol = ${JSON.stringify(mathJaxSymbol)};
      var AM = MathJax.InputJax.AsciiMath.AM;
      const symbols = [];
      for(i = 0; i < mathJaxSymbol.length; ++i) {
        const symbol = Object.assign({}, mathJaxSymbol[i]);
        symbol.ttype = AM.TOKEN[symbol.ttype];
        symbols.push(symbol);
      };
      AM.symbols.push(...symbols);
    });
    MathJax.Hub.Config(${JSON.stringify(mathJaxConfig)});
  `;
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
  let lastAMnode, copyMode, toggleMathButton, subscript, superscript, disableSubSup, runMathJax;
  editor.addCommand('toggleMathJax', () => {
    copyMode = !copyMode;
    toggleMathButton.active(copyMode);
    editor.undoManager.ignore(() => {
      if (copyMode) {
        editor.execCommand('removeMathJax');
      } else {
        editor.execCommand('runMathJax', editor.editorContainer.id);
      }
    });
  });
  editor.addCommand('runMathJax', element => {
    const MathJax = editor.contentWindow.MathJax;
    if (typeof element !== 'string' && !editor.getBody().contains(element)) {
      return;
    }
    runMathJax = true;
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
  });
  editor.addCommand('removeMathJax', () => {
    const MathJax = editor.contentWindow.MathJax;
    if (!MathJax) {
      return;
    }
    const allJax = MathJax.Hub.getAllJax();
    for (let i = 0, m = allJax.length; i < m; i++) {
      const jax = allJax[i];
      const jaxNode = editor.dom.get(jax.inputID);
      if (jaxNode) {
        const mathNode = jaxNode.parentNode;
        const plainText = removeJax(jax.originalText, jax.inputJax);
        mathNode.innerHTML = plainText;
      }
    }

    editor.dom.remove('MathJax_Message');
    const hidden = editor.dom.get('MathJax_Hidden');
    const fonts = editor.dom.get('MathJax_Font_Test');
    editor.dom.remove(hidden ? hidden.parentNode : '');
    editor.dom.remove(fonts ? fonts.parentNode : '');
  });
  const removeMathJax = () => {
    const MathJax = editor.contentWindow.MathJax;
    if (!MathJax) {
      return;
    }
    const allJax = MathJax.Hub.getAllJax();
    const fakeDom = editor.getDoc().cloneNode(true);
    for (let i = 0, m = allJax.length; i < m; i++) {
      const jax = allJax[i];
      const jaxNode = fakeDom.getElementById(jax.inputID);
      if (jaxNode) {
        const mathNode = jaxNode.parentNode;
        const plainText = removeJax(jax.originalText, jax.inputJax);
        mathNode.innerHTML = plainText;
      }
    }
    
    const MJMessage = fakeDom.getElementById('MathJax_Message');
    MJMessage && MJMessage.parentNode.removeChild(MJMessage);
    editor.dom.remove('MathJax_Message');
    const hidden = fakeDom.getElementById('MathJax_Hidden');
    const fonts = fakeDom.getElementById('MathJax_Font_Test');
    if (hidden) {
      const hiddenParent = hidden.parentNode;
      hiddenParent.parentNode.removeChild(hiddenParent);
    }
    if (fonts) {
      const fontsParent = fonts.parentNode;
      fontsParent.parentNode.removeChild(fontsParent);
    }
    return fakeDom.body.innerHTML;
  };

  const getAllJax = element => {
    const MathJax = editor.contentWindow.MathJax;
    const allJax = MathJax.Hub.getAllJax(element);
    return allJax;
  };
  const removeJax = (originalText, inputType) => {
    if (inputType === 'AsciiMath') {
      // Resolving problem with `a <b ` which will cut part of equation on editing
      // Exceptions:
      // a <=b
      // a <<b
      return `\`${originalText}\``.split(/<(?![=<])/).join('< ');
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
    if (!element) {
      return;
    }
    if (!element.parentNode) {
      return;
    }
    element.insertAdjacentHTML('afterEnd', '<span id="customBookmark2"></span>&nbsp;');
    const customBookMark = editor.dom.get('customBookmark2');
    const idx = Array.prototype.indexOf.call(customBookMark.parentNode.childNodes, customBookMark) + 2;
    editor.selection.setCursorLocation(customBookMark.parentNode, idx);
    editor.dom.remove('customBookmark2');
  };
  const exitAMmode = () => {
    if (lastAMnode) {
      const element = lastAMnode;
      lastAMnode = null;
      if (!copyMode) {
        const callback = () => editor.execCommand('runMathJax', element);
        editor.contentWindow.MathJax.Hub.Queue(callback);
      }
      return true;
    }
    return false;
  };
  const testAMclass = element => element.className == 'AM';
  editor.on('init', args => {
    addMathJaxScript(args.target.dom.doc, editor.getParam('mathjaxUrl'), editor.getParam('mathjaxConfig'), editor.getParam('mathjaxExtraSymbol'));
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
      if (exitAMmode()) {
        setCursorAfter(lastAMnode);
        event.stopPropagation();
        event.preventDefault();
      }
    }
  });
  editor.on('nodechange', (event, sumting) => {
    if (runMathJax) {
      runMathJax = false;
      return;
    }
    const element = event.element;
    const mathNode = testAMclass(element) ? element : editor.dom.getParent(element, testAMclass);
    disableSubSup = mathNode !== null;
    subscript.disabled(disableSubSup);
    superscript.disabled(disableSubSup);
    if (mathNode) {
      const allJax = getAllJax(mathNode);
      if (allJax.length) {
        const jax = allJax[0];
        const plainText = removeJax(jax.originalText, jax.inputJax);
        mathNode.innerHTML = plainText;
      }
      if (lastAMnode !== mathNode) {
        exitAMmode();
        // setCursorAfter(mathNode);
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
  editor.on('Copy', e => {
    copyMode = true;
    toggleMathButton.active(copyMode);
    editor.execCommand('removeMathJax');
  });
  editor.on('Undo', e => {
    copyMode = true;
    toggleMathButton.active(copyMode);
  });
  // FIXING UNDO BUG
  editor.on('BeforeAddUndo', e => {
    e.level.content = removeMathJax();
  });
  editor.on('PreProcess', () => {
    editor.undoManager.ignore(() => {
      copyMode = true;
      toggleMathButton.active(copyMode);
      editor.execCommand('removeMathJax');
    });
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
  const url = editor.getParam("document_base_url") + 'plugins/mathjax';

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

  editor.addButton('toggleMath', {
    tooltip : 'Copy math  (alt+m)',
    cmd : 'toggleMathJax',
    icon : 'copy',
    onpostrender: function () {
      toggleMathButton = this;
    }
  });

  editor.addButton('asciimathcharmap', {
    tooltip : 'Math Symbols',
    cmd : 'mceAsciimathDlg',
    image : url + '/img/ed_mathformula.gif'
  });

  editor.shortcuts.add('alt+m', 'same action as copy math button', 'toggleMathJax');
  editor.shortcuts.add('alt+b', 'same action as superscript button', () =>
    !disableSubSup && editor.execCommand('superscript')
  );
  editor.shortcuts.add('alt+n', 'same action as subscript button', () =>
    !disableSubSup && editor.execCommand('subscript')
  );

  editor.addButton('subscript', {
    cmd: "Subscript",
    icon: "subscript",
    onPostRender: function () {
      subscript = this;
    },
    tooltip: "Subscript (alt+n)",
  });

  editor.addButton('superscript', {
    cmd: "Superscript",
    icon: "superscript",
    onPostRender: function () {
      superscript = this;
    },
    tooltip: "Superscript (alt+b)",
  });

  editor.addButton('premium', {
    tooltip : 'Premium',
    text: 'Premium',
    onclick: function () {
      editor.insertContent('{premium}');
    },
  });
};

export default plugin;
