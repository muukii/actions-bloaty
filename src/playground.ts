import * as glob from '@actions/glob'
import path from 'path'
;(async () => {
  console.log('hello', glob)

  const patterns = [
    path.join(
      '/Users/muukii/.ghq/github.com/muukii/play-bloaty-action',
      '**/*.app'
    )
  ]

  const globber = await glob.create(patterns.join('\n'), {
    implicitDescendants: false
  })
  const files = await globber.glob()

  console.log(files)
})()
