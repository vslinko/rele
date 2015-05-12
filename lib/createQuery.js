import mergeArrays from './mergeArrays';

export default function createQuery(tree, urlMatcher) {
  const baseUrl = urlMatcher(tree.type, tree.params);
  const fields = {};
  const include = [];

  function mergeFields(tree) {
    if (!fields[tree.type]) {
      fields[tree.type] = []
    }

    fields[tree.type] = mergeArrays(fields[tree.type], tree.fields);
  }

  function recursive(children, prefix) {
    Object.keys(children).forEach(key => {
      include.push(`${prefix}${key}`);
      const child = children[key];
      mergeFields(child);
      recursive(child.children, `${key}.`);
    });
  }

  mergeFields(tree);
  recursive(tree.children, '');

  return {
    baseUrl,
    fields,
    include
  };
}
