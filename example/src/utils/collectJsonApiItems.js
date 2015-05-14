export default function collectJsonApiItems(json) {
  let items = [];

  if (Array.isArray(json.data)) {
    items = items.concat(json.data);
  } else if (json.data) {
    items.push(json.data);
  }

  if (json.included) {
    items = items.concat(json.included);
  }

  return items;
}
