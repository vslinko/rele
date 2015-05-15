import syncronizeFn from '../utils/syncronize';
import collectJsonApiItems from '../utils/collectJsonApiItems';

export default function optimistic({optimisticChanges, commitChanges, syncronize}) {
  return function optimistic(obj, prop, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      const changesArgs = (syncronize ? args.slice(0, args.length - 1) : args).concat([this.flux]);

      const toChange = optimisticChanges(...changesArgs);
      const optimisticRequest = this.flux.startOptimisticRequest(toChange);

      try {
        if (syncronize) {
          const lock = args.pop();
          const {canceled} = await lock;

          if (canceled) {
            return optimisticRequest.cancel();
          }
        }

        const json = await method.apply(this, args);

        const toCommit = commitChanges ? commitChanges(...changesArgs) : {};

        if (!toChange.remove) toChange.remove = [];
        if (!Array.isArray(toChange.remove)) toChange.remove = [toChange.remove];

        if (!toCommit.merge) toCommit.merge = [];
        if (!Array.isArray(toCommit.merge)) toCommit.merge = [toCommit.merge];

        if (!toCommit.remove) toCommit.remove = [];
        if (!Array.isArray(toCommit.remove)) toCommit.remove = [toCommit.remove];

        toCommit.merge = toCommit.merge.concat(collectJsonApiItems(json));
        toCommit.remove = toCommit.remove.concat(toChange.remove);

        optimisticRequest.commit(toCommit);
      } catch (e) {
        optimisticRequest.cancel();
        throw e;
      }
    };

    if (syncronize) {
      descriptor = syncronizeFn(syncronize)(obj, prop, descriptor) || descriptor;
    }

    return descriptor;
  };
}
