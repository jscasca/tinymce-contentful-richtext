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
    toolbar: 'styleselect | bold italic underline | ctfLink | bullist numlist | blockquote hr |  ctfEmbed',
    min_height: 650,
    max_height: 1050,
    plugins: 'contentful noneditable lists hr',
    valid_elements: validElements,
    valid_children: '+span[div]',
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