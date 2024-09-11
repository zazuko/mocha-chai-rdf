import '../../lib/snapshots.js'
import rdf from '@zazuko/env-node'
import { expect } from 'chai'

describe('snapshots.js', () => {
  it('can be used to match canonical representation', () => {
    const dataset = rdf.dataset([
      rdf.quad(rdf.namedNode('http://example.org/'), rdf.namedNode('http://example.org/'), rdf.namedNode('http://example.org/')),
    ])

    expect(dataset).canonical.toMatchSnapshot()
  })

  it('preserves original functionality', async () => {
    const dataset = rdf.dataset([
      rdf.quad(rdf.namedNode('http://example.org/s'), rdf.namedNode('http://example.org/p'), rdf.namedNode('http://example.org/o')),
    ])

    expect(await dataset.serialize({ format: 'application/ld+json' })).toMatchSnapshot()
  })
})
