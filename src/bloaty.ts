import * as glob from '@actions/glob'
import path from 'path'
import fs from 'fs'
import * as exec from '@actions/exec'

const other_options = ''
const datasource = '-d compileunits'

const createModule = (args: {
  bloatyPath: string
  modulePath: string
  dSYMPath: string
}) => {
  return {
    modulePath: args.modulePath,
    dSYMPath: args.dSYMPath,
    name: function () {
      return path.parse(path.basename(this.modulePath)).name
    },
    makeCommand: function (externalArguments: string) {
      const basename = path.parse(path.basename(this.modulePath)).name
      const dwarfPath = path.join(
        this.dSYMPath,
        'Contents',
        'Resources',
        'DWARF',
        basename
      )
      const binaryPath = path.join(this.modulePath, basename)

      return [
        args.bloatyPath,
        other_options,
        externalArguments,
        datasource,
        `--debug-file=${dwarfPath}`,
        binaryPath
      ].join(' ')
    }
  }
}

const renderMarkdown = async (
  modules: ReturnType<typeof createModule>[],
  externalArguments: string
) => {
  let result = ''

  for (const module of modules) {
    const command = module.makeCommand(externalArguments)
    const stdout = await exec.exec(command).toString()

    result += `
## ${module.name()}

<details><summary>Detail</summary>
<p>

\`\`\`
$ ${command}
\`\`\`

\`\`\`
${stdout}
\`\`\`

</p>
</details>
    `
  }

  return result
}

const stripBitcode = async (path: string) => {
  const newPath = `${path}-stripped`

  await exec.exec(`cp -r ${path} ${newPath}`)
  await exec.exec(
    `cd ${newPath}; find . -type f -perm +111 -print | xargs -I {} sh -c 'xcrun bitcode_strip -r {} -o {}'`
  )

  return newPath
}

type DerivedDataMode = {
  type: 'derivedData'
  derivedDataPath: string
}

type XcarchiveMode = {
  type: 'xcarchive'
  xcarchivePath: string
}

export default async (
  bloatyPath: string,
  mode: DerivedDataMode | XcarchiveMode,
  filter: string | undefined,
  externalArguments: string = '',
  info: (log: string) => void
) => {
  switch (mode.type) {
    case 'derivedData': {
      info('mode: derivedData')

      const modules: ReturnType<typeof createModule>[] = []
      {
        const globber = await glob.create(
          path.join(mode.derivedDataPath, '**/*.framework'),
          {}
        )
        const files = await globber.glob()
        files.forEach(file => {
          const dSYMDirPath = file + '.dSYM'
          if (fs.existsSync(dSYMDirPath)) {
            modules.push(
              createModule({
                bloatyPath: bloatyPath,
                modulePath: file,
                dSYMPath: dSYMDirPath
              })
            )
          } else {
            info(`dSYM not found: ${dSYMDirPath}`)
          }
        })
      }

      const apps: ReturnType<typeof createModule>[] = []
      {
        const patterns = [
          '**',
          '**/*.app',
          path.join(mode.derivedDataPath, '**/*.app')
        ]

        const globber = await glob.create(patterns.join('\n'), {})

        info(
          `Find apps binary: ${globber.getSearchPaths()}, pattern: ${path.join(
            mode.derivedDataPath,
            '**/*.app'
          )}`
        )

        const files = await globber.glob()
        files.forEach(file => {
          const dSYMDirPath = file + '.dSYM'
          if (fs.existsSync(dSYMDirPath)) {
            modules.push(
              createModule({
                bloatyPath: bloatyPath,
                modulePath: file,
                dSYMPath: dSYMDirPath
              })
            )
          } else {
            info(`dSYM not found: ${dSYMDirPath}`)
          }
        })
      }

      info(`modules: ${modules.length}, apps: ${apps.length}`)

      const regex = new RegExp(filter ?? '.*')

      return await renderMarkdown(
        apps.concat(modules).filter(e => {
          return regex.test(e.name())
        }),
        externalArguments
      )
    }
    case 'xcarchive': {
      info('mode: xcarchive')

      const strippedPath = await stripBitcode(mode.xcarchivePath)

      const app = fs.readdirSync(
        path.join(strippedPath, 'Products/Applications')
      )[0]

      const appModule = createModule({
        bloatyPath: bloatyPath,
        modulePath: path.join(strippedPath, 'Products/Applications', app),
        dSYMPath: path.join(strippedPath, 'dSYMs', app + '.dSYM')
      })

      const modules: ReturnType<typeof createModule>[] = []

      const globber = await glob.create(
        path.join(
          strippedPath,
          'Products/Applications',
          app,
          '/Frameworks/*.framework'
        ),
        {}
      )
      const files = await globber.glob()

      files.forEach(file => {
        const frameworkName = path.basename(file)

        const dSYMDirPath = path.join(
          strippedPath,
          `dSYMs/${frameworkName}.dSYM`
        )
        if (fs.existsSync(dSYMDirPath)) {
          modules.push(
            createModule({
              bloatyPath: bloatyPath,
              modulePath: file,
              dSYMPath: dSYMDirPath
            })
          )
        } else {
          info(`dSYM not found: ${dSYMDirPath}`)
        }
      })

      const regex = new RegExp(filter ?? '.*')

      const targets = [appModule].concat(modules).filter(e => {
        return regex.test(e.name())
      })

      // console.log(targets.map((e) => e.name()));

      return await renderMarkdown(targets, externalArguments)
    }
  }
}
