import module from 'node:module'
import * as fs from 'node:fs'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { Store } from 'oxigraph'
import { expect, use } from 'chai'
import rdf from '@zazuko/env-node'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import { getStreamAsArray } from 'get-stream'
import type { Quad } from '@rdfjs/types'
import { parsingClient, streamClient } from '../../lib/sparql-clients.js'
import matchers from '../../lib/matchers.js'

const require = module.createRequire(import.meta.url)

use(matchers)

const ex = rdf.namespace('http://example.com/')

describe('sparql-clients.js', () => {
  describe('parsingClient', () => {
    let client: ParsingClient
    let store: Store

    before(() => {
      store = new Store()
      store.load(fs.readFileSync(require.resolve('tbbt-ld/dist/tbbt.nq')).toString(), {
        format: 'application/n-quads',
      })
      client = parsingClient(store)
    })

    it('can be queried with SELECT', async () => {
      const results = await client.query.select(`
        SELECT ?name WHERE {
          <http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/givenName> ?name
        }
      `)

      expect(results).to.deep.equal([
        { name: rdf.literal('Amy') },
      ])
    })

    it('can be queried with CONSTRUCT', async () => {
      const results = await client.query.construct(`
        CONSTRUCT WHERE {
          <http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/givenName> ?name
        }
      `)

      expect([...results][0]).to.equal(rdf.quad(
        rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
        rdf.ns.schema.givenName,
        rdf.literal('Amy'),
      ))
    })

    it('can be queried with ASK', async () => {
      const result = await client.query.ask(`
        ASK {
          ?person <http://schema.org/givenName> ?name
        }
      `)

      expect(result).to.equal(true)
    })

    it('can be updated', async () => {
      await client.query.update(`
        INSERT {
          GRAPH ?g { 
            ?person <http://schema.org/name> ?newName
          }
        }
        WHERE {
          GRAPH ?g {
            ?person <http://schema.org/givenName> ?name ;
                    <http://schema.org/familyName> ?familyName .
            BIND(CONCAT(?name, " ", ?familyName) AS ?newName)
          }
        }
      `)

      expect(store.match(rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'), rdf.ns.schema.name)).to.deep.equal([
        rdf.quad(
          rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
          rdf.ns.schema.name,
          rdf.literal('Amy Fowler'),
          rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
        ),
      ])
    })
  })

  describe('streamClient', () => {
    let client: StreamClient
    let store: Store

    beforeEach(() => {
      store = new Store()
      store.load(fs.readFileSync(require.resolve('tbbt-ld/dist/tbbt.nq')).toString(), {
        format: 'application/n-quads',
      })
      client = streamClient(store)
    })

    context('query', () => {
      it('can be queried with SELECT', async () => {
        const stream = client.query.select(`
          SELECT ?name WHERE {
            <http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/givenName> ?name
          }
        `)

        const results = await getStreamAsArray(stream)

        expect(results).to.deep.equal([
          { name: rdf.literal('Amy') },
        ])
      })

      it('can be queried with CONSTRUCT', async () => {
        const stream = client.query.construct(`
          CONSTRUCT WHERE {
            <http://localhost:8080/data/person/amy-farrah-fowler> <http://schema.org/givenName> ?name
          }
        `)

        const results = await getStreamAsArray<Quad>(stream)

        expect([...results][0]).to.equal(rdf.quad(
          rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
          rdf.ns.schema.givenName,
          rdf.literal('Amy'),
        ))
      })

      it('can be queried with ASK', async () => {
        const result = await client.query.ask(`
          ASK {
            ?person <http://schema.org/givenName> ?name
          }
        `)

        expect(result).to.equal(true)
      })

      it('can be updated', async () => {
        await client.query.update(`
          INSERT {
            GRAPH ?g { 
              ?person <http://schema.org/name> ?newName
            }
          }
          WHERE {
            GRAPH ?g {
              ?person <http://schema.org/givenName> ?name ;
                      <http://schema.org/familyName> ?familyName .
              BIND(CONCAT(?name, " ", ?familyName) AS ?newName)
            }
          }
        `)

        expect(store.match(rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'), rdf.ns.schema.name)).to.deep.equal([
          rdf.quad(
            rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
            rdf.ns.schema.name,
            rdf.literal('Amy Fowler'),
            rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'),
          ),
        ])
      })
    })

    context('store', () => {
      context('get', () => {
        it('can fetch a select graph', async () => {
          // when
          const stream = client.store.get(rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler'))
          const dataset = await rdf.dataset().import(stream)

          // then
          expect(dataset).to.have.property('size', 12)
        })
      })

      context('post', () => {
        it('can add to a named graph', async () => {
          // given
          const data = rdf.clownface()
            .namedNode(ex.foo)
            .addOut(rdf.ns.schema.name, 'Foo')

          // when
          await client.store.post(data.dataset.toStream(), {
            graph: ex.Foo,
          })

          // then
          expect(store.match(null, null, null, ex.Foo)).to.have.length(1)
        })

        it('can add to default graph', async () => {
          // given
          const data = rdf.clownface()
            .namedNode(ex.foo)
            .addOut(rdf.ns.schema.name, 'Foo')

          // when
          await client.store.post(data.dataset.toStream())

          // then
          expect(store.match(null, null, null, rdf.defaultGraph())).to.have.length(1)
        })
      })

      context('put', () => {
        it('can replace named graph', async () => {
          // given
          const graph = rdf.namedNode('http://localhost:8080/data/person/amy-farrah-fowler')
          const data = rdf.clownface()
            .namedNode(ex.foo)
            .addOut(rdf.ns.schema.name, 'Foo')

          // when
          await client.store.put(data.dataset.toStream(), { graph })

          // then
          expect(store.match(null, null, null, graph)).to.have.length(1)
        })

        it('can replace default graph data', async () => {
          // given
          const foo = rdf.clownface()
            .namedNode(ex.foo)
            .addOut(rdf.ns.schema.name, 'Foo')
          const bar = rdf.clownface()
            .namedNode(ex.foo)
            .addOut(rdf.ns.schema.name, 'Bar')

          // when
          await client.store.put(foo.dataset.toStream())
          await client.store.put(bar.dataset.toStream())

          // then
          const matched = store.match(ex.foo, null, null, rdf.defaultGraph())
          expect(matched).to.have.length(1)
          expect(matched[0].object.value).to.have.eq('Bar')
        })
      })
    })
  })
})
