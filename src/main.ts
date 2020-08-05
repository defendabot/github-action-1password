import os from 'os'
import { addPath, exportVariable, getInput, setFailed } from '@actions/core'
import { downloadTool, extractZip } from '@actions/tool-cache'
import { mv } from '@actions/io'
import { chmod } from '@actions/io/lib/io-util'
import { execSync } from 'child_process'
import { exec, ExecOptions } from '@actions/exec'

async function run(): Promise<void> {
  const onePasswordVersion = getInput('version')
  const platform = os.platform().toLowerCase()
  const onePasswordUrl = `https://cache.agilebits.com/dist/1P/op/pkg/v${onePasswordVersion}/op_${platform}_amd64_v${onePasswordVersion}.zip`
  const destination = `${process.env.HOME}/bin`
  const deviceId = execSync('head -c 16 /dev/urandom | base32 | tr -d = | tr [:upper:] [:lower:]').toString().trim()
  exportVariable('OP_DEVICE', deviceId)
  const options: ExecOptions = {
    env: {
      OP_DEVICE: deviceId,
    },
    input: Buffer.alloc(getInput('password').length, getInput('password')),
    listeners: { stdout: (output) => exportVariable('OP_SESSION_my', output.toString().trim()) },
  }
  try {
    const path = await downloadTool(onePasswordUrl)
    const extracted = await extractZip(path)
    await mv(`${extracted}/op`, `${destination}/op`)
    await chmod(`${destination}/op`, '0755')
    addPath(destination)
    await exec(`op signin ${getInput('url')} ${getInput('email')} ${getInput('secret')} --raw`, [], options)
  } catch (error) {
    setFailed(error.message)
  }
}

run()
