import {Actions} from 'flummox';

export default function releAction({fetch, filter}) {
  return class ReleActions extends Actions {
    fetch(...args) {
      return fetch(...args);
    }

    static filter(...args) {
      return filter(...args);
    }
  }
}
