import { expect, use } from 'chai'
import * as oxigraph from 'oxigraph'
import rdf from '@zazuko/env-node'
import * as rdfDataFactory from 'rdf-data-factory'
import type { NamedNode } from '@rdfjs/types'
import plugin from '../../lib/matchers.js'

use(plugin)

function getAllCombinations<T>(array: T[]): [T, T][] {
  const combinations: [T, T][] = []
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      combinations.push([array[i], array[j]])
    }
  }
  return combinations
}

describe('matchers.js', () => {
  describe('term', () => {
    const factories: [string, (value: string) => NamedNode][] = [
      ['oxigraph', oxigraph.namedNode],
      ['@rdfjs', rdf.namedNode],
      ['rdf-data-factory', new rdfDataFactory.DataFactory().namedNode],
    ]

    for (const [left, right] of getAllCombinations(factories)) {
      it(`can compare ${left[0]} with ${right[0]}`, () => {
        // given
        const iri = 'http://example.org/'
        const leftTerm = left[1](iri)
        const rightTerm = right[1](iri)

        expect(leftTerm).to.be.eq(rightTerm)
      })
    }

    context('when actual object is pointer', () => {
      it('succeeds when equal', () => {
        // given
        const iri = 'http://example.org/'
        const pointer = rdf.clownface().node(oxigraph.namedNode(iri))

        expect(pointer).to.be.eq(rdf.namedNode(iri))
      })

      it('fails when not equal', () => {
        // given
        const iri = 'http://example.org/'
        const pointer = rdf.clownface().node(oxigraph.namedNode(iri))

        expect(pointer).to.be.eq(rdf.literal(iri))
      })

      it('fails when multi-pointer', () => {
        // given
        const iri = 'http://example.org/'
        const pointer = rdf.clownface().node([
          oxigraph.namedNode(iri + 1),
          oxigraph.namedNode(iri + 2),
        ])

        expect(pointer).to.be.eq(rdf.namedNode(iri))
      })
    })

    context('when actual and expected objects are pointers', () => {
      it('succeeds when equal', () => {
        // given
        const iri = 'http://example.org/'
        const actual = rdf.clownface().node(oxigraph.namedNode(iri))
        const expected = rdf.clownface().node(rdf.namedNode(iri))

        expect(actual).to.be.eq(expected)
      })

      it('succeeds when equal multi-pointers', () => {
        // given
        const iri = 'http://example.org/'
        const actual = rdf.clownface().node([
          oxigraph.namedNode(iri + 1),
          oxigraph.namedNode(iri + 2),
        ])
        const expected = rdf.clownface().node([
          rdf.namedNode(iri + 1),
          rdf.namedNode(iri + 2),
        ])

        expect(actual).to.be.eq(expected)
      })

      it('fails when not equal multi-pointers', () => {
        // given
        const iri = 'http://example.org/'
        const actual = rdf.clownface().node([
          oxigraph.namedNode(iri + 1),
          oxigraph.namedNode(iri + 2),
        ])
        const expected = rdf.clownface().node([
          rdf.namedNode(iri + 1),
          rdf.namedNode(iri + 3),
        ])

        expect(actual).to.be.eq(expected)
      })
    })
  })
})
