export default function collectJsonApiResources(response) {
  let resources = [];

  if (Array.isArray(response.data)) {
    resources = resources.concat(response.data);
  } else if (response.data) {
    resources.push(response.data);
  }

  if (response.included) {
    resources = resources.concat(response.included);
  }

  return resources;
}
