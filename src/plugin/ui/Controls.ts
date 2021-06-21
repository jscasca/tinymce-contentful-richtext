import * as Actions from '../core/Actions';

// api refers to the contentful api for entry/asset queries
const setupButtons = (editor: any, sdk: any) => {

  // Commands
  editor.addCommand('ctfLink', () => {
    Actions.openDialog(editor, sdk)();
  });

  // Shortcuts
  editor.addShortcut('Meta+K', '', () => {
    editor.execCommand('ctfLink');
  });

  // toolbar buttons
  editor.ui.registry.addToggleButton('ctfLink', {
    icon: 'link',
    tooltip: 'Insert/edit link',
    onAction: Actions.openDialog(editor, sdk),
    onSetup: Actions.toggleActiveState(editor)
  });

  editor.ui.registry.addButton('ctfUnlink', {
    icon: 'unlink',
    tooltip: 'Remove link',
    onAction: () => {console.log('unlinking');},
    onSetup: Actions.toggleUnlinkState(editor)
  });

  // Menu items
  editor.ui.registry.addMenuItem('ctfLink', {
    icon: 'link',
    text: 'Link...',
    shortcut: 'Meta+K',
    onAction: Actions.openDialog(editor, sdk)
  });

  editor.ui.registry.addMenuItem('ctfUnlink', {
    icon: 'unlink',
    text: 'Remove link',
    onAction: () => {console.log('unlinking');},
    onSetup: Actions.toggleUnlinkState(editor)
  });

  // Context menu
  editor.ui.registry.addContextMenu('ctfLink', {
    update: (element: any) => /*!hasLinks ? 'link' : */'ctfLink ctfUnlink'
  });

  // TBD Context toolbars
  // editor.ui.registry.addContextForm('quicklink', {});

  // Embeding
  const defaultEmbeds = ['embedded-entry-inline','embedded-asset-block','embedded-entry-block'];
  const allowedEmbeds = Array.isArray(sdk.field?.validations) ? sdk.field.validations.reduce((acc: string[], c: any)=>{
    return c.enabledNodeTypes ? c.enabledNodeTypes.filter((x: string) => defaultEmbeds.includes(x)) : acc;
  }, defaultEmbeds) : defaultEmbeds;
  const embeds = [
    {
      id: 'embedded-entry-inline',
      type: 'menuitem',
      text: 'Inline Entry',
      onAction: () => Actions.embedInline(editor, sdk)
    },
    {
      id: 'embedded-entry-block',
      type: 'menuitem',
      text: 'Entry',
      onAction: () => Actions.embedEntry(editor, sdk)
    },
    {
      id: 'embedded-asset-block',
      type: 'menuitem',
      text: 'Asset',
      onAction: () => Actions.embedAsset(editor, sdk)
    }
  ].filter((x: any) => allowedEmbeds.includes(x.id)).map(x => ({type: x.type,text: x.text,onAction: x.onAction}));
  console.log('embeds: ', embeds);
  editor.ui.registry.addMenuButton('ctfEmbed', {
    icon: 'plus',
    text: 'Embed',
    fetch: (callback: any) => {
      // filter from api
      callback(embeds);
    }
  });
        // editor.ui.registry.addButton('embedentry', {
      //   icon: 'custom',
      //   text: 'Entry',
      //   tooltip: 'Embed entry',
      //   onAction: () => {
      //     embedEntry(editor);
      //   }
      // });
      // editor.ui.registry.addButton('embedasset', {
      //   icon: 'image',
      //   text: 'Asset',
      //   tooltip: 'Embed asset',
      //   onAction: () => {
      //     embedAsset(editor);
      //   }
      // });
      // editor.ui.registry.addButton('inlineentry', {
      //   text: 'Inline Entry',
      //   tooltip: 'Embed inline entry',
      //   onAction: () => {
      //     embedInline(editor);
      //   }
      // });
      // editor.ui.registry.addButton('inlineentry2', {
      //   icon: 'custom',
      //   text: 'Inline',
      //   onAction: () => {
      //     embedInline(editor);
      //   }
      // });
      // editor.ui.registry.addButton('saveobj', {
      //   icon: 'custom',
      //   tooltip: 'Save content',
      //   onAction: () => {
      //     console.log('saving: ');
      //     const doc = parser.parse(editor.getContent({format: 'tree'}));
      //     console.log(doc);
      //   }

      // });
};

export {
  setupButtons
}