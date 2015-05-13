import mergeArrays from '../mergeArrays';
import traverse from './traverse';

function mergeIncludes(a, b) {
  const includes = {};

  a.forEach(include => {
    includes[include.name] = include;
  });

  b.forEach(include => {
    if (includes[include.name]) {
      includes[include.name].class = mergeClasses(includes[include.name].class, include.class);
    } else {
      includes[include.name] = include;
    }
  });

  return Object.keys(includes).map(key => includes[key]);
}

function mergeClasses(a, b) {
  if (a.name !== b.name) {
    throw new Error();
  }

  a.block.fields = mergeArrays(a.block.fields, b.block.fields);
  a.block.includes = mergeIncludes(a.block.includes, b.block.includes);

  if (b.block.classes.length > 0) {
    throw new Error('Never should be here');
  }

  return a;
}

export default function optimize(ast) {
  return traverse(ast, (node, parentNode) => {
    switch (node.type) {
      case 'class':
        if (!node.name) {
          node.name = node.block.classes.map(k => k.name).shift();
        }
        if (!node.name) {
          throw new Error();
        }
        node = node.block.classes.reduce(mergeClasses, node);
        node.block.classes = [];
        break;
    }

    return node;
  });
}
