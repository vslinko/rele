import {Actions} from 'flummox';
import {collectArgs, collectFields, collectInclude} from './util/ql';

export default class RelayActions extends Actions {
  constructor(relay) {
    super();

    this.relay = relay;
  }

  async request(query) {
    if (query.type !== 'call') {
      throw new Error('Invalid query provided to relay request');
    }

    const jsons = [];

    const recursive = async (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      const json = await this.relay.getActions(`${methodName}Relay`).fetch(methodArgs, fields, include, parent);

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

  endDeleteRequest(requestId, json) {
    return {requestId, json};
  }
}
