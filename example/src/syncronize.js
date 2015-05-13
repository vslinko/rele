export class SyncError extends Error {}

export function syncronize(obj, prop, descriptor) {
  let queue = [];
  let processed = false;
  const method = descriptor.value;

  async function processQueue(context, args) {
    if (processed) {
      const lock = {};
      lock.promise = new Promise(function(resolve, reject) {
          lock.resolve = resolve;
          lock.reject = () => reject(new SyncError());
      });
      queue.push(lock);
      args.push(lock.promise);
    }

    processed = true;
    let error;
    try {
      const response = await method.apply(context, args);
    } catch (e) {
      error = e;
    }

    if (queue.length > 0) {
      if (error) {
        queue.shift().reject(error);
        throw error;
      } else {
        queue.shift().resolve(args[1]);
      }
    } else {
      processed = false;
    }

    return response;
  }

  descriptor.value = function (...args) {
    return processQueue(this, args);
  };

  return descriptor;
}
