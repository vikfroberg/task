# Task

Uses a similar pattern to [Callbags](https://staltz.com/why-we-need-callbags.html) but tailored for single value callbacks 

```js
import { pipe, map, andMap, flatMap, fork, resolved } from "@vikfroberg/task"

pipe(
  pipe(
    resolved((firstName) => (lastName) => `${firstName} ${lastName}`), 
    andMap(resolved("John", 2000)),
    andMap(resolved("Doe", 1000)),
  ),
  map(fullName => fullName + "!"),
  fork(e => console.error(e), a => console.log(a))
)
```
