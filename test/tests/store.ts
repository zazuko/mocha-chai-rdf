import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import { createStore } from '../../lib/store.js'

describe('store.js', () => {
  describe('createStore', () => {
    describe('before, turtle', () => {
      before(createStore(import.meta.url))

      it('loads expected triples', function () {
        expect(this.rdf.dataset).to.have.property('size', 1)
        expect(this.rdf.graph.has(rdf.ns.rdfs.label).out(rdf.ns.rdfs.label).value).to.eq('Turtle used in before')
      })

      it('provides access properties', function () {
        expect(this.rdf).to.have.property('graph')
        expect(this.rdf).to.have.property('dataset')
        expect(this.rdf).to.have.property('store')
        expect(this.rdf).to.have.property('streamClient')
        expect(this.rdf).to.have.property('parsingClient')
      })
    })

    describe('beforeEach, turtle', () => {
      beforeEach(createStore(import.meta.url))

      it('loads expected triples', function () {
        expect(this.rdf.dataset).to.have.property('size', 1)
        expect(this.rdf.graph.has(rdf.ns.rdfs.label).out(rdf.ns.rdfs.label).value).to.eq('Turtle used in before')
      })
    })

    describe('beforeEach, trig', () => {
      beforeEach(createStore(import.meta.url, { format: 'trig' }))

      context('graph exists', () => {
        it('loads expected triples', function () {
          expect(this.rdf.dataset).to.have.property('size', 1)
          expect(this.rdf.graph.has(rdf.ns.rdfs.label).out(rdf.ns.rdfs.label).value).to.eq('Trig used in beforeEach')
        })
      })

      context('graph does not exist', () => {
        it('throws', function () {
          expect(this.rdf.dataset).to.have.property('size').gt(0)
        })
      })
    })

    describe('beforeEach, trig, all graphs', () => {
      beforeEach(createStore(import.meta.url, {
        format: 'trig',
        loadAll: true,
        baseIri: 'https://example.com/',
      }))

      it('loads expected triples', function () {
        expect(this.rdf.graph.has(rdf.ns.rdfs.label).out(rdf.ns.rdfs.label).values).to.contain.all.members(
          [
            'Trig used in beforeEach',
            'Label from another graph',
          ])
      })
    })
  })
})
