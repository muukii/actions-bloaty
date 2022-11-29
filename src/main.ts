import * as core from '@actions/core'
import bloaty from './bloaty'

async function run(): Promise<void> {
  try {
    const bloatyPath: string = core.getInput('bloaty_path', {required: true})
    const archiverPath: string | null = core.getInput('archiver_path')
    const derivedDataPath: string | null = core.getInput('derived_data_path')

    if (archiverPath === null && derivedDataPath === null) {
      throw new Error(
        'You must specify either archiver_path or derived_data_path'
      )
    }

    core.info(
      `bloatyPath: ${bloatyPath} derivedDataPath: ${derivedDataPath} archiverPath: ${archiverPath}`
    )

    const mode = archiverPath ? 'xcarchive' : 'derivedData'

    core.info(mode)

    const result = await bloaty(
      bloatyPath,
      archiverPath ?? derivedDataPath ?? '',
      mode,
      undefined,
      undefined,
      log => {
        core.info(log)
      }
    )

    core.info(result)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
