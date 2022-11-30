/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var NODE_ENV = process.env.NODE_ENV;

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

const START = 0;
const DATA = 1;
const ERROR = 2;
const CANCEL = 3;

const invariantStart = (start) =>
  invariant(start === 0, "sources and operators can only be started");

const pipe = (...cbs) => {
  let res = cbs[0];
  for (let i = 1, n = cbs.length; i < n; i++) res = cbs[i](res);
  return res;
};

const rejected = (e) => (start, sink) => {
  invariantStart(start);
  sink(ERROR, e);
};

const resolved = (a) => (start, sink) => {
  invariantStart(start);
  sink(DATA, a);
};

const make = (f) => (start, sink) => {
  invariantStart(start);
  const onResolve = (a) => sink(DATA, a);
  const onReject = (e) => sink(ERROR, e);
  let cleanup = f(onReject, onResolve);
  sink(START, (t, d) => {
    if (t === CANCEL && cleanup) cleanup();
  });
};

const flatMapError = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    t === ERROR ? f(d)(START, sink) : sink(t, d);
  });
};

const mapError = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    sink(t, t === ERROR ? f(d) : d);
  });
};

const flatMap = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    t === DATA ? f(d)(START, sink) : sink(t, d);
  });
};

const map = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    sink(t, t === DATA ? f(d) : d);
  });
};

const andMap = (sourceA) => (sourceF) => (start, sink) => {
  invariantStart(start);

  let tf, df, ta, da;

  const tryAll = () => {
    if (tf === DATA && ta === DATA) return sink(DATA, df(da));
    if (tf === ERROR && ta) return sink(ERROR, df);
    if (ta === ERROR && tf) return sink(ERROR, da);
  };

  sourceF(START, (t, d) => {
    if (t === START) sink(t, d);
    if (t === DATA || t === ERROR) {
      tf = t;
      df = d;
      tryAll();
    }
  });

  sourceA(START, (t, d) => {
    if (t === START) sink(t, d);
    if (t === DATA || t === ERROR) {
      ta = t;
      da = d;
      tryAll();
    }
  });
};

const fork = (onReject, onResolve) => (source) => {
  let talkback;
  source(START, (t, d) => {
    if (t === START) talkback = d;
    if (t === DATA) onResolve(d);
    if (t === ERROR) onReject(d);
  });
  return () => {
    talkback(CANCEL);
  };
};

export { andMap, flatMap, flatMapError, fork, make, map, mapError, pipe, rejected, resolved };
//# sourceMappingURL=index.js.map
