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

  getResource(type, id) {
    return this.get(type).get(id);
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
    this.register(releActions.response, this.handleJsonApiResponse);
    this.register(releActions.startOptimisticRequest, this.handleStartOptimisticRequest);
    this.register(releActions.endOptimisticRequest, this.handleEndOptimisticRequest);
    this.register(releActions.cancelOptimisticRequest, this.handleCancelOptimisticRequest);

    this.rele = rele;
    this.resources = {};
    this.requests = [];
    this.linkAdditions = [];
    this.linkDeletions = [];
    this.createRequests = [];
    this.updateRequests = [];
    this.deleteRequests = [];
    this.collections = new Collections(this);
  }

  handleStartOptimisticRequest({requestId, addToLinkage, add, merge, remove}) {
    this.requests.push(requestId);

    const get = this.rele.getter;
    const linkDeletions = remove.map(item => [get(item, 'type'), get(item, 'id')]);

    if (addToLinkage.length > 0) this.linkAdditions.push([requestId, addToLinkage]);
    if (linkDeletions.length > 0) this.linkDeletions.push([requestId, linkDeletions]);
    if (add.length > 0) this.createRequests.push([requestId, add]);
    if (merge.length > 0) this.updateRequests.push([requestId, merge]);
    if (remove.length > 0) this.deleteRequests.push([requestId, remove]);

    this.forceUpdate();
  }

  handleEndOptimisticRequest({requestId, add, merge, remove}) {
    this.requests = this.requests.filter(id => id !== requestId);

    this.linkAdditions = this.linkAdditions.filter(([id]) => id !== requestId);
    this.linkDeletions = this.linkDeletions.filter(([id]) => id !== requestId);
    this.createRequests = this.createRequests.filter(([id]) => id !== requestId);
    this.updateRequests = this.updateRequests.filter(([id]) => id !== requestId);
    this.deleteRequests = this.deleteRequests.filter(([id]) => id !== requestId);

    if (add.length > 0) add.forEach(item => this.mergeResource(item));
    if (merge.length > 0) merge.forEach(item => this.mergeResource(item));
    if (remove.length > 0) {
      const get = this.rele.getter;
      remove.forEach(item => {
        delete this.resources[get(item, 'type')][get(item, 'id')];
      });
    }

    this.forceUpdate();
  }

  handleCancelOptimisticRequest({requestId}) {
    this.handleEndOptimisticRequest({requestId, add: [], merge: [], remove: []});
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
    if (!Array.isArray(jsons)) {
      jsons = [jsons];
    }

    jsons.forEach(({json}) => this.mergeJson(json));

    this.forceUpdate();
  }

  handleJsonApiError(error) {
    console.error(error.stack)
  }

  getRequestsCount() {
    return this.requests.length;
  }

  get(id) {
    return this.collections.get(id);
  }

  getResource(type, id) {
    return this.collections.getResource(type, id);
  }

  fulfill(query) {
    if (query.type !== 'call') {
      throw new Error('Invalid query provided to rele fulfill');
    }

    const get = this.rele.getter;
    const getLink = this.rele.linkGetter;
    const linkAdditions = this.linkAdditions.reduce((acc, [requestId, linkAdditions]) => {
      return acc.concat(linkAdditions);
    }, []);
    const linkDeletions = this.linkDeletions.reduce((acc, [requestId, linkDeletions]) => {
      return acc.concat(linkDeletions);
    }, []);
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
      const result = {};

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

        const additions = linkAdditions
          .filter(([type, id, name]) => type === get(resource, 'type') && id === get(resource, 'id') && name === include.name)
          .map(([type, id, name, item]) => item);
        const deletions = linkDeletions
          .filter(([type]) => type === include.class.name)
          .map(([type, id]) => id);

        if (Array.isArray(linkage)) {
          result[include.name] = linkage
            .filter(linkage => !deletions.some(id => id === linkage.id))
            .map(readLinkage)
            .concat(additions.map(addition => recursiveClass(include.class, fields, addition)));
        } else {
          if (additions.length > 0) {
            result[include.name] = recursiveClass(include.class, fields, additions[additions.length - 1]);
          } else if (deletions.some(id => id === linkage.id)) {
            result[include.name] = null;
          } else {
            result[include.name] = linkage && readLinkage(linkage) || null;
          }
        }
      });

      cls.block.calls.forEach(call => {
        result[call.name] = recursiveCall(call, resource);
      });

      return result;
    };

    const result = recursiveCall(query);
    return fulfilled ? this.rele.wrapper(result) : null;
  }
}
