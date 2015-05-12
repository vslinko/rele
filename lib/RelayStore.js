import {Store} from 'flummox';

export default class RelayStore extends Store {
  constructor(relay) {
    super();

    this.registerAsync(relay.getActions('relay').request, null, this.handleJsonApiResponse, this.handleJsonApiError);

    this.resources = {};
  }

  mergeResource(resource, fields) {
    if (!this.resources[resource.type]) {
      this.resources[resource.type] = {};
    }
    if (!this.resources[resource.type][resource.id]) {
      this.resources[resource.type][resource.id] = {
        type: resource.type,
        id: resource.id
      };
    }

    fields.forEach(field => {
      this.resources[resource.type][resource.id][field] = resource[field];
    });

    this.resources[resource.type][resource.id].links = resource.links;
  }

  handleJsonApiResponse({query, url, json}) {
    if (Array.isArray(json.data)) {
      json.data.forEach(data => {
        this.mergeResource(data, query.fields[data.type]);
      });
    } else {
      this.mergeResource(json.data, query.fields[json.data.type]);
    }

    if (json.included) {
      json.included.forEach(data => {
        this.mergeResource(data, query.fields[data.type]);
      });
    }

    this.forceUpdate();
  }

  handleJsonApiError(error) {

  }

  fulfill(tree) {
    if (!tree.params.id) return null;

    if (!this.resources[tree.type] || !this.resources[tree.type][tree.params.id]) {
      return null;
    }

    const recursive = (tree) => {
      const resource = this.resources[tree.type][tree.params.id]
      const result = {};

      tree.fields.forEach(field => {
        result[field] = resource[field];
      });

      Object.keys(tree.children).forEach(key => {
        const child = tree.children[key];
        const linkage = resource.links[key].linkage;

        function readLinkage(linkage) {
          if (linkage.type !== child.type) {
            throw new Error();
          }
          return recursive(Object.assign({}, child, {params: {id: linkage.id}}));
        }

        if (Array.isArray(linkage)) {
          result[key] = linkage.map(readLinkage);
        } else {
          result[key] = readLinkage(linkage);
        }
      });

      return result;
    };

    return recursive(tree);
  }
}
