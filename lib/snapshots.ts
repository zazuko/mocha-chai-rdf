/* eslint-disable @typescript-eslint/no-explicit-any */
import 'mocha-chai-jest-snapshot'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import rdf from '@zazuko/env-node'

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Chai {
    interface Assertion {
      canonical: Assertion
    }
  }
}

export default function (chai: Chai.ChaiStatic, utils: Chai.ChaiUtils) {
  if (typeof (chai.Assertion.prototype as any).toMatchSnapshot !== 'function') {
    // calling jestSnapshotPlugin multiple times has unwanted side effects
    chai.use(jestSnapshotPlugin())
  }

  const toMatchSnapshot = (chai.Assertion.prototype as any).toMatchSnapshot

  utils.addMethod(chai.Assertion.prototype, 'toMatchSnapshot', function (this: Chai.Assertion, ...args: any[]) {
    const obj = (this as any)._obj

    if (utils.flag(this, 'dataset-canonical')) {
      // Custom behavior for dataset
      chai.expect(rdf.dataset.toCanonical(obj)).toMatchSnapshot(...args)
    } else {
      // Original behavior
      toMatchSnapshot.apply(this, args)
    }
  })

  utils.addProperty(chai.Assertion.prototype, 'canonical', function (this: Chai.Assertion) {
    utils.flag(this, 'dataset-canonical', true)
  })
}
