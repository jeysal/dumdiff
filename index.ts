type DumElement = number | symbol | DumSet;
type DumSet = ReadonlySet<DumElement>;
/**
 * If all elements of `a` and `b` are equal (in case of sets recursively equal), the resulting comparison has occurrence `'same'`.
 * Else if `a` and `b` are sets and have at least one element that is the `'same'`, the resulting comparison has occurrence `'different'`.
 * Else, they will be separate occurrences `'a'` and `'b'`.
 */
type DumComparisonElement = Readonly<
  | {
      occurrence: "a";
      a: DumElement;
      b?: undefined;
    }
  | {
      occurrence: "b";
      a?: undefined;
      b: DumElement;
    }
  | {
      occurrence: "same";
      a: DumElement;
      b: DumElement;
    }
  | {
      occurrence: "different";
      a: DumElement;
      b: DumElement;
      comparison: DumComparisonSet;
    }
>;
type DumComparisonSet = ReadonlySet<DumComparisonElement>;

/**
 * Recursively diff two `DumSet`s against each other, returning a {@link DumComparisonSet comparison} describing same and different elements.
 */
const dumDiff = (a: DumSet, b: DumSet): DumComparisonSet => {
  const comparisonSet: Set<DumComparisonElement> = new Set();
  for (const element of a) {
    if (typeof element === "number" || typeof element === "symbol") {
      if (b.has(element)) {
        comparisonSet.add({ occurrence: "same", a: element, b: element });
      } else {
        comparisonSet.add({ occurrence: "a", a: element });
      }
    } else {
      let foundInB = false;
      findInB: for (const other of b) {
        if (other instanceof Set) {
          const innerComparisonSet = dumDiff(element, other);

          let hasSame = false;
          let hasDifferent = false;
          for (const comparisonElement of innerComparisonSet) {
            switch (comparisonElement.occurrence) {
              case "same":
                hasSame = true;
              case "different":
                hasDifferent = true;
            }
          }
          if (!hasDifferent) {
            // Always add `other`, not `element`, so that we can easily avoid adding it as `'b'` occurrence later
            comparisonSet.add({
              occurrence: "same",
              a: element,
              b: other,
            });
            foundInB = true;
            break findInB;
          }
          if (hasSame) {
            comparisonSet.add({
              occurrence: "different",
              a: element,
              b: other,
              comparison: innerComparisonSet,
            });
            foundInB = true;
            break findInB;
          }
        }
      }
      if (!foundInB) comparisonSet.add({ occurrence: "a", a: element });
    }
  }
  addBElements: for (const element of b) {
    if (a.has(element)) continue addBElements;
    for (const comparisonElement of comparisonSet) {
      if (element === comparisonElement.b) {
        continue addBElements;
      }
    }
    comparisonSet.add({ occurrence: "b", b: element });
  }
  return comparisonSet;
};

// -----

// TODO look at that Jest PR work for a proper comparison object type
type Comparison = string;

const numberSymbol: symbol = Symbol("numberValue");
const mapNumberToDumSet = (value: number): DumSet => {
  return new Set([numberSymbol, value]);
};

const stringSymbol: symbol = Symbol("stringValue");
const mapStringToDumSet = (value: string): DumSet => {
  return new Set([
    stringSymbol,
    [...value].length === 1 ? value.codePointAt(0)! : mapToDumSet([...value]),
  ]);
};

const arraySymbol: symbol = Symbol("arrayValue");
const mapArrayToDumSet = (value: unknown[]): DumSet => {
  return new Set([
    arraySymbol,
    ...value.map((element, i) => new Set([i, mapToDumSet(element)])),
  ]);
};

const mapToDumSet = (value: unknown): DumSet => {
  switch (typeof value) {
    case "number":
      return mapNumberToDumSet(value);
    case "string":
      return mapStringToDumSet(value);
    case "object":
      if (Array.isArray(value)) return mapArrayToDumSet(value);
      throw new Error("TODO Encountered object");
    default:
      console.error(
        "Encountered value",
        value,
        "of unknown type",
        typeof value
      );
      throw new Error("Encountered value of unknown type " + typeof value);
  }
};

export const diff = (a: unknown, b: unknown): Comparison => {
  let aDumSet = mapToDumSet(a);
  let bDumSet = mapToDumSet(b);
  const dumComparisonSet = dumDiff(aDumSet, bDumSet);
  console.dir(dumComparisonSet, { depth: null });
  return JSON.stringify(dumComparisonSet);
};
