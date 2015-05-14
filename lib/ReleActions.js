import {Actions} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

export default class ReleActions extends Actions {
  constructor(rele) {
    super();

    this.rele = rele;
  }

  async request(query) {
    if (query.type !== 'call') {
      throw new Error('Invalid query provided to rele request');
    }

    const jsons = [];

    const recursive = async (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      const json = await this.rele.getActions(`${methodName}Rele`).fetch(methodArgs, fields, include, parent, this.rele);

      jsons.push({fields, include, json});

      await* call.class.block.calls.map(c => recursive(c, json.data));
    };

    await recursive(query);

    return jsons;
  }

  startCreateRequest(requestId, resources) {
    return {requestId, resources};
  }

  endCreateRequest(requestId, json) {
    return {requestId, json};
  }

  startUpdateRequest(requestId, resources) {
    return {requestId, resources};
  }

  endUpdateRequest(requestId, json) {
    return {requestId, json};
  }

  startDeleteRequest(requestId, resources) {
    return {requestId, resources};
  }

  endDeleteRequest(requestId, apply, json) {
    return {requestId, apply, json};
  }
}
