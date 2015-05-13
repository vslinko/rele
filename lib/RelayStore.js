import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

class Collection {
  constructor(resources) {
    this.resources = resources;
  }

  get(id) {
    return this.resources[id];
  }

  filter(fn) {
    return this.toArray().filter(fn);
  }

  toArray() {
    return Object.keys(this.resources).map(id => this.resources[id]);
  }
}

class Collections {
  constructor(collections) {
    this.collections = collections;
  }

  get(id) {
    return new Collection(this.collections[id] || {});
  }
}

export default class RelayStore extends Store {
  constructor(relay) {
    super();

    this.registerAsync(relay.getActions('relay').request, null, this.handleJsonApiResponse, this.handleJsonApiError);

    this.relay = relay;
    this.resources = {};
  }

  mergeResource(resource, fields = []) {
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

    this.resources[resource.type][resource.id].links = resource.links || {};
  }

  handleJsonApiResponse(jsons) {
    jsons.forEach(({json, fields}) => {
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
    });

    this.forceUpdate();
  }

  handleJsonApiError(error) {

  }


  fulfill(query) {
    if (query.type !== 'call') {
      throw new Error();
    }

    const recursiveCall = (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      let resource = this.relay.methods[methodName].filter(methodArgs, parent, new Collections(this.resources));

      if (resource instanceof Collection) {
        resource = resource.toArray();
      }

      if (!resource) {
        return null;
      } else if (Array.isArray(resource)) {
        return resource.map(resource => recursiveClass(call.class, fields, resource));
      } else {
        return recursiveClass(call.class, fields, resource);
      }
    };

    const recursiveClass = (klass, fields, resource) => {
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
          return recursiveClass(include.class, fields, linkage.id);
        }

        if (Array.isArray(linkage)) {
          result[include.name] = linkage.map(readLinkage);
        } else {
          result[include.name] = readLinkage(linkage);
        }
      });

      klass.block.calls.forEach(call => {
        result[call.name] = recursiveCall(call, resource);
      });

      return result;
    };

    return recursiveCall(query);
  }
}
