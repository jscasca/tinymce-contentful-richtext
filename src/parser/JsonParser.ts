import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { BLOCKS, INLINES, Mark, MARKS, Text } from '@contentful/rich-text-types';

const wrapInTag = (mark: Mark, content: string): string => {
  switch(mark.type) {
    case MARKS.BOLD: return `<strong>${content}</strong>`;
    case MARKS.ITALIC: return `<em>${content}</em>`;
    case MARKS.UNDERLINE: return `<u>${content}</u>`;
    case MARKS.CODE: return `<code>${content}</code>`;
  }
  return content;
}

const parseLink = (entity: any): string => {
  console.log('parsing link entity: ', entity);
  const content = entity.content.reduce((content: string, textNode: Text) => {
    let value = textNode.value;
    for (const mark of textNode.marks) {
      value = wrapInTag(mark, value);
    }
    return content + value;
  }, '');
  return `<a href='#' contentfulid='${entity.data.target.sys.id}' type='${entity.data.target.sys.linkType}'>${content}</a>`;
}

export const JsonToHtml = (doc: any) => {
  // set custom entries
  const options = {
    renderNode: {
      [BLOCKS.EMBEDDED_ENTRY]: (node: any) => {
        return `<div class='mceNonEditable' contentfulid='${node.data.target.sys.id}' type='${node.data.target.sys.linkType}'></div>`;
      },
      [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
        return `<div class='mceNonEditable' contentfulid='${node.data.target.sys.id}' type='${node.data.target.sys.linkType}'></div>`;
      },
      [INLINES.EMBEDDED_ENTRY]: (node: any) => {
        return `<span class='mceNonEditable' contentfulid='${node.data.target.sys.id}' type='${node.data.target.sys.linkType}'></span>`;
      },
      [INLINES.ASSET_HYPERLINK]: (node: any) => {
        return parseLink(node);
      },
      [INLINES.ENTRY_HYPERLINK]: (node: any) => {
        return parseLink(node);
      },
    }
  };

  return documentToHtmlString(doc, options);
};