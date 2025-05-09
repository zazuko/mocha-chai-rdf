# mocha-chai-rdf

## 0.1.10

### Patch Changes

- 8fe7a5f: fix: module `matchers.js` was not usable with `@web/test-runner` because it indirectly imported `stream`

## 0.1.9

### Patch Changes

- 1157dca: Improve handling of tests which include characters escaped in URIs

## 0.1.8

### Patch Changes

- 4b30c1b: `include` option did not work when loading a single graph from trig

## 0.1.7

### Patch Changes

- 3ba2524: `createStore`: Add an option to include arbitrary graphs

## 0.1.6

### Patch Changes

- 7002e4f: Added store functions to in-memory stream client

## 0.1.5

### Patch Changes

- 0e552bb: Allow multi-pointers in matchers

## 0.1.4

### Patch Changes

- 4bebb95: Modifications done to `rdf.store` are now reflected to `rdf.dataset`

## 0.1.3

### Patch Changes

- 14b8011: Changed the type of `this.rdf.dataset`
- 14b8011: Added `createEmpty` function to `store.js`

## 0.1.2

### Patch Changes

- f2ff5c5: Improve docs and package meta
- e40daf7: Snapshot plugin failed to register with chai v5

## 0.1.1

### Patch Changes

- 4a2a479: Fixes exports for ts-node (see https://github.com/TypeStrong/ts-node/issues/1934)
- 28a69a4: Type for `toMatchSnapshot` was not automatically imported with `snapshots.js`
- 96be0d5: Added license to package.json

## 0.1.0

### Minor Changes

- b93f48f: First version
