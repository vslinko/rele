import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

class Collection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  get(id) {
    return this.toArray().filter(item => item.id === id).shift();
  }

  filter(fn) {
    return this.toArray().filter(fn);
  }

  toArray() {
    const saved = Object.keys(this.store.resources[this.name] || {}).map(id => this.store.resources[this.name][id]);
    const unsaved = Object.keys(this.store.requests).reduce((acc, requestId) => {
      const items = this.store.requests[requestId];
      return acc.concat(items.filter(item => item.type === this.name));
    }, []);
    return saved.concat(unsaved);
  }
}

class Collections {
  constructor(store) {
    this.store = store;
  }

  get(id) {
    return new Collection(this.store, id);
  }
}

export default class RelayStore extends Store {
  constructor(relay) {
    super();

    this.registerAsync(relay.getActions('relay').request, null, this.handleJsonApiResponse, this.handleJsonApiError);
    this.register(relay.getActions('relay').startRequest, this.handleStartRequest);
    this.register(relay.getActions('relay').endRequest, this.handleEndRequest);

    this.relay = relay;
    this.resources = {};
    this.requests = {};
    this.collections = new Collections(this);
  }

  handleStartRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.requests[requestId] = resources;

    this.forceUpdate();
  }

  handleEndRequest({requestId, json}) {
    delete this.requests[requestId];
    this.mergeJson(json);
    this.forceUpdate();
  }

  mergeResource(resource) {
    if (!this.resources[resource.type]) {
      this.resources[resource.type] = {};
    }
    if (!this.resources[resource.type][resource.id]) {
      this.resources[resource.type][resource.id] = {
        type: resource.type,
        id: resource.id
      };
    }

    Object.keys(resource).forEach(field => {
      this.resources[resource.type][resource.id][field] = resource[field];
    });

    this.resources[resource.type][resource.id].links = resource.links || {};
  }

  mergeJson(json) {
    if (Array.isArray(json.data)) {
      json.data.forEach(data => {
        this.mergeResource(data);
      });
    } else {
      this.mergeResource(json.data);
    }

    if (json.included) {
      json.included.forEach(data => {
        this.mergeResource(data);
      });
    }
  }

  handleJsonApiResponse(jsons) {
    jsons.forEach(({json}) => this.mergeJson(json));
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

      let resource = this.relay.methods[methodName].filter(methodArgs, parent, this.collections);

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
