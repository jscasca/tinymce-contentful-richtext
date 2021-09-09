// import * as Actions from './Actions';

import { KnownSDK } from '@contentful/app-sdk';
import { GetContentTitle, GetEntityStatus, GetEntryField, IsEntryType } from '../utils/Entities';
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

  // const updateEmbed = () => {
  // };

  // editor.on('drop', (a: any, b: any, c: any) => {
  //   console.log(a, b, c);
  //   a.preventDefault();
  // });

  // editor.on('BeforeExecCommand', (command: string, ui: boolean, value: any) => {
  //   //
  //   console.log(command, ui, value);
  // });

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
              console.log('entry query: ', entryQuery);
              const existingEntry = (entryQuery.items as any[]).filter((e: any) => true)[0];
              console.log('existing mention: ', existingEntry);
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
                    console.log('creating mention: ', nextUserEntry);
                    sdk.space.createEntry('mention', nextUserEntry).then((entry: any) => {
                      console.log('updating mention span by new: ', entry);
                      updateMention(doc.querySelectorAll(`span[mentionid='${node.attributes.map.mentionid}']`), entry);
                    });
                  }
                });
              }
            });
          } else if(node.attributes.map.contentfulid) {
            // any other embed
            sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
              const id = entry.sys.id;
              var doc = editor.getDoc();
              const nodeList = doc.querySelectorAll(`span[contentfulid='${id}']`);
              if (IsEntryType(entry, 'mention')) {
                updateMention(nodeList, entry);
              } else {
                for (const n of nodeList) {
                  // get the content, determine the status
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
      // parsing div:
      nodes.forEach((node: any) => {
        if (node.attributes.map.type === 'Asset') {
          sdk.space.getAsset(node.attributes.map.contentfulid).then((asset: any) => {
            // paste the asset
            const id = asset.sys.id;
            const nodeList = editor.getDoc().querySelectorAll(`div[contentfulid='${id}']`);
            for (const n of nodeList) {
              const assetHtml = GetAssetHtml(GetEntityStatus(asset), asset);
              console.log('asset html: ', assetHtml, n);
              n.innerHTML = GetAssetHtml(GetEntityStatus(asset), asset);
            }
          });
        }
        if (node.attributes.map.type === 'Entry') {
          sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
            const contentTypeId = entry.sys.contentType.sys.id;
            const content = GetContentTitle(entry);
            const entryId = entry.sys.id;
            console.log('converting: ', contentTypeId, content);

            sdk.space.getContentType(contentTypeId).then((contentType: any) => {
              const entryType = contentType.name;
              const doc = editor.getDoc();
              const nodeList = doc.querySelectorAll(`div[contentfulid='${entryId}']`);
              console.log(nodeList);
              for (const n of nodeList) {
                console.log(n);
                n.innerHTML = GetEntryHtml(GetEntityStatus(entry), content, entryType);
              }
            });
          });
        }
      });
    });

  });

};

export {
  setup
}