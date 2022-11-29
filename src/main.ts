import * as core from '@actions/core'
import bloaty from './bloaty'

async function run(): Promise<void> {
  try {
    const bloatyPath: string = core.getInput('bloaty_path', {required: true})
    const archiverPath: string | null = core.getInput('archiver_path')
    const derivedDataPath: string | null = core.getInput('derived_data_path')

    core.debug(
      `bloatyPath: ${bloatyPath} derivedDataPath: ${derivedDataPath} archiverPath: ${archiverPath}`
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
