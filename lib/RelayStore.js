import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

export default class RelayStore extends Store {
  constructor(relay) {
    super();

    this.registerAsync(relay.getActions('relay').request, null, this.handleJsonApiResponse, this.handleJsonApiError);

    this.relay = relay;
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

  handleJsonApiResponse({url, fields, include, json}) {
    if (Array.isArray(json.data)) {
      json.data.forEach(data => {
        this.mergeResource(data, fields[data.type]);
      });
    } else {
      this.mergeResource(json.data, fields[json.data.type]);
    }

    if (json.included) {
      json.included.forEach(data => {
        this.mergeResource(data, fields[data.type]);
      });
    }

    this.forceUpdate();
  }

  handleJsonApiError(error) {

  }


  fulfill(query) {
    if (query.type !== 'call') {
      throw new Error();
    }
    const methodName = query.name;
    const methodArgs = collectArgs(query.args);

    const fields = collectFields(query.class);
    const include = collectInclude(query.class);

    const {id} = this.relay.methods[methodName](methodArgs, fields, include);

    const recursive = (klass, id) => {
      if (!this.resources[klass.name] || !this.resources[klass.name][id]) {
        return null;
      }

      const resource = this.resources[klass.name][id]
      const result = {};

      fields[klass.name].forEach(field => {
        result[field] = resource[field];
      });

      klass.block.includes.forEach(include => {
        const linkage = resource.links[include.name].linkage;

        function readLinkage(linkage) {
          if (linkage.type !== include.class.name) {
            throw new Error();
          }
          return recursive(include.class, linkage.id);
        }

        if (Array.isArray(linkage)) {
          result[include.name] = linkage.map(readLinkage);
        } else {
          result[include.name] = readLinkage(linkage);
        }
      });

      return result;
    };

    if (Array.isArray(id)) {
      return id.map(id => recursive(query.class, id));
    } else {
      return recursive(query.class, id);
    }
  }
}
