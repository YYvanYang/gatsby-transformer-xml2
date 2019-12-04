const parser = require('fast-xml-parser');
const _ = require(`lodash`);
const fs = require('fs');

// todo: move this options to plugin config file
const options = {
  allowBooleanAttributes: false,
  attrNodeName: "attr",
  attributeNamePrefix: "@_",
  cdataPositionChar: "\c",
  cdataTagName: false,
  decodeHTMLchar: false,
  ignoreAttributes: false,
  ignoreNameSpace: false,
  localeRange: "",
  parseAttributeValue: undefined,
  parseNodeValue: true,
  textNodeName: "#text",
  trimValues: true
};

async function onCreateNode({
  node,
  actions,
  createNodeId,
  createContentDigest
}) {
  // We only care about XML content.
  if (![`application/xml`, `text/xml`].includes(node.internal.mediaType)) {
    return;
  }

  const { createNode, createParentChildLink } = actions;

  // const content = await loadNodeContent(node);

  const parsedContent = await readFile(node.absolutePath)

  if (!parsedContent.Presentation || !parsedContent.Presentation.Slides || !Array.isArray(parsedContent.Presentation.Slides.Slide)) {
    return;
  }

  parsedContent.Presentation.Slides.Slide.forEach((obj, i) => {
    const id = objId(obj, i) + node.id
    transformObject(obj, id);
  });


  function readFile(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(
        filepath,
        'utf16le',
        (err, xmlData) => {
          if (err) reject(err);

          const parsedContent = parser.parse(xmlData, options);
          resolve(parsedContent)
        }
      );
    })
  }

  function objId(obj, i) {
   
    if (obj.attr) {
      if (obj.attr["@_id"]) {
        return obj.attr["@_id"]
      }
    }

    return createNodeId(`${node.id} [${i}] >>> XML`)
  }

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
