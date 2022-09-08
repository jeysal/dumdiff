# dumdiff

This is a hack to see if I could implement deep equality checking and diffing of arbitrary JavaScript values by mapping them to recursive sets of simple primitives (numbers and symbols)

```js
type DumSet = Set<number | symbol | DumSet>;
```

that are then diffed by a rather simple diffing algorithm

```js
function dumdiff(a: DumSet, b: DumSet): DumComparisonSet
```

returning a descriptor of which elements are the same or different in the two sets or only present in one of them.

Such an algorithm would likely be horribly inefficient, but when used for test assertions, performance is not that critical. On the other hand, the algorithm would be really simple outside of the core `dumdiff`, because mapping JavaScript values to sets and back is a much easier task for humans than writing a diff function that immediately operates on all kinds of JavaScript values.

## Examples

```js
[1, 2];
// mapped to
new Set([
  Symbol("arrayValue"),
  new Set([0, new Set([Symbol("numberValue"), 1])]),
  new Set([1, new Set([Symbol("numberValue"), 2])]),
]);
```

```js
"ab";
// mapped to
new Set([
  Symbol("stringValue"),
  new Set([
    Symbol("arrayValue"),
    new Set([0, new Set([Symbol("charValue"), 97])]),
    new Set([1, new Set([Symbol("charValue"), 98])]),
  ]),
]);
```

## Conclusion

I gave up on the experiment after realizing

1)

When diffing `['a', 'b']` against `['b']` (which should recognize `'a'` as an insertion in the first value),
and thus essentially diffing `new Set([new Set([0, 'a']), new Set([1, 'b'])])` against `new Set([new Set([0, 'b'])])`, there is no obvious clean way to make `dumdiff` associate `[0, 'b']` with `[1, 'b']` when `[a, 'a']` is just as similar to it.

2)

Not everything can be broken down in this way, for example string diffs are done very differently than what breaking down the string into a list of `[index, char]` tuples can achieve.
