// import * as Actions from './Actions';

import { GetContentTitle, GetEntityStatus } from '../utils/Entities';
import { GetInlineEntryHtml, GetAssetHtml, GetEntryHtml } from '../utils/HtmlTemplates';

// api refers to the contentful api for entry/asset queries
const setup = (editor: any, sdk: any) => {

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
        if (node.attributes.map.type === 'Entry' && node.attributes.map.contentfulid) {

          sdk.space.getEntry(node.attributes.map.contentfulid).then((entry: any) => {
            const id = entry.sys.id;
            var doc = editor.getDoc();
            const nodeList = doc.querySelectorAll(`span[contentfulid='${id}']`);
            for (const n of nodeList) {
              // get the content, determine the status
              const content = GetContentTitle(entry);
              n.innerHTML = GetInlineEntryHtml(GetEntityStatus(entry), content);
            }
          });
        } else if(node.attributes.map.type === 'Mention' && node.attributes.map.userid) {
          // find entry (if fails) then create entry
          sdk.space.getEntries({
            'content_type': 'author',

          }).then((entries: any) => {
            // filter entries
            console.log(entries);
          });
        }
      });
    });

    editor.parser.addNodeFilter('div', (nodes: any[]): void => {
      // parsing div:
      console.log('parsing div: ', nodes);
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