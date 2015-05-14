import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

class Collection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  get(id) {
    return this.toArray().filter(item => this.store.rele.getter(item, 'id') === id).shift();
  }

  filter(fn) {
    return this.toArray().filter(fn);
  }

  toArray() {
    const get = this.store.rele.getter;
    const merge = this.store.rele.merger;

    const saved = Object.keys(this.store.resources[this.name] || {}).map(id => this.store.resources[this.name][id]);

    const unsaved = this.store.createRequests.reduce((acc, [requestId, items]) => {
      return acc.concat(items.filter(item => get(item, 'type') === this.name));
    }, []);

    const changes = this.store.updateRequests.reduce((acc, [requestId, items]) => {
      return acc.concat(items);
    }, []);

    const deleted = this.store.deleteRequests.reduce((acc, [requestId, items]) => {
      return acc.concat(items);
    }, []);

    const items = saved
      .concat(unsaved)
      .filter(item => {
        return !deleted.some(d => {
          return get(d, 'id') === get(item, 'id') && get(d, 'type') === get(item, 'type');
        });
      })
      .map(item => {
        const itemChanges = changes.filter(c => {
          return get(c, 'id') === get(item, 'id') && get(c, 'type') === get(item, 'type');
        });

        return itemChanges.reduce(merge, item);
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

export default class ReleStore extends Store {
  constructor(rele) {
    super();

    const releActions = rele.getActions('rele');

    this.registerAsync(releActions.request, null, this.handleJsonApiResponse, this.handleJsonApiError);

    this.register(releActions.startCreateRequest, this.handleStartCreateRequest);
    this.register(releActions.endCreateRequest, this.handleEndCreateRequest);
    this.register(releActions.cancelCreateRequest, this.handleCancelCreateRequest);

    this.register(releActions.startUpdateRequest, this.handleStartUpdateRequest);
    this.register(releActions.endUpdateRequest, this.handleEndUpdateRequest);
    this.register(releActions.cancelUpdateRequest, this.handleCancelUpdateRequest);

    this.register(releActions.startDeleteRequest, this.handleStartDeleteRequest);
    this.register(releActions.endDeleteRequest, this.handleEndDeleteRequest);
    this.register(releActions.cancelDeleteRequest, this.handleCancelDeleteRequest);

    this.rele = rele;
    this.resources = {};
    this.createRequests = [];
    this.updateRequests = [];
    this.deleteRequests = [];
    this.collections = new Collections(this);
  }

  handleStartCreateRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.createRequests.push([requestId, resources.map(this.rele.wrapper)]);
    this.forceUpdate();
  }

  handleEndCreateRequest({requestId, json}) {
    this.createRequests = this.createRequests.filter(([id]) => id !== requestId);

    if (json) {
      this.mergeJson(json);
    }

    this.forceUpdate();
  }

  handleCancelCreateRequest({requestId}) {
    this.createRequests = this.createRequests.filter(([id]) => id !== requestId);
    this.forceUpdate();
  }

  handleStartUpdateRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.updateRequests.push([requestId, resources.map(this.rele.wrapper)]);
    this.forceUpdate();
  }

  handleEndUpdateRequest({requestId, json}) {
    this.updateRequests = this.updateRequests.filter(([id]) => id !== requestId);

    if (json) {
      this.mergeJson(json);
    }

    this.forceUpdate();
  }

  handleCancelUpdateRequest({requestId}) {
    this.updateRequests = this.updateRequests.filter(([id]) => id !== requestId);
    this.forceUpdate();
  }

  handleStartDeleteRequest({requestId, resources}) {
    if (!Array.isArray(resources)) {
      resources = [resources];
    }

    this.deleteRequests.push([requestId, resources.map(this.rele.wrapper)]);
    this.forceUpdate();
  }

  handleEndDeleteRequest({requestId, json}) {
    const get = this.rele.getter;

    const request = this.deleteRequests.filter(([id]) => id === requestId).shift();
    if (request) {
      request[1].forEach(toDelete => {
        delete this.resources[get(toDelete, 'type')][get(toDelete, 'id')];
      });
    }

    this.deleteRequests = this.deleteRequests.filter(([id]) => id !== requestId);

    if (json) {
      this.mergeJson(json);
    }

    this.forceUpdate();
  }

  handleCancelDeleteRequest({requestId}) {
    this.deleteRequests = this.deleteRequests.filter(([id]) => id !== requestId);
    this.forceUpdate();
  }

  mergeResource(resource) {
    if (!this.resources[resource.type]) {
      this.resources[resource.type] = {};
    }

    const changes = this.rele.wrapper(resource);

    if (this.resources[resource.type][resource.id]) {
      this.resources[resource.type][resource.id] = this.rele.merger(
        this.resources[resource.type][resource.id],
        changes
      );
    } else {
      this.resources[resource.type][resource.id] = changes;
    }
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
    console.error(error.stack)
  }

  getRequestsCount() {
    return this.createRequests.length +
      this.updateRequests.length +
      this.deleteRequests.length;
  }

  fulfill(query) {
    if (query.type !== 'call') {
      throw new Error('Invalid query provided to rele fulfill');
    }

    const get = this.rele.getter;
    const getLink = this.rele.linkGetter;
    let fulfilled = true;

    const recursiveCall = (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      let resource = this.rele.getActions(`${methodName}Rele`).constructor.filter(methodArgs, parent, this.collections, this.rele);

      if (resource instanceof Collection) {
        resource = resource.toArray();
      }

      if (!resource) {
        fulfilled = false;
        return null;
      } else if (Array.isArray(resource)) {
        return resource.map(resource => recursiveClass(call.class, fields, resource));
      } else {
        return recursiveClass(call.class, fields, resource);
      }
    };

    const recursiveClass = (cls, fields, resource) => {
      const result = {
        type: get(resource, 'type'),
        id: get(resource, 'id')
      };

      fields[cls.name].forEach(field => {
        result[field] = get(resource, field);
      });

      cls.block.includes.forEach(include => {
        const linkage = getLink(resource, include.name);

        const readLinkage = (linkage) => {
          if (linkage.type !== include.class.name) {
            throw new Error(`Unexpected link type "${linkage.type}" expected "${include.class.name}"`);
          }

          const resource = this.collections.get(linkage.type).get(linkage.id);

          if (!resource) {
            fulfilled = false;
            return null;
          }

          return recursiveClass(include.class, fields, resource);
        };

        if (Array.isArray(linkage)) {
          result[include.name] = linkage.map(readLinkage);
        } else {
          result[include.name] = readLinkage(linkage);
        }
      });

      cls.block.calls.forEach(call => {
        result[call.name] = recursiveCall(call, resource);
      });

      return fulfilled ? this.rele.wrapper(result) : null;
    };

    return recursiveCall(query);
  }
}
