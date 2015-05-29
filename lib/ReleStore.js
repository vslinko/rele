import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

class Collection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  get(id) {
    return this.toArray().filter(item => this.store.rele.idGetter(item) === id).shift();
  }

  filter(fn) {
    return this.toArray().filter(fn);
  }

  toArray() {
    const getType = this.store.rele.typeGetter;
    const getId = this.store.rele.idGetter;
    const merge = this.store.rele.merger;

    const saved = Object.keys(this.store.resources[this.name] || {}).map(id => this.store.resources[this.name][id]);

    const unsaved = this.store.createRequests.reduce((acc, [requestId, items]) => {
      return acc.concat(items.filter(item => getType(item) === this.name));
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
          return getId(d) === getId(item) && getType(d) === getType(item);
        });
      })
      .map(item => {
        const itemChanges = changes.filter(c => {
          return getId(c) === getId(item) && getType(c) === getType(item);
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

    this.registerAsync(releActions.request, null, this.handleResponses, this.handleRequestError);
    this.register(releActions.response, this.handleResponses);
    this.register(releActions.startOptimisticRequest, this.handleStartOptimisticRequest);
    this.register(releActions.endOptimisticRequest, this.handleEndOptimisticRequest);
    this.register(releActions.cancelOptimisticRequest, this.handleCancelOptimisticRequest);

    this.rele = rele;
    this.resources = {};
    this.requests = [];
    this.relationshipAdditions = [];
    this.relationshipDeletions = [];
    this.createRequests = [];
    this.updateRequests = [];
    this.deleteRequests = [];
    this.collections = new Collections(this);
  }

  handleStartOptimisticRequest({requestId, addToRelationships, add, merge, remove}) {
    this.requests.push(requestId);

    const getType = this.rele.typeGetter;
    const getId = this.rele.idGetter;
    const relationshipDeletions = remove.map(item => [getType(item), getId(item)]);

    if (addToRelationships.length > 0) this.relationshipAdditions.push([requestId, addToRelationships]);
    if (relationshipDeletions.length > 0) this.relationshipDeletions.push([requestId, relationshipDeletions]);
    if (add.length > 0) this.createRequests.push([requestId, add]);
    if (merge.length > 0) this.updateRequests.push([requestId, merge]);
    if (remove.length > 0) this.deleteRequests.push([requestId, remove]);

    this.forceUpdate();
  }

  handleEndOptimisticRequest({requestId, add, merge, remove}) {
    this.requests = this.requests.filter(id => id !== requestId);

    this.relationshipAdditions = this.relationshipAdditions.filter(([id]) => id !== requestId);
    this.relationshipDeletions = this.relationshipDeletions.filter(([id]) => id !== requestId);
    this.createRequests = this.createRequests.filter(([id]) => id !== requestId);
    this.updateRequests = this.updateRequests.filter(([id]) => id !== requestId);
    this.deleteRequests = this.deleteRequests.filter(([id]) => id !== requestId);

    if (add.length > 0) add.forEach(item => this.mergeResource(item));
    if (merge.length > 0) merge.forEach(item => this.mergeResource(item));
    if (remove.length > 0) {
      const getType = this.rele.typeGetter;
      const getId = this.rele.idGetter;

      remove.forEach(item => {
        delete this.resources[getType(item)][getId(item)];
      });
    }

    this.forceUpdate();
  }

  handleCancelOptimisticRequest({requestId}) {
    this.handleEndOptimisticRequest({requestId, add: [], merge: [], remove: []});
  }

  mergeResource(resource) {
    const type = this.rele.typeGetter(resource);
    const id = this.rele.idGetter(resource);

    if (!this.resources[type]) {
      this.resources[type] = {};
    }

    if (this.resources[type][id]) {
      this.resources[type][id] = this.rele.merger(
        this.resources[type][id],
        resource
      );
    } else {
      this.resources[type][id] = resource;
    }
  }

  mergeResponse(response) {
    this.rele.getResourcesFromResponse(response).map(::this.mergeResource);
  }

  handleResponses(responses) {
    if (!Array.isArray(responses)) {
      responses = [responses];
    }

    responses.forEach(::this.mergeResponse);

    this.forceUpdate();
  }

  handleRequestError(error) {
    console.error(error.stack)
  }

  getOptimisticRequestsCount() {
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
    const getType = this.rele.typeGetter;
    const getId = this.rele.idGetter;
    const getRelationship = this.rele.relationshipGetter;
    const relationshipAdditions = this.relationshipAdditions.reduce((acc, [requestId, relationshipAdditions]) => {
      return acc.concat(relationshipAdditions);
    }, []);
    const relationshipDeletions = this.relationshipDeletions.reduce((acc, [requestId, relationshipDeletions]) => {
      return acc.concat(relationshipDeletions);
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
        const relationship = getRelationship(resource, include.name);

        const readRelationship = (relationship) => {
          if (relationship.type !== include.class.name) {
            throw new Error(`Unexpected relationship type "${relationship.type}" expected "${include.class.name}"`);
          }

          const resource = this.collections.get(relationship.type).get(relationship.id);

          if (!resource) {
            fulfilled = false;
            return null;
          }

          return recursiveClass(include.class, fields, resource);
        };

        const additions = relationshipAdditions
          .filter(([type, id, name]) => type === getType(resource) && id === getId(resource) && name === include.name)
          .map(([type, id, name, item]) => item);
        const deletions = relationshipDeletions
          .filter(([type]) => type === include.class.name)
          .map(([type, id]) => id);

        if (Array.isArray(relationship)) {
          result[include.name] = relationship
            .filter(relationship => !deletions.some(id => id === relationship.id))
            .map(readRelationship)
            .concat(additions.map(addition => recursiveClass(include.class, fields, addition)));
        } else {
          if (additions.length > 0) {
            result[include.name] = recursiveClass(include.class, fields, additions[additions.length - 1]);
          } else if (deletions.some(id => id === relationship.id)) {
            result[include.name] = null;
          } else {
            result[include.name] = relationship && readRelationship(relationship) || null;
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
