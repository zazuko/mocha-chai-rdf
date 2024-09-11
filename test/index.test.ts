/* eslint-disable @typescript-eslint/no-explicit-any */
import * as url from 'node:url'
import util from 'node:util'
import * as chai from 'chai'
import { jestSnapshotPlugin } from 'mocha-chai-jest-snapshot'
import { glob } from 'glob'
import { expect } from 'chai'
import Mocha from 'mocha'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function sanitizeOutput(output: string): string {
  return output
    .replace(/\x1b\[[0-9;]*m/g, '') // eslint-disable-line no-control-regex
    .replace(/(\d+ms)/g, '0ms')
    .replace(/at (.*) \(.+?\)/g, 'at $1')
}

describe('mocha-chai-rdf', () => {
  chai.use(jestSnapshotPlugin())

  const files = glob.sync('tests/*.ts', {
    cwd: __dirname,
  })

  it('test suites', async () => {
    let output = ''

    ;(Mocha.reporters.Base as any).consoleLog = (...args: unknown[]) => {
      output += util.format(...args) + '\n'
    }

    const mocha = new Mocha()
    files.forEach((file) => {
      mocha.addFile(`./test/${file}`)
    })
    await mocha.loadFilesAsync()
    mocha.reporter(Mocha.reporters.List)

    await new Promise<void>((resolve) => {
      mocha.run(() => {
        // eslint-disable-next-line no-console
        ;(Mocha.reporters.Base as any).consoleLog = console.log
        resolve()
      })
    })

    expect(sanitizeOutput(output)).toMatchSnapshot()
  })
})
