import { 
  BLOCKS,
  EMPTY_DOCUMENT,
  Document,
  TopLevelBlock,
  Block,
  Inline,
  Text,
  MARKS,
  INLINES,
  Link
} from '@contentful/rich-text-types';

enum NODE_TYPE {
  INLINE = 'inline',
  BLOCK = 'block',
  TEXT = 'text',
  UNK = ''
}

export const AstParser = (opts: any = {}) => {

  const blockNodes = [
    'p','h1','h2','h3','h4','h5','h6','ol','ul','li','blockquote','div','hr'
  ];

  const inlineNodes = [
    'span','em','strong', 'code', 'u', 'a'
  ];

  const textMarks: Record<string, string> = {
    'em': MARKS.ITALIC,
    'u': MARKS.UNDERLINE,
    'strong': MARKS.BOLD,
    'code': MARKS.CODE
  };

  const blockNodeTypes: Record<string, BLOCKS> = {
    'p': BLOCKS.PARAGRAPH,
    'h1': BLOCKS.HEADING_1,
    'h2': BLOCKS.HEADING_2,
    'h3': BLOCKS.HEADING_3,
    'h4': BLOCKS.HEADING_4,
    'h5': BLOCKS.HEADING_5,
    'h6': BLOCKS.HEADING_6,
    'ol': BLOCKS.OL_LIST,
    'ul': BLOCKS.UL_LIST,
    'li': BLOCKS.LIST_ITEM,
    'blockquote': BLOCKS.QUOTE
  };
  // console.log(blockNodeTypes);

  const validNodeTypes: string[] = Array.isArray(opts.validNodes) ? opts.validNodes : [];
  const isValidNode = (node: Block|Inline|Text): boolean => {
    return validNodeTypes.includes(node.nodeType);
  };
  console.log('Valid node types: ', validNodeTypes);
  //["heading-1", "heading-2", "heading-3", "heading-4", "heading-6", "ordered-list", "unordered-list", "hr", "blockquote", "embedded-entry-block", "embedded-asset-block", "hyperlink", "entry-hyperlink", "asset-hyperlink", "embedded-entry-inline"]

  const getTypeOfNode = (name: string) => {
    if (blockNodes.includes(name)) {
      return NODE_TYPE.BLOCK;
    }
    if (inlineNodes.includes(name)) {
      return NODE_TYPE.INLINE;
    }
    if (name === '#text') {
      return NODE_TYPE.TEXT;
    }
    return NODE_TYPE.UNK;
  };

  const isTopLevelBlock = (node: any): boolean => {
    const type = node?.nodeType ? node.nodeType : '';
    return type === BLOCKS.PARAGRAPH ||
      type === BLOCKS.HEADING_1 ||
      type === BLOCKS.HEADING_2 ||
      type === BLOCKS.HEADING_3 ||
      type === BLOCKS.HEADING_4 ||
      type === BLOCKS.HEADING_5 ||
      type === BLOCKS.HEADING_6 ||
      type === BLOCKS.OL_LIST ||
      type === BLOCKS.UL_LIST ||
      type === BLOCKS.HR ||
      type === BLOCKS.QUOTE ||
      type === BLOCKS.EMBEDDED_ENTRY ||
      type === BLOCKS.EMBEDDED_ASSET;
  }

  const parseNode = (node: any, marks: string[] = []): Array<Block | Inline | Text> => {
    if (node === undefined) return [];
    let content: Array<Block|Inline|Text> = [];
    const parsedNode = parseNodeContent(node, marks);
    content = content.concat(parsedNode);
    if (node.next) {
      content = content.concat(parseNode(node.next, marks));
    }
    return content.filter(n => isValidNode(n));
  };

  const parseHrNode = (): Block => {
    return {
      nodeType: BLOCKS.HR,
      content: [],
      data: {}
    }
  };

  const parseBlock = (node: any, marks: string[] = []): Array<Block> => {
    if (node.name === 'hr') {
      return [parseHrNode()];
    }
    if (node.name === 'div') {
      if (node.attributes?.map?.contentfulid && node.attributes?.map?.type) {
        return [parseEmbed(node)];
      }
    }
    const nodeType = blockNodeTypes[node.name];
    if (nodeType !== undefined) {
      const content = node.firstChild ? parseNode(node.firstChild, marks) : [];
      return [{
        nodeType: nodeType,
        content: content,
        data: {}
      }]
    }
    return [];
  };

  const parseUrlLink = (node: any, marks: string[] = []): Inline => {
    return {
      nodeType: INLINES.HYPERLINK,
      data: {
        uri: node.attributes?.map?.href
      },
      content: node.firstChild ? parseNode(node.firstChild, marks) as Array<Inline|Text> : []
    };
  };

  const parseEmbed = (node: any): Block => {
    return {
      nodeType: node.attributes?.map?.type === 'Asset' ? BLOCKS.EMBEDDED_ASSET : BLOCKS.EMBEDDED_ENTRY,
      data: {
        target: getNodeLinkTarget(node)
      },
      content: []
    }
  };

  const parseContentLink = (node: any, marks: string[] = []): Inline=> {
    const target = getNodeLinkTarget(node);
    return {
      nodeType: node.attributes?.map?.type === 'Asset' ? INLINES.ASSET_HYPERLINK : INLINES.ENTRY_HYPERLINK,
      data: {
        target: target
      },
      content: node.firstChild ? parseNode(node.firstChild, marks) as Array<Inline|Text> : []
    };
  };

  const getNodeLinkTarget = (node: any): Link<'Entry'|'Asset'>  => {
    return {
      sys: {
        id: node.attributes?.map?.contentfulid,
        linkType: node.attributes?.map?.type === 'Asset' ? 'Asset' : 'Entry',
        type: 'Link'
      }
    }
  };

  const parseInlineEmbeddedEntry = (node: any): Inline => {
    const target = getNodeLinkTarget(node);
    return {
      nodeType: INLINES.EMBEDDED_ENTRY,
      data: {
        target: target
      },
      content: []
    };
  };

  const parseInline = (node: any, marks: string[] = []): Array<Block|Inline|Text> => {
    const downstreamMarks = [...marks];
    const attrs = node.attributes;
    // Embeds should be inserted as `<span contentfulid='<id>' type='Entry|Asset'></span>`
    if (node.name === 'span' && attrs.map?.contentfulid !== undefined && attrs.map?.type !== undefined) {
      return [parseInlineEmbeddedEntry(node)];
    }
    if (node.name === 'a') {
      if (attrs.map?.contentfulid && attrs.map?.type) {
        return [parseContentLink(node)];
      }
      if (attrs.map?.href !== undefined) {
        return [parseUrlLink(node, marks)];
      }
    }
    const mark = textMarks[node.name];
    if (mark !== undefined) {
      if (!marks.includes(mark)) {
        downstreamMarks.push(mark);
      }
    }
    return node.firstChild ? parseNode(node.firstChild, downstreamMarks) : [];
  };

  const parseText = (node: any, marks: string[]): Array<Text> => {
    return [{
      nodeType: 'text',
      value: node.value,
      data: {},
      marks: marks.map((m) => {return {type:m}; })
    }]
  };

  // Ideally we want to use options here
  const parseNodeContent = (node: any, marks: string[] = []): Array<Block|Inline|Text> => {
    const nodeType = getTypeOfNode(node.name);
    switch(nodeType) {
      case NODE_TYPE.BLOCK:
        return parseBlock(node, marks);
      case NODE_TYPE.INLINE:
        return parseInline(node, marks);
      case NODE_TYPE.TEXT:
        return parseText(node, marks);
    }
    return [];
  };

  const parseTopLevelBlock = (node: any): TopLevelBlock[] => {
    let content: TopLevelBlock[] = [];
    const firstNode = parseNodeContent(node);
    // TODO: check the node is toplevel
    content = content.concat(firstNode as TopLevelBlock[]);
    if (node.next) {
      content = content.concat(parseTopLevelBlock(node.next));
    }
    return content.filter(n => isTopLevelBlock(n)).filter(n => isValidNode(n));
  };

  const parseBody = (body: any): Document => {
    const cDoc = EMPTY_DOCUMENT;
    cDoc.content = parseTopLevelBlock(body.firstChild);
    cDoc.data = {};
    return cDoc;
  };
  
  const parse = (astNode: any): Document => {
    return parseBody(astNode);
  };

  return {
    parse
  }
}