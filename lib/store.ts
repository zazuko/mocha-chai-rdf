/* eslint-disable no-console,camelcase */
import * as url from 'node:url'
import assert from 'node:assert'
import * as Oxigraph from 'oxigraph'
import type { NamespaceBuilder } from '@rdfjs/namespace'
import rdf from '@zazuko/env-node'
import type { NamedNode, Quad_Graph, DatasetCore } from '@rdfjs/types'
import type { AnyPointer } from 'clownface'
import type { Dataset } from '@zazuko/env/lib/DatasetExt.js'
import type { StreamClient } from 'sparql-http-client/StreamClient.js'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import * as clients from './sparql-clients.js'

declare module 'mocha' {
  interface Context {
    rdf: {
      dataset: Dataset
      graph: AnyPointer
      store: Oxigraph.Store
      streamClient: StreamClient
      parsingClient: ParsingClient
    }
  }
}

interface DatasetSourceOptions {
  format?: 'trig' | 'nq'
  loadAll?: boolean
  includeDefaultGraph?: boolean
}

interface GraphSourceOptions {
  format?: 'ttl' | 'nt'
}

type Options = (DatasetSourceOptions | GraphSourceOptions) & {
  baseIri?: string | NamespaceBuilder
  sliceTestPath?: [number, number]
  include?: string[]
}

export function createEmpty(this: Mocha.Context) {
  const store = new Oxigraph.Store()

  const rdfFixture = {
    get dataset() {
      return rdf.dataset(store.match())
    },
    get graph() {
      return rdf.clownface({ dataset: this.dataset })
    },
    store,
    streamClient: clients.streamClient(store),
    parsingClient: clients.parsingClient(store),
  }

  Object.defineProperty(this, 'rdf', {
    get() {
      return rdfFixture
    },
    configurable: true,
  })

  afterEach(() => {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    delete this.rdf
  })
}

export function createStore(base: string, { sliceTestPath = [1, -1], include = [], ...options }: Options = { }) {
  const baseIRI: string | undefined = typeof options.baseIri === 'string'
    ? options.baseIri
    : options.baseIri?.().value
  const format = options.format ?? 'ttl'
  let loadAll = true
  let includeDefaultGraph = false
  if (options.format === 'trig' || options.format === 'nq') {
    loadAll = options.loadAll || false
    includeDefaultGraph = options.includeDefaultGraph || false
  }

  return async function (this: Mocha.Context) {
    const store = new Oxigraph.Store()

    const path = url.fileURLToPath(new url.URL(`${base}.${format}`))

    let dataset = await rdf.dataset().import(rdf.fromFile(path, {
      baseIRI,
    }))

    await Promise.all((include).map(async (file) => {
      const path = url.fileURLToPath(new url.URL(file, base))
      return dataset.import(rdf.fromFile(path, { baseIRI }))
    }))

    let graph: Quad_Graph | undefined
    if (this.currentTest && !loadAll) {
      graph = testGraph(this.currentTest, sliceTestPath)
      dataset = dataset
        .filter((quad) => {
          return (graph && decodeURIComponent(quad.graph.value) === decodeURIComponent(graph.value)) ||
            (includeDefaultGraph && quad.graph.equals(rdf.defaultGraph()))
        })
        .map(function toDefaultGraph(quad) {
          return rdf.quad(quad.subject, quad.predicate, quad.object)
        }) as Dataset
    }

    await Promise.all((include).map(async (file) => {
      const path = url.fileURLToPath(new url.URL(file, base))
      await rdf.dataset.import(store as unknown as DatasetCore, rdf.fromFile(path, { baseIRI }))
    }))

    for (const quad of dataset) {
      store.add(quad)
    }

    function assertNotEmpty() {
      if (loadAll) {
        return assert(dataset.size > 0, 'Test data not found')
      }
      if (graph && !graph.equals(rdf.defaultGraph())) {
        return assert(
          dataset.size > 0,
          `Test data not found in GRAPH <${graph.value}>`,
        )
      }

      return assert(
        dataset.match(null, null, null, graph).size > 0,
        `Test data not found in GRAPH <${graph?.value}>`,
      )
    }

    const rdfFixture = {
      get dataset() {
        return rdf.dataset(store.match())
      },
      get graph() {
        return rdf.clownface({ dataset: this.dataset })
      },
      store,
      streamClient: clients.streamClient(store),
      parsingClient: clients.parsingClient(store),
    }

    Object.defineProperty(this, 'rdf', {
      get() {
        assertNotEmpty()
        return rdfFixture
      },
      configurable: true,
    })

    // hack to remove the graph after the test just at the right moment
    const cleanup = this.test?.title.includes('before all') ? after : afterEach
    cleanup(() => {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      delete this.rdf
    })
  }
}

function testGraph(test: Mocha.Test, slice: [number, number]): NamedNode {
  return rdf.namedNode(encodeURI(test.titlePath().slice(...slice).map(removeSpaces).join('/')))
}

function removeSpaces(arg: string) {
  return arg.replaceAll(' ', '-')
}
