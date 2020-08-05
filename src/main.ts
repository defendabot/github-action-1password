import os from 'os'
import { addPath, getInput, setFailed } from '@actions/core'
import { downloadTool, extractZip } from '@actions/tool-cache'
import { mv } from '@actions/io'
import { chmod } from '@actions/io/lib/io-util'
import { exec, ExecOptions } from '@actions/exec'

async function run(): Promise<void> {
  const onePasswordVersion = getInput('version')
  const platform = os.platform().toLowerCase()
  const onePasswordUrl = `https://cache.agilebits.com/dist/1P/op/pkg/v${onePasswordVersion}/op_${platform}_amd64_v${onePasswordVersion}.zip`
  const destination = `${process.env.HOME}/bin`
  const options: ExecOptions = {}
  options.listeners = {
    stdout: (data) => {
      const sessionToken = data.toString().trim()
      exec(sessionToken)
    },
    stderr: (data: Buffer) => {
      setFailed(data.toString())
    },
  }
  try {
    const path = await downloadTool(onePasswordUrl)
    const extracted = await extractZip(path)
    await mv(`${extracted}/op`, `${destination}/op`)
    await chmod(`${destination}/op`, '0755')
    addPath(destination)
  } catch (error) {
    setFailed(error.message)
  }
}

// eslint-disable-next-line github/no-then
run().then(async () => exec('op'))
