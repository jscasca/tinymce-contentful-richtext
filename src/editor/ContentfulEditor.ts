import { AstParser } from '../parser/AstParser';
import { JsonToHtml } from '../parser/JsonParser';
import { isEqual, throttle } from 'lodash';
import ContentfulPlugin from '../plugin/Plugin';

declare const tinymce: any;

export const ContentfulEditor = (sdk: any): void => {
  console.log('creating editor');
  const richText = sdk.field.type === 'RichText';
  console.log('is rich text: ', richText);
  if (richText) {
    // load external plugins
    console.log('loading external plugins');
    tinymce.PluginManager.add('contentful', ContentfulPlugin(sdk));
  }

  const getTinymce = () => {
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    return w && w.tinymce ? w.tinymce : null;
  };

  console.log('Preparing editor for: ', sdk.field.type);
  console.log('checking validations: ', sdk.field.validations);

  const validations = sdk.field.validations;
  let validNodes: string[] = [
    "text",
    "paragraph",
    "heading-1",
    "heading-2",
    "heading-3",
    "heading-4",
    "heading-6",
    "ordered-list",
    "unordered-list",
    "hr",
    "blockquote",
    "embedded-entry-block",
    "embedded-asset-block",
    "hyperlink",
    "entry-hyperlink",
    "asset-hyperlink",
    "embedded-entry-inline"
  ];
  validations.forEach((v: any) => {
    // handle all the diferrent validations somehow?
    if (v.enabledNodeTypes !== undefined) {
      console.log('valid nodes are: ', v.enabledNodeTypes);
      validNodes = (['text', 'paragraph']).concat(v.enabledNodeTypes);
    }
    //["heading-1", "heading-2", "heading-3", "heading-4", "heading-6", "ordered-list", "unordered-list", "hr", "blockquote", "embedded-entry-block", "embedded-asset-block", "hyperlink", "entry-hyperlink", "asset-hyperlink", "embedded-entry-inline"]
  });

  // Rich text validations: 
  // formatting: h1-h6, b, i, u, code, ul, ol, blockquote, hr
  // links: to url, to entry, to asset
  // embedded entries: entry, inline entry, asset


  if (sdk.field.type == 'RichText') {
    //
    console.log('Creating rich text editor');
    // get validations from: sdk.editor.editorInterface.controls => []
    // compare vs sdk.field.fieldId
    // find the field you want [3].field.validations => []
    // or sdk.field.validations
  }

  const parser = AstParser({
    validNodes: validNodes
  });

  const embed = (instance: any, id: string, type: string): void => {
    //<div class='mceNonEditable' contentfulid='${node.data.target.sys.id}' type='${node.data.target.sys.linkType}'></div>
    instance.insertContent(`<div class='mceNonEditable' contentfulid='${id}' type='${type}'></div><p><br data-mce-bogus='1'></p>`);
  };

  const embedEntry = (instance: any) => {
    sdk.dialogs.selectSingleEntry().then((entry: any) => {
      console.log('embedding entry: ', entry);
      embed(instance, entry.sys.id, 'Entry');
    });
  };

  const embedAsset = (instance: any) => {
    sdk.dialogs.selectSingleAsset().then((asset: any) => {
      console.log('embedding asset:', asset);
      embed(instance, asset.sys.id, 'Asset');
    });
  };

  const embedInline = (instance: any) => {
    sdk.dialogs.selectSingleEntry().then((entry: any) => {
      instance.insertContent(`<span class='mceNonEditable' contentfulid='${entry.sys.id}' type='Entry'></span>`);
    });
  };

  const validElements = [
    'p',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'strong/b',
    'em/i',
    'u',
    'code',
    'ol',
    'ul',
    'li',
    'img[style|alt]',
    '@[contentfulid|type<Entry?Asset]',
    'a[href]',
    '@[contenteditable|style|class]',
    'div[contenteditable|class]',
    'span[contenteditable|class]'
  ].join(',');

  const finalInit = {
    selector: '#editor',
    contextmenu: 'ctfLink',
    toolbar: 'ctfEmbed styleselect | bold italic underline | ctfLink | bullist numlist | blockquote hr |  embedentry ',
    min_height: 650,
    max_height: 1050,
    plugins: 'contentful noneditable lists hr ctfLink',
    valid_elements: validElements,
    valid_children: '+span[div]',
    setup: (editor: any) => {
      editor.ui.registry.addButton('embedentry', {
        icon: 'custom',
        text: 'Entry',
        tooltip: 'Embed entry',
        onAction: () => {
          embedEntry(editor);
        }
      });
      editor.ui.registry.addButton('embedasset', {
        icon: 'image',
        text: 'Asset',
        tooltip: 'Embed asset',
        onAction: () => {
          embedAsset(editor);
        }
      });
      editor.ui.registry.addButton('inlineentry', {
        text: 'Inline Entry',
        tooltip: 'Embed inline entry',
        onAction: () => {
          embedInline(editor);
        }
      });
      editor.ui.registry.addButton('inlineentry2', {
        icon: 'custom',
        text: 'Inline',
        onAction: () => {
          embedInline(editor);
        }
      });
      editor.ui.registry.addButton('saveobj', {
        icon: 'custom',
        tooltip: 'Save content',
        onAction: () => {
          console.log('saving: ');
          const doc = parser.parse(editor.getContent({format: 'tree'}));
          console.log(doc);
        }

      });
      editor.on('PostRender', () => {
        // editor.parser.addNodeFilter('a', (nodes: any[]): void => {
        //   nodes.forEach((node: any) => {
        //     if (node.attributes.map.contentfulid) {
        //       const id = node.attributes.map.contentfulid;
        //       if (node.attributes.map.type === 'Entry') {
        //         sdk.space.getEntry(id).then((entry: any) => {
        //           const nodeList = editor.getDoc().querySelectorAll(`a[contentfulid='${entry.sys.id}']`);
        //           for (const n of nodeList) {
        //             n.setAttribute('href', 'something.com');
        //           }
        //         });
        //       } else {
        //         sdk.space.getAsset(id).then((asset: any) => {
        //           console.log('asset', asset);
        //         });
        //       }
        //     }
        //   });
        // });
        // editor.parser.addNodeFilter('span', (nodes:any[]): void => {
        //   //
        //   nodes.forEach((node: any) => {
        //     if (node.attributes.map.type === 'Entry' && node.attributes.map.contentfulid) {

        //       sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
        //         const id = entry.sys.id;
        //         var doc = editor.getDoc();
        //         const nodeList = doc.querySelectorAll(`span[contentfulid='${id}']`);
        //         for (const n of nodeList) {
        //           // get the content, determine the status
        //           const content = GetContentTitle(entry);
        //           n.innerHTML = GetInlineEntryHtml(GetEntityStatus(entry), content);
        //         }
        //       });
        //     }
        //   });
        // // });
        // editor.parser.addNodeFilter('div', (nodes: any[]): void => {
        //   // parsing div:
        //   console.log('parsing div: ', nodes);
        //   nodes.forEach((node: any) => {
        //     if (node.attributes.map.type === 'Asset') {
        //       sdk.space.getAsset(node.attributes.map.contentfulid).then((asset: any) => {
        //         // paste the asset
        //         const id = asset.sys.id;
        //         const nodeList = editor.getDoc().querySelectorAll(`div[contentfulid='${id}']`);
        //         for (const n of nodeList) {
        //           const assetHtml = GetAssetHtml(GetEntityStatus(asset), asset);
        //           console.log('asset html: ', assetHtml, n);
        //           n.innerHTML = GetAssetHtml(GetEntityStatus(asset), asset);
        //         }
        //       });
        //     }
        //     if (node.attributes.map.type === 'Entry') {
        //       sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
        //         const contentTypeId = entry.sys.contentType.sys.id;
        //         const content = GetContentTitle(entry);
        //         const entryId = entry.sys.id;
        //         console.log('converting: ', contentTypeId, content);

        //         sdk.space.getContentType(contentTypeId).then((contentType: any) => {
        //           const entryType = contentType.name;
        //           const doc = editor.getDoc();
        //           const nodeList = doc.querySelectorAll(`div[contentfulid='${entryId}']`);
        //           console.log(nodeList);
        //           for (const n of nodeList) {
        //             console.log(n);
        //             n.innerHTML = GetEntryHtml(GetEntityStatus(entry), content, entryType);
        //           }
        //         });
        //       });
        //     }
        //   });
        // });
      });
    },
    init_instance_callback: (editor: any) => {

      let listening = true;

      const getEditorContent = () => {
        return richText ? parser.parse(editor.getContent({format:'tree'})) : editor.getContent();
      };
      const getApiContent = () => {
        return sdk.field.getValue() || '';
      };

      const setContent = (content: any) => {
        const apiContent = content || '';
        const editorContent = getEditorContent();
        if (!isEqual(editorContent, apiContent)) {
          editor.setContent(richText ? JsonToHtml(content) : content);
        }
      };

      console.log('seeting initial content: ', sdk.field.getValue());
      setContent(sdk.field.getValue());

      sdk.field.onValueChanged((fieldValue: any) => {
        console.log('value changed: ', fieldValue);
        if (listening) {
          setContent(fieldValue);
        }
      });

      const onEditorChange = () => {
        const editorContent = getEditorContent();
        console.log('saving: ', editorContent);
        const apiContent = getApiContent();
        if (!isEqual(editorContent, apiContent)) {
          listening = false;
          sdk.field.setValue(editorContent).then(() => {
            listening = true;
          }).catch((err: any) => {
            console.log('Error saving content', err);
            listening =true;
          });
        }
      }
      var throttledUpdate = throttle(onEditorChange, 500, {leading: true});
      editor.on('change keyup input setcontent blur', throttledUpdate);
    }
  };

  sdk.window.startAutoResizer();

  getTinymce().init(finalInit);
};