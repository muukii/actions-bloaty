import * as core from '@actions/core'
import bloaty from './bloaty'

async function run(): Promise<void> {
  try {
    const bloatyPath: string = core.getInput('bloaty_path', {required: true})
    const xcarchivePath: string | null = core.getInput('xcarchive_path')
    const derivedDataPath: string | null = core.getInput('derived_data_path')

    if (xcarchivePath === null && derivedDataPath === null) {
      throw new Error(
        'You must specify either archiver_path or derived_data_path'
      )
    }

    core.info(
      `bloatyPath: ${bloatyPath} derivedDataPath: ${derivedDataPath} xcarchivePath: ${xcarchivePath}`
    )

    if (xcarchivePath) {
      const result = await bloaty(
        bloatyPath,
        {
          type: 'xcarchive',
          xcarchivePath: xcarchivePath
        },
        undefined,
        undefined,
        log => {
          core.info(log)
        }
      )

      core.info(result)
    }

    if (derivedDataPath) {
      const result = await bloaty(
        bloatyPath,
        {
          type: 'derivedData',
          derivedDataPath: derivedDataPath
        },
        undefined,
        undefined,
        log => {
          core.info(log)
        }
      )

      core.info(result)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
