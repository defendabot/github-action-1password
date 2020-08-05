import os from 'os'
import { addPath, exportVariable, getInput, setFailed } from '@actions/core'
import { downloadTool, extractZip } from '@actions/tool-cache'
import { mv } from '@actions/io'
import { chmod } from '@actions/io/lib/io-util'
import { exec } from '@actions/exec'
import { execSync } from 'child_process'

async function run(): Promise<void> {
  const onePasswordVersion = getInput('version')
  const platform = os.platform().toLowerCase()
  const onePasswordUrl = `https://cache.agilebits.com/dist/1P/op/pkg/v${onePasswordVersion}/op_${platform}_amd64_v${onePasswordVersion}.zip`
  const destination = `${process.env.HOME}/bin`
  try {
    const path = await downloadTool(onePasswordUrl)
    const extracted = await extractZip(path)
    await mv(`${extracted}/op`, `${destination}/op`)
    await chmod(`${destination}/op`, '0755')
    addPath(destination)
    const deviceId = execSync('head -c 16 /dev/urandom | base32 | tr -d = | tr [:upper:] [:lower:]')
    exportVariable('OP_DEVICE', deviceId.toString())
    const output = execSync(
      `printf '%s' "${getInput('password')}" | op signin ${getInput('url')} ${getInput('email')} ${getInput('secret')} --raw`,
    )
    exportVariable('OP_SESSION_my', output.toString())
  } catch (error) {
    setFailed(error.message)
  }
}

// eslint-disable-next-line github/no-then
run().then(async () => exec('op'))
