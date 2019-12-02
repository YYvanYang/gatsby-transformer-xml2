const parser = require('fast-xml-parser');
const _ = require(`lodash`);

// todo: move this options to plugin config file
const options = {
  allowBooleanAttributes: false,
  attrNodeName: false,
  attributeNamePrefix: '@_',
  cdataPositionChar: 'c',
  cdataTagName: false,
  decodeHTMLchar: false,
  ignoreAttributes: true,
  ignoreNameSpace: false,
  localeRange: '',
  parseAttributeValue: undefined,
  parseNodeValue: true,
  textNodeName: '#text',
  trimValues: true
};

async function onCreateNode({
  node,
  actions,
  loadNodeContent,
  createNodeId,
  createContentDigest
}) {
  // We only care about XML content.
  if (![`application/xml`, `text/xml`].includes(node.internal.mediaType)) {
    return;
  }

  const { createNode, createParentChildLink } = actions;

  const content = await loadNodeContent(node);
  const parsedContent = parser.parse(content, options);

  if (
    !parsedContent.Presentation ||
    !Array.isArray(parsedContent.Presentation.Slides)
  ) {
    return;
  }

  parsedContent.Presentation.Slides.forEach((obj, i) => {
    transformObject(
      obj,
      obj.id ? obj.id : createNodeId(`${node.id} [${i}] >>> XML`)
    );
  });

  function transformObject(obj, id) {
    const xmlNode = {
      ...obj,
      id,
      children: [],
      parent: node.id,
      internal: {
        contentDigest: createContentDigest(obj),
        type: _.upperFirst(_.camelCase(`${node.name} xml`))
      }
    };
    createNode(xmlNode);
    createParentChildLink({ parent: node, child: xmlNode });
  }
}

exports.onCreateNode = onCreateNode;
