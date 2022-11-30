import * as glob from '@actions/glob'
import path from 'path'
;(async () => {
  console.log('hello', glob)

  process.chdir('/Users/muukii/.ghq/github.com/muukii/play-bloaty-action')

  const patterns = [path.join('DerivedData', '**/*.app')]

  const globber = await glob.create(patterns.join('\n'), {
    implicitDescendants: false
  })
  console.log(globber.getSearchPaths())
  const files = await globber.glob()

  console.log(files)
})()
