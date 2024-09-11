import type * as Oxigraph from 'oxigraph'
import type { Quad, Term } from '@rdfjs/types'
import rdf from '@zazuko/env-node'
import toStream from 'into-stream'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'

function select(store: Oxigraph.Store, query: string) {
  const results = store.query(query, {
    use_default_graph_as_union: true,
  }) as Array<Map<string, Term>>

  return results.map((result) => {
    const bindings: Record<string, Term> = {}

    for (const [key, value] of result.entries()) {
      bindings[key] = value
    }

    return bindings
  })
}

function construct(store: Oxigraph.Store, query: string) {
  const results = store.query(query, {
    use_default_graph_as_union: true,
  }) as Quad[]

  return rdf.dataset(results)
}

async function ask(store: Oxigraph.Store, query: string): Promise<boolean> {
  return store.query(query, {
    use_default_graph_as_union: true,
  }) as boolean
}

async function update(store: Oxigraph.Store, query: string) {
  return store.update(query, {})
}

export function parsingClient(store: Oxigraph.Store): ParsingClient {
  return {
    query: {
      async select(query: string) {
        return select(store, query)
      },
      async construct(query: string) {
        return construct(store, query)
      },
      ask: ask.bind(null, store),
      update: update.bind(null, store),
    },
    store: {} as unknown as ParsingClient['store'],
  }
}

export function streamClient(store: Oxigraph.Store): StreamClient {
  return {
    query: {
      select(query: string) {
        const bindings = select(store, query)
        return toStream.object(bindings)
      },
      construct(query: string) {
        const dataset = construct(store, query)
        return dataset.toStream()
      },
      ask: ask.bind(null, store),
      update: update.bind(null, store),
    },
    store: {} as unknown as StreamClient['store'],
  }
}
