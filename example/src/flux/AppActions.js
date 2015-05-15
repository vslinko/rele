import {Actions} from 'flummox';

export default class AppActions extends Actions {
  constructor(flux) {
    super();

    this.flux = flux;

    window.addEventListener('beforeunload', event => this.beforeUnload(event));
  }

  beforeUnload(event) {
    const uncompletedRequestsCount = this.flux.getRequestsCount();

    if (uncompletedRequestsCount > 0) {
      event.returnValue = `You have ${uncompletedRequestsCount} uncompleted background requests. That requests will be canceled.`;
    }
  }
}
