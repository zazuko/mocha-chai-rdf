import { expect } from 'chai'
import rdf from '@zazuko/env-node'
import { createEmpty, createStore } from '../../lib/store.js'

const ex = rdf.namespace('http://example.org/')

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

    describe('beforeEach, ttl, with includes', () => {
      beforeEach(createStore(import.meta.url, {
        include: [
          'fixture/foo.ttl',
          'fixture/bar.trig',
        ],
      }))

      it('loads expected triples', function () {
        expect(this.rdf.dataset.match(ex.foo, rdf.ns.rdf.type, ex.Foo, rdf.defaultGraph())).to.have.property('size', 1)
        expect(this.rdf.dataset.match(ex.bar, rdf.ns.rdf.type, ex.Bar, ex.bar)).to.have.property('size', 1)
      })
    })

    describe('beforeEach, trig, with includes', () => {
      beforeEach(createStore(import.meta.url, {
        format: 'trig',
        loadAll: true,
        baseIri: 'https://example.com/',
        include: [
          'fixture/foo.ttl',
          'fixture/bar.trig',
        ],
      }))

      it('loads expected triples', function () {
        expect(this.rdf.dataset.match(ex.foo, rdf.ns.rdf.type, ex.Foo, rdf.defaultGraph())).to.have.property('size', 1)
        expect(this.rdf.dataset.match(ex.bar, rdf.ns.rdf.type, ex.Bar, ex.bar)).to.have.property('size', 1)
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

      context('graph:needs:escaping', () => {
        it('loads expected triples', function () {
          expect(this.rdf.dataset).to.have.property('size', 1)
          expect(this.rdf.graph.has(rdf.ns.rdfs.label).out(rdf.ns.rdfs.label).value).to.eq("I'm here")
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

  describe('createEmpty', () => {
    beforeEach(createEmpty)

    it('initializes empty dataset', function () {
      expect(this.rdf.dataset).to.have.property('size', 0)
    })

    it('sparql updates are reflected in dataset', function () {
      this.rdf.store.update(`
        PREFIX ex: <http://example.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        INSERT DATA { 
          GRAPH ex:Foo { ex:foo rdfs:label "Foo" }
        }`)

      expect(this.rdf.graph.namedNode('http://example.org/foo').out(rdf.ns.rdfs.label).value).to.eq('Foo')
    })

    it('provides access properties', function () {
      expect(this.rdf).to.have.property('graph')
      expect(this.rdf).to.have.property('dataset')
      expect(this.rdf).to.have.property('store')
      expect(this.rdf).to.have.property('streamClient')
      expect(this.rdf).to.have.property('parsingClient')
    })
  })
})
