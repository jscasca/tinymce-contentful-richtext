import { AstParser } from '../parser/AstParser';
import { JsonToHtml } from '../parser/JsonParser';
import { isEqual, throttle } from 'lodash';
import ContentfulPlugin from '../plugin/Plugin';
import { KnownSDK } from '@contentful/app-sdk';
import { GetEntryField } from '../plugin/utils/Entities';

declare const tinymce: any;

export const ContentfulEditor = (sdk: any): void => {
  
  const user = sdk.user;
  const richText = sdk.field.type === 'RichText';

  const getTinymce = () => {
    const w = typeof window !== 'undefined' ? (window as any) : undefined;
    return w && w.tinymce ? w.tinymce : null;
  };

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
    if (v.enabledNodeTypes !== undefined) {
      validNodes = (['text', 'paragraph']).concat(v.enabledNodeTypes);
    }
    //["heading-1", "heading-2", "heading-3", "heading-4", "heading-6", "ordered-list", "unordered-list", "hr", "blockquote", "embedded-entry-block", "embedded-asset-block", "hyperlink", "entry-hyperlink", "asset-hyperlink", "embedded-entry-inline"]
  });

  // Rich text validations: 
  // formatting: h1-h6, b, i, u, code, ul, ol, blockquote, hr
  // links: to url, to entry, to asset
  // embedded entries: entry, inline entry, asset
  if (richText) {
    tinymce.PluginManager.add('contentful', ContentfulPlugin(sdk));
    //
    // console.log('Creating rich text editor');
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
    'img[style|alt|src]',
    '@[contentfulid|type<Entry?Asset?Mention|mentionid]',
    'a[href]',
    '@[contenteditable|style|class]',
    'div[contenteditable|class|img|style]',
    'span[contenteditable|class]'
  ].join(',');

  // Currently images are handled by a nodeFilter
  const imageUploader = (data: any, success: (url: string) => void, failure: (err: string, options?: any) => void) => {
    const src = 'data:' + data.blob().type + ';base64,' + data.base64();
    success(src);
  };


  let lastAccess = Date.now();
  let cache: any;
  const getUsers = (api: KnownSDK) => {
    // cache and clean
    if (!cache || (Date.now() - lastAccess) > 10000) {
      return new Promise((resolve, reject) => {
        api.space.getUsers().then((users: any) => {
          resolve(users)
        }).catch(_ => reject());
      });
    } else {
      return Promise.resolve(cache);
    }
  };

  interface MentionUser {
    id: string;
    name: string;
    image?: string;
    description?: string;
  };

  interface MentionQuery {
    term: string
  }

  const mentionsFetch = (query: MentionQuery, success: (users: MentionUser[]) => void) => {
    getUsers(sdk).then((users: any) => {
      const mentions = (users.items as []).filter((u:any) => {
        return `${u.firstName} ${u.lastName}`.toLowerCase().indexOf(query.term.toLowerCase()) !== -1;
      }).map((u:any) => {
        return {
          id: u.sys.id,
          name: `${u.firstName} ${u.lastName}`,
          image: u.avatarUrl,
        }
      }).slice(0,10);
      success(mentions);
    });
  };

  const toolbar = ((sdk.parameters?.instance as any).toolbar || '').trim();
  const richToolbar = toolbar !== '' ? toolbar : 'styleselect | bold italic underline | ctfLink | bullist numlist | blockquote hr |  ctfEmbed language';
  const longToolbar = toolbar !== '' ? toolbar : 'styleselect | bold italic underline | ctfLink | bullist numlist | blockquote hr |  addcomment showcomments language';

  const plugins = ((sdk.parameters?.instance as any).plugins || '').trim();
  const defaultRichTextPlugins = 'contentful noneditable lists hr';
  // const defaultRichTextPremiumPlugins = 'contentful noneditable lists hr a11ychecker advcode mentions powerpaste tinymcespellchecker';
  const defaultPlugins = 'lists table advtable hr';
  // const defaultPremiumPlugins = 'lists table advtable hr a11ychecker advcode tinycomments mentions tinymcespellchecker powerpaste';
  const richPlugins = plugins !== '' ? plugins : defaultRichTextPlugins; 
  const textPlugins = plugins !== '' ? plugins : defaultPlugins;

  const richConf = {
    paste_data_images: true,
    powerpaste_allow_local_images: false,
    images_upload_handler: imageUploader,
    valid_elements: validElements,
    valid_children: '+span[div],-p[div],-p[img]',
    contextmenu: 'ctfLink',
    plugins: richPlugins,
    toolbar: richToolbar,
    mentions_fetch: mentionsFetch,
    mentions_menu_complete: (editor:any, userInfo: MentionUser) => {
      const span = editor.getDoc().createElement('span');
      span.className = 'mention';
      span.setAttribute('type', 'Entry');
      span.setAttribute('mentionid', userInfo.id);
      span.appendChild(editor.getDoc().createTextNode('@' + userInfo.name));
      return span;
    },
    mentions_select: (mention: any, success: any) => {
      const contentfulid = mention.getAttribute('contentfulid');
      const div = document.createElement('div');
      if (contentfulid) {
        sdk.space.getEntry(contentfulid).then((entry) => {
          const name = GetEntryField(entry, 'name');
          const avatar = GetEntryField(entry, 'avatar');
          div.innerHTML = `<div style='border:1px solid black'><img src='${avatar}' style='width:50px;height:50px;float:left;'/><h3>${name}</h3></div>`
        });
      }
      success(div);
    },
  };

  const textConf = {
    plugins: textPlugins,
    toolbar: longToolbar,
    tinycomments_author: `${user.sys.id}`,
    tinycomments_author_name: `${user.firstName} ${user.lastName}`,
    tinycomments_mode: 'embedded',
    mentions_fetch: mentionsFetch,
    mentions_menu_complete: (editor: any, userInfo: MentionUser) => {
      const span = editor.getDoc().createElement('span');
      span.className = 'mention';
      span.setAttribute('data-mention-id', userInfo.id);
      span.appendChild(editor.getDoc().createTextNode('@' + userInfo.name));
      return span;
    },
    mentions_select: (mention: HTMLDivElement, success: (any: HTMLDivElement) => void) => {
      const id = mention.getAttribute('data-mention-id');
      sdk.space.getUsers().then((users:any) => {
        const user: any = (users.items as []).filter((u:any) => u.sys.id === id)[0];
        const div = document.createElement('div');
        div.innerHTML = `<div style='border:1px solid black'><img src='${user.avatarUrl}' style='width:50px;height:50px;float:left;'/><h3>${user.firstName} ${user.lastName}</h3></div>`;
        success(div);
      });
    }
  };

  const finalInit = {
    selector: '#editor',
    min_height: 650,
    max_height: 1050,
    spellchecker_language: 'en',
    powerpaste_html_import: 'prompt',
    powerpaste_googledocs_import: 'prompt',
    powerpaste_word_import: 'prompt',
    powerpaste_allow_local_images: false,
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

      setContent(sdk.field.getValue());

      sdk.field.onValueChanged((fieldValue: any) => {
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
            listening =true;
          });
        }
      }
      var throttledUpdate = throttle(onEditorChange, 500, {leading: true});
      editor.on('change keyup input setcontent blur', throttledUpdate);
    }
  };

  sdk.window.startAutoResizer();

  getTinymce().init({...finalInit, ...richText? richConf : textConf});
};