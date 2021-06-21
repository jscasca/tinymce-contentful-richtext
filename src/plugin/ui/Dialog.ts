import * as Utils from '../core/Utils';
import { GetContentTitle, GetEntityStatus } from '../utils/Entities';
import { GetAssetHtml, GetEntryHtml} from '../utils/HtmlTemplates';
// const makeDialog = () => {}

const extractFromAnchor = (editor: any, anchor: HTMLAnchorElement) => {
  const dom = editor.dom;
  const text = Utils.isOnlyTextSelected(editor) ? Utils.getAnchorText(editor.selection, anchor) : '';
  const url = anchor ? dom.getAttrib(anchor, 'href') : '';
  const id = anchor ? dom.getAttrib(anchor, 'contentfulid') : '';
  const type = anchor ? dom.getAttrib(anchor, 'type') : '';

  return {
    text,
    url,
    id,
    type
  }
};

const getEntityAttrs = (entity: any) => {
  return {
    href: '#',
    contentfulid: entity.sys.id,
    type: entity.sys.type
  }
};

const getInitialData = (text: string, url: string, select: 'url'|'entry'|'asset') => {
  return {
    url: {
      value: url,
      meta: {
        original: {
          value: url
        }
      }
    },
    text: text,
    linkSelect : select,
  }
};

const getLoaded = (content: string): any[] => {
  return [
    {
      name: 'removeSelection',
      text: 'Remove target',
      type: 'button',
      borderless: true
    }, {
      type: 'htmlpanel',
      html: content
    }
  ];
};

const getEmpty = (type: string): any[] => {
  return [{
    name: type === 'entry' ? 'selectEntry' : 'selectAsset',
    text: 'Select target',
    type: 'button',
    borderless: true
  }];
}

const getUrlBody = () => {
  return [{
    name: 'url',
    type: 'urlinput',
    filetype: 'file',
    label: 'URL'
  }]
}

const getTargetBody = (data: any): any[] => {
  if (data.initialData.linkSelect !== 'url') {
    //
    if (data.content) {
      return getLoaded(data.content);
    } else {
      return getEmpty(data.initialData.linkSelect);
    }
  }
  return getUrlBody();
};

const getWindowSpec = (editor: any, data: any, sdk: any) => {
  console.log('preparing dialog: ', data);
  const initialData = data.initialData; 
  const onAction = (api: any, details: any) => {
    if (details.name === 'removeSelection') {
      // clear from the cache
      const next = {
        cache: {
          entry: api.getData().linkSelect === 'entry' ? undefined : data.cache?.entry,
          asset: api.getData().linkSelect === 'asset' ? undefined : data.cache?.asset
        },
        initialData: data.initialData
      };
      api.redial(getWindowSpec(editor, next, sdk));
    }
    if (details.name === 'selectEntry') {
      api.block('Loading Entry');
      sdk.dialogs.selectSingleEntry().then((entry: any) => {
        const contentTypeId = entry.sys.contentType.sys.id;
          sdk.space.getContentType(contentTypeId).then((contentType: any) => {
            const content: string = GetEntryHtml(GetEntityStatus(entry), GetContentTitle(entry), contentType.name);
            const nextWindow = {
              cache: {
                entry: {
                  content: content,
                  entity: entry
                },
                asset: data.cache?.asset
              },
              content,
              entity: entry,
              initialData: data.initialData,
            };
            api.unblock();
            api.redial(getWindowSpec(editor, nextWindow, sdk));
          });
      });
    }
    if (details.name === 'selectAsset') {
      api.block('Loading asset');
      sdk.dialogs.selectSingleAsset().then((asset: any) => {
        const content: string = GetAssetHtml(GetEntityStatus(asset), asset);
        const nextWindow = {
          initialData: data.initialData,
          entity: asset,
          cache: {
            entry: data.cache?.entry,
            asset: {
              content: content,
              entity: asset
            }
          },
          content,
        };
        api.unblock();
        api.redial(getWindowSpec(editor, nextWindow, sdk));
      });
    }
  };
  const onChange = (api: any, details: any) => {
    if (details.name === 'linkSelect') {
      const type = api.getData().linkSelect;
      const next: any = {
        cache: data.cache,
        initialData: getInitialData(api.getData().text, api.getData().url?.value ? api.getData().url.value : '', api.getData().linkSelect)
      };
      if (data.cache && data.cache[type] !== undefined) {
        next.content = data.cache[type].content;
        next.entity = data.cache[type].entity
      }
      api.redial(getWindowSpec(editor, next, sdk));
    }
    if (details.name === 'text') {
      if (api.getData().text === '') {
        api.disable('save');
      } else {
        api.enable('save');
      }
    }
  };

  const onSubmit = (api: any) => {
    // attach link?
    const d = api.getData();
    if ((d.linkSelect === 'url' && !!d.url.value) || (d.linkSelect !== 'url' && data.entity !== undefined) ) {
      // link
      Utils.link(editor, {
        text: d.text,
        attrs: d.linkSelect === 'url' ? {href: d.url.value} : getEntityAttrs(data.entity)
      });
    } else {
      // unlink
      Utils.unlink(editor);
    }
    api.close();
  };

  const linkText = {
    name: 'text',
    type: 'input',
    label: 'Text to display'
  };

  const linkType = {
    type: 'selectbox',
    name: 'linkSelect',
    label: 'Link type',
    size: 1,
    items: [
      { value: 'url', text: 'URL' },
      { value: 'asset', text: 'Asset' },
      { value: 'entry', text: 'Entry' }
    ]
  };

  const target: any[] = getTargetBody(data);

  const body = {
    type: 'panel',
    items: [linkText, linkType, ...target]
  };
  //
  const spec = {
    title: 'Insert/Edit Link',
    size: 'normal',
    body,
    buttons: [
      {
        type: 'cancel',
        name: 'cancel',
        text: 'Cancel'
      },
      {
        type: 'submit',
        name: 'save',
        text: 'Save',
        primary: true
      }
    ],
    initialData,
    onSubmit,
    onChange,
    onAction
  };

  return spec;
};

const open = (editor: any, api: any) => {
  const anchorNode = Utils.getAnchorElement(editor);
  const anchor = extractFromAnchor(editor, anchorNode);
  const initialData = getInitialData(anchor.text, anchor.url, anchor.type === '' ? 'url' : anchor.type === 'Entry' ? 'entry' : 'asset');
  const spec = getWindowSpec(editor, {initialData}, api);
  // return { initialData };
    // const spec = getWindowSpec(editor, d, api);
    const dialog = editor.windowManager.open(spec);
    if (!!anchor.id) {
      if (anchor.type === 'Entry') {
        //
        dialog.block('Loading Entry');
        api.space.getEntry(anchor.id).then((entry: any) => {
          api.space.getContentType(entry.sys.contentType.sys.id).then((contentType: any) => {
            const content: string = GetEntryHtml(GetEntityStatus(entry), GetContentTitle(entry), contentType.name);
            dialog.unblock();
            dialog.redial(getWindowSpec(editor, { initialData, content }, api));
          });
        });
      } else {
        dialog.block('Loading Asset');
        api.space.getAsset(anchor.id).then((asset: any) => {
          // resolve with asset data
          const content: string = GetAssetHtml(GetEntityStatus(asset), asset);
          dialog.unblock();
          dialog.redial(getWindowSpec(editor, { initialData, content}, api));
        });
      }
    }
};

export {
  open
}