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

    const responses = [];

    const recursive = async (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      const response = await this.rele.getActions(`${methodName}Rele`).fetch(methodArgs, fields, include, parent, this.rele);

      function checkResponseData(data) {
        if (data.type !== call.class.name) {
          throw new Error(`Rele method "${methodName}" should return "${call.class.name}" got "${data.type}"`);
        }
      }

      responses.push(response);

      if (response) {
        if (Array.isArray(response.data)) {
          response.data.map(checkResponseData);
        } else if (response.data) {
          checkResponseData(response.data);
        }
      }

      await* call.class.block.calls.map(c => recursive(c, response && response.data));
    };

    await recursive(query);

    return responses;
  }

  response(response) {
    return response;
  }

  startOptimisticRequest(requestId, changes = {}) {
    let {addToRelationships = [], add = [], merge = [], remove = []} = changes;

    if (!Array.isArray(add)) add = [add];
    if (!Array.isArray(merge)) merge = [merge];
    if (!Array.isArray(remove)) remove = [remove];

    return {requestId, addToRelationships, add, merge, remove};
  }

  endOptimisticRequest(requestId, changes = {}) {
    let {add = [], merge = [], remove = []} = changes;

    if (!Array.isArray(add)) add = [add];
    if (!Array.isArray(merge)) merge = [merge];
    if (!Array.isArray(remove)) remove = [remove];

    return {requestId, add, merge, remove};
  }

  cancelOptimisticRequest(requestId) {
    return {requestId};
  }
}
