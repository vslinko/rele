export default function mergeTrees(a, b) {
  if (a.type !== b.type) {
    throw new Error();
  }

  const normalized = {
    type: a.type,
    params: a.params,
    fields: a.fields.concat(b.fields),
    children: a.children
  };

  Object.keys(b.children).forEach(key => {
    if (normalized.children[key]) {
      normalized.children[key] = mergeTrees(normalized.children[key], b.children[key]);
    } else {
      normalized.children[key] = b.children[key];
    }
  });

  return normalized;
}
