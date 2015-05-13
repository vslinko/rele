import {Actions} from 'flummox';
import createUrl from './util/createUrl';
import {collectArgs, collectFields, collectInclude} from './util/ql';

export default class RelayActions extends Actions {
  constructor(relay) {
    super();

    this.relay = relay;
  }

  async request(query) {
    if (query.type !== 'call') {
      throw new Error();
    }

    const jsons = [];

    const recursive = async (call, parent) => {
      const methodName = call.name;
      const methodArgs = collectArgs(call.args);

      const fields = collectFields(call.class);
      const include = collectInclude(call.class);

      const {baseUrl} = this.relay.methods[methodName](methodArgs, fields, include, parent);

      const url = createUrl(baseUrl, fields, include);
      const response = await fetch(url);
      const json = await response.json();

      jsons.push({url, fields, include, json});

      await* call.class.block.calls.map(c => recursive(c, json.data));
    };

    await recursive(query);

    return jsons;
  }
}
