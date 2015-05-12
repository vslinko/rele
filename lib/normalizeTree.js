import mergeTrees from './mergeTrees';

export default function normalizeTree(query) {
  let normalized = {
    type: query.type,
    fields: query.fields || [],
    params: query.params || {},
    children: {}
  };

  if (query.include) {
    Object.keys(query.include).forEach(key => {
      normalized.children[key] = normalizeTree(query.include[key]);
    });
  }

  if (query.merge) {
    query.merge.forEach(toMerge => {
      normalized = mergeTrees(normalized, normalizeTree(toMerge));
    });
  }

  return normalized;
}
