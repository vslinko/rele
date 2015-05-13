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
    const unsaved = Object.keys(this.store.createRequests).reduce((acc, requestId) => {
      const items = this.store.createRequests[requestId];
      return acc.concat(items.filter(item => item.type === this.name));
    }, []);
    const changes = Object.keys(this.store.updateRequests).reduce((acc, requestId) => {
      return acc.concat(this.store.updateRequests[requestId]);
    }, []);
    const deleted = Object.keys(this.store.deleteRequests).reduce((acc, requestId) => {
      return acc.concat(this.store.deleteRequests[requestId]);
    }, []);
    const items = saved
      .concat(unsaved)
      .filter(item => {
        return !deleted.some(d => d.id === item.id && d.type === item.type);
      })
      .map(item => {
        const itemChanges = changes.filter(c => c.type === item.type && c.id === item.id);
        return itemChanges.reduce((item, changes) => {
          return Object.assign({}, item, changes);
        }, item);
      });
    return items;
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
    this.register(relay.getActions('relay').startCreateRequest, this.handleStartCreateRequest);
    this.register(relay.getActions('relay').endCreateRequest, this.handleEndCreateRequest);
    this.register(relay.getActions('relay').startUpdateRequest, this.handleStartUpdateRequest);
    this.register(relay.getActions('relay').endUpdateRequest, this.handleEndUpdateRequest);
    this.register(relay.getActions('relay').startDeleteRequest, this.handleStartDeleteRequest);
    this.register(relay.getActions('relay').endDeleteRequest, this.handleEndDeleteRequest);

    this.relay = relay;
    this.resources = {};
    this.createRequests = {};
    this.updateRequests = {};
    this.deleteRequests = {};
    this.collections = new Collections(this);
  }

  handleStartCreateRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.createRequests[requestId] = resources;

    this.forceUpdate();
  }

  handleEndCreateRequest({requestId, json}) {
    delete this.createRequests[requestId];
    if (json) {
      this.mergeJson(json);
    }
    this.forceUpdate();
  }

  handleStartUpdateRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.updateRequests[requestId] = resources;

    this.forceUpdate();
  }

  handleEndUpdateRequest({requestId, json}) {
    delete this.updateRequests[requestId];
    if (json) {
      this.mergeJson(json);
    }
    this.forceUpdate();
  }

  handleStartDeleteRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.deleteRequests[requestId] = resources;

    this.forceUpdate();
  }

  handleEndDeleteRequest({requestId, apply, json}) {
    if (apply) {
      this.deleteRequests[requestId].forEach(toDelete => {
        delete this.resources[toDelete.type][toDelete.id];
      });
    }
    delete this.deleteRequests[requestId];
    if (json) {
      this.mergeJson(json);
    }
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
    } else if (json.data) {
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

  getRequestsCount() {
    return Object.keys(this.createRequests).length +
      Object.keys(this.updateRequests).length +
      Object.keys(this.deleteRequests).length;
  }

  fulfill(query) {
    if (query.type !== 'call') {
      throw new Error('Invalid query provided to relay fulfill');
    }

    const recursiveCall = (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      let resource = this.relay.getActions(`${methodName}Relay`).constructor.filter(methodArgs, parent, this.collections);

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

    const recursiveClass = (cls, fields, resource) => {
      const result = {
        type: resource.type,
        id: resource.id
      };

      fields[cls.name].forEach(field => {
        result[field] = resource[field];
      });

      cls.block.includes.forEach(include => {
        const linkage = resource.links[include.name].linkage;

        function readLinkage(linkage) {
          if (linkage.type !== include.class.name) {
            throw new Error(`Unexpected link type "${linkage.type}" expected "${include.class.name}"`);
          }
          return recursiveClass(include.class, fields, linkage.id);
        }

        if (Array.isArray(linkage)) {
          result[include.name] = linkage.map(readLinkage);
        } else {
          result[include.name] = readLinkage(linkage);
        }
      });

      cls.block.calls.forEach(call => {
        result[call.name] = recursiveCall(call, resource);
      });

      return result;
    };

    return recursiveCall(query);
  }
}
