import {Store} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

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

    this.resources[resource.type][resource.id].links = resource.links;
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

      const {id} = this.relay.methods[methodName](methodArgs, fields, include, parent);

      if (Array.isArray(id)) {
        return id.map(id => recursiveClass(call.class, fields, id));
      } else if (id) {
        return recursiveClass(call.class, fields, id);
      } else if (this.resources[call.class.name]) {
        return Object.keys(this.resources[call.class.name]).map(id => recursiveClass(call.class, fields, id));
      } else {
        return null;
      }
    };

    const recursiveClass = (klass, fields, id) => {
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
          return recursiveClass(include.class, fields, linkage.id);
        }

        if (Array.isArray(linkage)) {
          result[include.name] = linkage.map(readLinkage);
        } else {
          result[include.name] = readLinkage(linkage);
        }
      });

      klass.block.calls.forEach(call => {
        result[call.name] = recursiveCall(call, result);
      });

      return result;
    };

    return recursiveCall(query);
  }
}
