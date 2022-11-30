import * as glob from '@actions/glob'
import bloaty from './bloaty'
import path from 'path'
;(async () => {
  console.log('hello', glob)

  const result = await bloaty(
    'bloaty',
    {
      type: 'xcarchive',
      xcarchivePath:
        '/Users/muukii/Downloads/AppStore-JP-AppStore2022.11.24.07.13.xcarchive'
    },
    undefined,
    '-n 100',
    log => {
      console.log(log)
    }
  )
})()
