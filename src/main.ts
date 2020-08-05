import os from 'os'
import { addPath, exportVariable, getInput, setFailed, setOutput } from '@actions/core'
import { downloadTool, extractZip } from '@actions/tool-cache'
import { mv } from '@actions/io'
import { chmod } from '@actions/io/lib/io-util'
import { execSync } from 'child_process'
import { exec, ExecOptions } from '@actions/exec'

const deviceId = execSync('head -c 16 /dev/urandom | base32 | tr -d = | tr [:upper:] [:lower:]').toString().trim()

async function run(): Promise<void> {
  const onePasswordVersion = getInput('version')
  const platform = os.platform().toLowerCase()
  const onePasswordUrl = `https://cache.agilebits.com/dist/1P/op/pkg/v${onePasswordVersion}/op_${platform}_amd64_v${onePasswordVersion}.zip`
  const destination = `${process.env.HOME}/bin`
  const options: ExecOptions = {
    env: {
      OP_DEVICE: deviceId,
    },
    input: Buffer.alloc(getInput('password').length, getInput('password')),
    listeners: {
      stdout: (output) => {
        const sessionId = output.toString().trim()
        exportVariable('OP_DEVICE', deviceId)
        exportVariable('OP_SESSION_my', sessionId)
        setOutput('session', sessionId)
      },
    },
  }
  try {
    const path = await downloadTool(onePasswordUrl)
    const extracted = await extractZip(path)
    await mv(`${extracted}/op`, `${destination}/op`)
    await chmod(`${destination}/op`, '0755')
    addPath(destination)
    await exec(`op`, ['signin', getInput('url'), getInput('email'), getInput('secret'), '--raw'], options)
    await exec('op', ['list', 'vaults'], { env: { OP_DEVICE: deviceId } })
  } catch (error) {
    setFailed(error.message)
  }
}
run()
