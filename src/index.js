import invariant from "./invariant.js";

const START = 0;
const DATA = 1;
const ERROR = 2;
const CANCEL = 3;

const invariantStart = (start) =>
  invariant(start === 0, "sources and operators can only be started");

export const pipe = (...cbs) => {
  let res = cbs[0];
  for (let i = 1, n = cbs.length; i < n; i++) res = cbs[i](res);
  return res;
};

export const rejected = (e) => (start, sink) => {
  invariantStart(start);
  sink(ERROR, e);
};

export const resolved = (a) => (start, sink) => {
  invariantStart(start);
  sink(DATA, a);
};

export const make = (f) => (start, sink) => {
  invariantStart(start);
  const onResolve = (a) => sink(DATA, a);
  const onReject = (e) => sink(ERROR, e);
  let cleanup = f(onReject, onResolve);
  sink(START, (t, d) => {
    if (t === CANCEL && cleanup) cleanup();
  });
};

export const flatMapError = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    t === ERROR ? f(d)(START, sink) : sink(t, d);
  });
};

export const mapError = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    sink(t, t === ERROR ? f(d) : d);
  });
};

export const flatMap = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    t === DATA ? f(d)(START, sink) : sink(t, d);
  });
};

export const map = (f) => (source) => (start, sink) => {
  invariantStart(start);
  source(START, (t, d) => {
    sink(t, t === DATA ? f(d) : d);
  });
};

export const andMap = (sourceA) => (sourceF) => (start, sink) => {
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

export const fork = (onReject, onResolve) => (source) => {
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
