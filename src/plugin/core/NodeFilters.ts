// import * as Actions from './Actions';

import { KnownSDK } from '@contentful/app-sdk';
import { GetContentTitle, GetEntityStatus, GetEntryField, IsEntryType, Status } from '../utils/Entities';
import { GetInlineEntryHtml, GetAssetHtml, GetEntryHtml } from '../utils/HtmlTemplates';

// api refers to the contentful api for entry/asset queries
const setup = (editor: any, sdk: KnownSDK) => {

  const updateMention = (nodes: any, entry: any) => {
    // const nodeList = doc.querySelectorAll(`span[mentionid='${node.attributes.map.mentionid}']`);
    for(const n of nodes) {
      n.className = 'mention';
      n.setAttribute('contentfulid', entry.sys.id);
      n.setAttribute('data-mce-mentions-id', entry.sys.id);
      n.setAttribute('mentionid', entry.sys.id);
      n.innerHTML = '@' + GetEntryField(entry, 'name');
    }
  };

  editor.on('PostRender', () => {

    editor.parser.addNodeFilter('a', (nodes: any[]): void => {
      nodes.forEach((node: any) => {
        if (node.attributes.map.contentfulid) {
          const id = node.attributes.map.contentfulid;
          if (node.attributes.map.type === 'Entry') {
            sdk.space.getEntry(id).then((entry: any) => {
              const nodeList = editor.getDoc().querySelectorAll(`a[contentfulid='${entry.sys.id}']`);
              for (const n of nodeList) {
                n.setAttribute('href', 'something.com');
              }
            });
          } else {
            sdk.space.getAsset(id).then((asset: any) => {
              console.log('asset', asset);
            });
          }
        }
      });
    });
    editor.parser.addNodeFilter('span', (nodes:any[]): void => {
      //
      nodes.forEach((node: any) => {
        if (node.attributes.map.type === 'Entry') {
          if (node.attributes.map.mentionid) {
            // it's a mention
            const doc = editor.getDoc();
            console.log('filtering mention: ', node);
            sdk.space.getEntries({
              'content_type': 'mention',
              'fields.id': node.attributes.map.mentionid
            }).then((entryQuery: any) => {
              //// filter the entry
              const existingEntry = (entryQuery.items as any[]).filter((e: any) => true)[0];
              if (existingEntry) {
                console.log('updating mention span by existing');
                updateMention(doc.querySelectorAll(`span[mentionid='${node.attributes.map.mentionid}']`), existingEntry);
              } else {
                sdk.space.getUsers().then((userQuery: any) => {
                  console.log('user query: ', userQuery)
                  const user: any = (userQuery.items as []).filter((u: any) => u.sys.id === node.attributes.map.mentionid)[0];
                  console.log('user found: ', user);
                  if (user) {
                    const nextUserEntry = {
                      sys: {/*id: user.sys.id*/},
                      fields: {
                        id: {'en-US': `${user.sys.id}`},
                        name: {'en-US': `${user.firstName} ${user.lastName}`},
                        description: {},
                        avatar: {'en-US': `${user.avatarUrl}`}
                      }
                    };
                    sdk.space.createEntry('mention', nextUserEntry).then((entry: any) => {
                      updateMention(doc.querySelectorAll(`span[mentionid='${node.attributes.map.mentionid}']`), entry);
                    });
                  }
                });
              }
            });
          } else if(node.attributes.map.contentfulid) {
            sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
              const id = entry.sys.id;
              var doc = editor.getDoc();
              const nodeList = doc.querySelectorAll(`span[contentfulid='${id}']`);
              if (IsEntryType(entry, 'mention')) {
                updateMention(nodeList, entry);
              } else {
                for (const n of nodeList) {
                  const content = GetContentTitle(entry);
                  n.innerHTML = GetInlineEntryHtml(GetEntityStatus(entry), content);
                }
              }
            });
          }
        }
      });
    });

    editor.parser.addNodeFilter('div', (nodes: any[]): void => {
      nodes.forEach((node: any) => {
        if (node.attributes.map.type === 'Asset') {
          sdk.space.getAsset(node.attributes.map.contentfulid).then((asset: any) => {
            const id = asset.sys.id;
            const nodeList = editor.getDoc().querySelectorAll(`div[contentfulid='${id}']`);
            for (const n of nodeList) {
              n.innerHTML = GetAssetHtml(GetEntityStatus(asset), asset);
            }
          });
        }
        if (node.attributes.map.type === 'Entry') {
          sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
            const contentTypeId = entry.sys.contentType.sys.id;
            const content = GetContentTitle(entry);
            const entryId = entry.sys.id;

            sdk.space.getContentType(contentTypeId).then((contentType: any) => {
              const entryType = contentType.name;
              const doc = editor.getDoc();
              const nodeList = doc.querySelectorAll(`div[contentfulid='${entryId}']`);
              for (const n of nodeList) {
                n.innerHTML = GetEntryHtml(GetEntityStatus(entry), content, entryType);
              }
            });
          });
        }
      });
    });

    const hasParent = (node: any, fn: (node: any) => boolean) => {
      let n = node;
      while (n = n.parent) {
        if (fn(n)) {
          return true;
        }
      }
      return false;
    };

    const getMimeType = (base64: string, d: string = 'image/png'): string => {
      const potentialType = base64.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/);
      return potentialType !== null ? potentialType[0] : d;
    }

    const getExtension = (mimeType: string, d: string = 'png'): string => {
      const mimeMap = {
        'image/png': 'png',
        'image/gif': 'gif',
        'image/jpeg': 'jpeg',
        'image/svg+xml': 'svg'
      };
      return mimeMap[mimeType] ? mimeMap[mimeType] : d;
    }

    const uuid = () => {
      let dt = new Date().getTime();
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = (dt + Math.random()*16)%16 | 0
          dt = Math.floor(dt/16)
          return (c=='x' ? r :(r&0x3|0x8)).toString(16)
      });
      return uuid;
  }

    editor.parser.addNodeFilter('img', (nodes: any[]): void => {
      nodes.forEach((node: any) => {
        if (!hasParent(node, (n) => (n.name == 'div' && (n.attributes.map['contentfulid'] || n.attributes.map['img'])))) {
          if (node.attributes.map.src) {
            const image = node.attributes.map.src;
            const base64 = image.split(',')[1];
            const mimeType = getMimeType(image);
            const id = uuid();
            const assetNode = editor.parser.parse('<div img="' + id +'">' + GetAssetHtml(Status.PENDING, {src: image, title: 'Pending asset upload...'}) + '</div>');
            node.replace(assetNode);
            sdk.space.createUpload(base64).then((upload: any) => {
              return sdk.space.createAsset({
                fields: {
                  title: {
                    'en-US': upload.sys.id
                  },
                  file: {
                    'en-US': {
                      contentType: mimeType,
                      fileName: upload.sys.id + '.' + getExtension(mimeType),
                      uploadFrom: {
                        sys: {
                          type: "Link",
                          linkType: "Upload",
                          id: upload.sys.id
                        }
                      }
                    }
                  }
                }
              });
            }).then((asset: any) => {
              return sdk.space.processAsset(asset, 'en-US');
            }).then((asset: any) => {
              const doc = editor.getDoc();
              const nodeList = doc.querySelectorAll(`div[img='${id}']`);
              for (const n of nodeList) {
                n.innerHTML = GetAssetHtml(GetEntityStatus(asset), asset);
                n.removeAttribute('img');
                n.setAttribute('contentfulid', asset.sys.id);
                n.setAttribute('type', 'Asset')
                n.setAttribute('contenteditable', false);
              }
              editor.fire('change');
            });
          }
        }
      });
    });

  });

};

export {
  setup
}