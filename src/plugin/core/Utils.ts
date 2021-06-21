const isAnchor = (elm: Node): elm is HTMLAnchorElement => elm && elm.nodeName.toLowerCase() === 'a';
const isLink = (elm: Node): elm is HTMLAnchorElement => isAnchor(elm) && !!getHref(elm);

const getHref = (elm: Element): string | null => {
  // Returns the real href value not the resolved a.href value
  const href = elm.getAttribute('data-mce-href');
  return href ? href : elm.getAttribute('href');
};

const getAnchorElement = (editor: any, selectedElm?: Element): HTMLAnchorElement => {
  selectedElm = selectedElm || editor.selection.getNode();
  return editor.dom.getParent(selectedElm, 'a[href]') as HTMLAnchorElement;
};

const trimCaretContainers = (text: string): string => text.replace(/\uFEFF/g, '');

const getAnchorText = (selection: any, anchorElm: HTMLAnchorElement) => {
  const text = anchorElm ? (anchorElm.innerText || anchorElm.textContent) : selection.getContent({ format: 'text' });
  return trimCaretContainers(text);
};

const hasLinks = (elements: Node[]) => [...elements].filter(isLink).length > 0;

const isOnlyTextSelected = (editor: any) => {
  // Allow anchor and inline text elements to be in the selection but nothing else
  const inlineTextElements = editor.schema.getTextInlineElements();
  const isElement = (elm: Node): elm is Element => elm.nodeType === 1 && !isAnchor(elm) && !(inlineTextElements[elm.nodeName.toLowerCase()]);

  const collectNodesInRange = (rng: Range, predicate: any): any[] => {
    return [];
  };
  // Collect all non inline text elements in the range and make sure no elements were found
  const elements = collectNodesInRange(editor.selection.getRng(), isElement);
  return elements.length === 0;
}

const updateLink = (editor: any, anchorElm: HTMLAnchorElement, text: string, linkAttrs: Record<string, string>) => {
  // If we have text, then update the anchor elements text content
  if (anchorElm.hasOwnProperty('innerText')) {
    anchorElm.innerText = text;
  } else {
    anchorElm.textContent = text;
  }

  editor.dom.setAttribs(anchorElm, linkAttrs);
  editor.selection.select(anchorElm);
};

const createLink = (editor: any, text: string, linkAttrs: Record<string, string>) => {
  editor.insertContent(editor.dom.createHTML('a', linkAttrs, editor.dom.encode(text)));
};

const link = (editor: any, data: any) => {
  const selectedElm = editor.selection.getNode();
  const anchorElm = getAnchorElement(editor, selectedElm);

  editor.undoManager.transact(() => {

    if (anchorElm) {
      editor.focus();
      updateLink(editor, anchorElm, data.text, data.attrs);
    } else {
      createLink(editor, data.text, data.attrs);
    }
  });
};

const unlinkSelection = (editor: any) => {
  const dom = editor.dom, selection = editor.selection;
  const bookmark = selection.getBookmark();
  const rng = selection.getRng().cloneRange();

  // Extend the selection out to the entire anchor element
  const startAnchorElm = dom.getParent(rng.startContainer, 'a[href]', editor.getBody());
  const endAnchorElm = dom.getParent(rng.endContainer, 'a[href]', editor.getBody());
  if (startAnchorElm) {
    rng.setStartBefore(startAnchorElm);
  }
  if (endAnchorElm) {
    rng.setEndAfter(endAnchorElm);
  }
  selection.setRng(rng);

  // Remove the link
  editor.execCommand('unlink');
  selection.moveToBookmark(bookmark);
};

const unlink = (editor: any) => {
  editor.undoManager.transact(() => {
    unlinkSelection(editor);
    editor.focus();
  });
};

export {
  link,
  unlink,
  hasLinks,
  getAnchorElement,
  getAnchorText,
  isOnlyTextSelected
}