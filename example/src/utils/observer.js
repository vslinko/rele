function extendMethod(obj, prop, method) {
  const previousMethod = obj[prop];

  Object.defineProperty(obj, prop, {
    value: function (...args) {
      if (previousMethod) {
        previousMethod.apply(this, args);
      }
      method.apply(this, args);
    }
  });
}

export default function observer(Component) {
  extendMethod(Component.prototype, 'componentWillMount', function() {
    this.data = {};
    this.subscribtions = [];
    this._refreshObservers();
  });

  extendMethod(Component.prototype, 'componentWillUpdate', function() {
    this._refreshObservers();
  });

  extendMethod(Component.prototype, 'componentWillUnmount', function() {
    this.subscribtions.forEach(subscribtion => subscribtion.dispose());
  });

  extendMethod(Component.prototype, '_refreshObservers', function() {
    this.subscribtions.forEach(subscribtion => subscribtion.dispose());

    const mapping = this.observe();

    this.subscribtions = Object.keys(mapping).map(key => {
      const observer = mapping[key];

      return observer.subscribe((nextValue, prevValue) => {
        this.data[key] = nextValue;

        if (prevValue !== undefined) {
          this.forceUpdate();
        }
      });
    });
  });

  return Component;
}
