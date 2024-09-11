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

  describe('sparqlClient', () => {
    let client: StreamClient
    let store: Store

    before(() => {
      store = new Store()
      store.load(fs.readFileSync(require.resolve('tbbt-ld/dist/tbbt.nq')).toString(), {
        format: 'application/n-quads',
      })
      client = streamClient(store)
    })

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
})
