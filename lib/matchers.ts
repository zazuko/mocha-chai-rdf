/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Term } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'
import toNT from '@rdfjs/to-ntriples'
import type deepEqual from 'deep-eql'
import env from '@zazuko/env-node'

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace Chai {
    interface Config {
      deepEqual: <L, R>(expected: L, actual: R) => void
    }

    interface ChaiUtils {
      eql: typeof deepEqual
    }
  }
}

const plugin: Chai.ChaiPlugin = (_chai, util) => {
  _chai.config.deepEqual = (expected, actual) => {
    return util.eql(expected, actual, {
      comparator: (obj: unknown, other: Term | unknown) => {
        if (isTermOrPointer(obj) && isTermOrPointer<Term>(other)) {
          return 'terms' in obj ? other.equals(obj.term) : other.equals(obj)
        }

        return null
      },
    })
  }

  const Assertion = _chai.Assertion

  ;['eq', 'equal', 'equals'].forEach((eq) => {
    Assertion.overwriteMethod(eq, function (_super) {
      return function (this: any, other: AnyPointer | Term) {
        const obj: AnyPointer | Term | unknown = this._obj

        if (isTermOrPointer(obj) && isTermOrPointer(other)) {
          return this.assert(
            setEqual(getTerms(obj), getTerms(other)),
            'expected #{exp} but got #{act}',
            'expected #{act} not to equal #{exp}',
            getDescription(other),
            getDescription(obj),
          )
        }

        _super.call(this, other)
      }
    })
  })
}

function isTermOrPointer<T extends Term | AnyPointer>(value: T | unknown): value is T {
  return typeof value === 'object' && value !== null && ('termType' in value || 'terms' in value)
}

function getTerms(obj: AnyPointer | Term) {
  return env.termSet('terms' in obj ? obj.terms : [obj])
}

function setEqual<T>(left: Set<T>, right: Set<T>) {
  return left.size === right.size && [...left].every((term) => right.has(term))
}

function getDescription(obj: AnyPointer | Term): string {
  return 'terms' in obj ? `a pointer to ${obj.terms.map(toNT).join(', ')}` : toNT(obj)
}

export default plugin
