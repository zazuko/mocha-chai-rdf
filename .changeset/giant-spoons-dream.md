---
"mocha-chai-rdf": patch
---

fix: module `matchers.js` was not usable with `@web/test-runner` because it indirectly imported `stream`
