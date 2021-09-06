import * as Utils from './Utils';
import * as Dialog from '../ui/Dialog';

const openDialog = (editor: any, api: any) => () => {
  Dialog.open(editor, api);
};
const toggleState = (editor: any, toggler: (e: any) => void) => {
  editor.on('NodeChange', toggler);
  return () => editor.off('NodeChange', toggler);
};

const toggleActiveState = (editor: any) => (api: any) => toggleState(editor, () => {
  api.setActive(!editor.mode.isReadOnly() && Utils.getAnchorElement(editor, editor.selection.getNode()) !== null);
});

const toggleEnabledState = (editor: any) => (api: any) => {
  const updateState = () => api.setDisabled(Utils.getAnchorElement(editor, editor.selection.getNode()) === null);
  updateState();
  return toggleState(editor, updateState);
};

const toggleUnlinkState = (editor: any) => (api: any) => {
  const hasLinks = (parents: Node[]) => Utils.hasLinks(parents);
  // TBD hasLinks || hasLinksInSelection
  const parents = editor.dom.getParents(editor.selection.getStart());
  api.setDisabled(!hasLinks(parents));
  return toggleState(editor, (e) => api.setDisabled(!hasLinks(e.parents)));
};

const embed = (editor: any, id: string, type: string): void => {
  editor.insertContent(`<div class='mceNonEditable' contentfulid='${id}' type='${type}'></div><p><br data-mce-bogus='1'></p>`);
};

const embedAsset = (editor: any, sdk: any) => {
  sdk.dialogs.selectSingleAsset().then((entry: any) => {
    embed(editor, entry.sys.id, 'Asset');
  });
};

const embedEntry = (editor: any, sdk: any) => {
  sdk.dialogs.selectSingleEntry().then((entry: any) => {
    embed(editor, entry.sys.id, 'Entry');
  });
};

const embedInline = (editor: any, sdk: any) => {
  sdk.dialogs.selectSingleEntry().then((entry: any) => {
    editor.insertContent(`&nbsp<span class='mceNonEditable' contentfulid='${entry.sys.id}' type='Entry'></span>`);
  });
};

export {
  openDialog,
  embedAsset,
  embedEntry,
  embedInline,
  toggleActiveState,
  toggleEnabledState,
  toggleUnlinkState,
}