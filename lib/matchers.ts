/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Term } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'
import toNT from '@rdfjs/to-ntriples'
import type deepEqual from 'deep-eql'

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
      return function (this: any, other: Term) {
        const obj: AnyPointer | Term | unknown = this._obj

        if (isTermOrPointer(obj)) {
          if ('terms' in obj) {
            if (!obj.term) {
              return this.assert(
                false,
                'expected a pointer with single term #{exp} but got #{act} terms',
                'expected a pointer with single term not to equal #{exp}',
                toNT(other),
                obj.terms.length,
              )
            }

            return this.assert(
              other.equals(obj.term),
              'expected a pointer to #{exp} but got #{act}',
              'expected a pointer not to equal #{exp}',
              toNT(other),
              toNT(obj.term),
            )
          }

          return this.assert(
            other.equals(obj),
            'expected #{this} to equal #{exp}',
            'expected #{this} not to equal #{exp}',
            toNT(other),
            toNT(obj),
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

export default plugin
