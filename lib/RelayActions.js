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
    const methodName = query.name;
    const methodArgs = collectArgs(query.args);

    const fields = collectFields(query.class);
    const include = collectInclude(query.class);
    const {baseUrl} = this.relay.methods[methodName](methodArgs, fields, include);

    const url = createUrl(baseUrl, fields, include);
    const response = await fetch(url);
    const json = await response.json();

    return {url, fields, include, json};
  }
}
