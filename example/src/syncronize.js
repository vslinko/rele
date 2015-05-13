export class SyncError extends Error {}

export function syncronize(keyGetter) {
  return function syncronize(obj, prop, descriptor) {
    let queues = {};
    let processed = {};
    const method = descriptor.value;

    async function processQueue(context, args) {
      const key = keyGetter(...args);
      if (!queues[key]) {
        queues[key] = [];
      }

      if (processed[key]) {
        const lock = {};
        lock.promise = new Promise(function(resolve, reject) {
            lock.resolve = resolve;
            lock.reject = () => reject(new SyncError());
        });
        queues[key].push(lock);
        args.push(lock.promise);
      }

      processed[key] = true;
      let error;
      try {
        const response = await method.apply(context, args);
      } catch (e) {
        error = e;
      }

      if (queues[key].length > 0) {
        if (error) {
          queues[key].shift().reject(error);
          throw error;
        } else {
          queues[key].shift().resolve(args[1]);
        }
      } else {
        processed[key] = false;
      }

      return response;
    }

    descriptor.value = function (...args) {
      return processQueue(this, args);
    };

    return descriptor;
}
}
