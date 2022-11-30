const {
  make,
  andMap,
  map2,
  flatMap,
  flatMapError,
  pipe,
  map,
  mapError,
  rejected,
  resolved,
  fork,
} = require("./index.js");

const delay = (ms) => (source) =>
  pipe(
    source,
    flatMap((a) =>
      make((_, resolve) => {
        let id = setTimeout(() => resolve(a), ms);
        return () => clearTimeout(id);
      })
    ),
    flatMapError((e) =>
      make((reject, _) => {
        let id = setTimeout(() => reject(e), ms);
        return () => clearTimeout(id);
      })
    )
  );

let assertEqual = (a, b) => expect(a).toStrictEqual(b);

let testTask = (source, cb, ms = 20) => {
  let errors = [];
  let results = [];
  let cancel = pipe(
    source,
    fork(
      (e) => errors.push(e),
      (a) => results.push(a)
    )
  );
  setTimeout(() => {
    cb(errors, results);
  }, ms);
  return cancel;
};

test("resolved", (done) => {
  testTask(resolved("Viktor"), (errors, results) => {
    done();
    assertEqual([], errors);
    assertEqual(["Viktor"], results);
  });
});

test("rejected", (done) => {
  testTask(rejected("Viktor"), (errors, results) => {
    done();
    assertEqual(["Viktor"], errors);
    assertEqual([], results);
  });
});

test("map", (done) => {
  testTask(
    pipe(
      resolved(0),
      map((n) => n + 1)
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([1], results);
    }
  );
});

test("mapError", (done) => {
  testTask(
    pipe(
      rejected(0),
      mapError((n) => n + 1)
    ),
    (errors, results) => {
      done();
      assertEqual([1], errors);
      assertEqual([], results);
    }
  );
});

test("flatMap to resolved", (done) => {
  testTask(
    pipe(
      resolved(0),
      flatMap((n) => resolved(n + 1))
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([1], results);
    }
  );
});

test("flatMap to rejected", (done) => {
  testTask(
    pipe(
      resolved(0),
      flatMap((n) => rejected(n + 1))
    ),
    (errors, results) => {
      done();
      assertEqual([1], errors);
      assertEqual([], results);
    }
  );
});

test("cancel flatMap", (done) => {
  const cancel = testTask(
    pipe(
      resolved(0),
      flatMap((n) => pipe(resolved(n + 1), delay(10)))
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([], results);
    }
  );
  setTimeout(() => cancel(), 0);
});


test("flatMapError to resolved", (done) => {
  testTask(
    pipe(
      rejected(0),
      flatMapError((n) => resolved(n + 1))
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([1], results);
    }
  );
});

test("flatMapError to rejected", (done) => {
  testTask(
    pipe(
      rejected(0),
      flatMapError((n) => rejected(n + 1))
    ),
    (errors, results) => {
      done();
      assertEqual([1], errors);
      assertEqual([], results);
    }
  );
});

test("make", (done) => {
  const cancel = testTask(
    make((_, resolve) => {
      const id = setTimeout(() => resolve(1), 1);
      return () => clearTimeout(id);
    }),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([1], results);
    }
  );
});

test("cancel make", (done) => {
  const cancel = testTask(
    make((_, resolve) => {
      const id = setTimeout(() => resolve(1), 10);
      return () => clearTimeout(id);
    }),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([], results);
    }
  );
  setTimeout(() => cancel(), 0);
});

test("andMap all resolved", (done) => {
  testTask(
    pipe(
      resolved((a) => (b) => (c) => a + b + c),
      andMap(resolved(1)),
      andMap(resolved(1)),
      andMap(resolved(1))
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([3], results);
    }
  );
});

test("andMap 1 reject", (done) => {
  testTask(
    pipe(
      resolved((a) => a),
      andMap(pipe(rejected("first"), delay(10))),
    ),
    (errors, results) => {
      done();
      assertEqual(["first"], errors);
      assertEqual([], results);
    }
  );
});

test("andMap 2 reject", (done) => {
  testTask(
    pipe(
      resolved(a => b => a),
      andMap(pipe(rejected("first"), delay(20))),
      andMap(pipe(rejected("second"), delay(10))),
    ),
    (errors, results) => {
      done();
      assertEqual(["first"], errors);
      assertEqual([], results);
    }
  );
});

test("cancel andMap", (done) => {
  const cancel = testTask(
    pipe(
      resolved(a => b => a),
      andMap(pipe(rejected("first"), delay(20))),
      andMap(pipe(rejected("second"), delay(10))),
    ),
    (errors, results) => {
      done();
      assertEqual([], errors);
      assertEqual([], results);
    }
  );
  setTimeout(() => cancel(), 0)
});
