const fromAsyncIter = asyncIter => (start, sink) => {
  if (start !== 0) return;

  const iterator = typeof Symbol !== 'undefined' && asyncIter[Symbol.asyncIterator]
    ? asyncIter[Symbol.asyncIterator]()
    : asyncIter;

  let done, disposed, error, draining;

  sink(0, t => {
    if (disposed || done || error) return;

    if (t === 1) {
      while (draining = !draining) {
        iterator
          .next()
          .then(res => {
            done = res.done;
            return res.value;
          })
          .then(val => done ? sink(2) : val)
          .then(val => !done && sink(1, val))
          .catch(err => {
            error = true;
            sink(2, err);
          });
      }
    }

    if (t === 2) disposed = true;
  });
};

module.exports = fromAsyncIter;
