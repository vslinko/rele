function createUrl(baseUrl, fields, include, params = []) {
  params = params.slice();

  if (include.length > 0) {
    params.push(`include=${include.join(',')}`);
  }

  Object.keys(fields).forEach(key => {
    if (fields[key].length > 0) {
      params.push(`fields[${key}]=${fields[key].join(',')}`);
    }
  });

  return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
}

export default async function fetchJsonApi(baseUrl, fields, include, params = []) {
  const url = createUrl(baseUrl, fields, include, params);
  const response = await fetch(url);
  return await response.json();
}
