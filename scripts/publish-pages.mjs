import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targetBranch = 'refs/heads/gh-pages'

function git(args, input) {
  const result = spawnSync('git', args, { cwd: root, input, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args[0]} failed`)
  return result.stdout.trim()
}

function writeTree(directory) {
  const entries = readdirSync(directory, { withFileTypes: true }).map(entry => {
    if (/[\t\r\n]/.test(entry.name) || entry.isSymbolicLink()) {
      throw new Error('The generated site contains an unsupported filename or symbolic link.')
    }
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return `040000 tree ${writeTree(path)}\t${entry.name}\n`
    if (!entry.isFile()) throw new Error('The generated site contains a non-file entry.')
    return `100644 blob ${git(['hash-object', '-w', '--stdin'], readFileSync(path))}\t${entry.name}\n`
  })
  return git(['mktree'], entries.join(''))
}

let output
try {
  if (git(['status', '--porcelain'])) {
    throw new Error('Commit your source changes before publishing the public preview.')
  }
  const source = git(['rev-parse', '--verify', 'HEAD^{commit}'])
  const remotes = [git(['remote', 'get-url', 'origin']), git(['remote', 'get-url', '--push', 'origin'])]
  for (const remote of remotes) {
    const url = new URL(remote)
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.pathname.replace(/\.git$/, '') !== '/skydiazsd-gif/nido-del-bosque') {
      throw new Error('This publishing command targets skydiazsd-gif/nido-del-bosque over HTTPS. Check origin before publishing.')
    }
  }

  console.log(`Building the public preview from source ${source.slice(0, 7)}…`)
  output = mkdtempSync(join(tmpdir(), 'nido-pages-'))
  const build = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'run', 'build', '--', '--base', '/nido-del-bosque/', '--outDir', output, '--emptyOutDir',
  ], { cwd: root, stdio: 'inherit' })
  if (build.error) throw build.error
  if (build.status !== 0) throw new Error('The production build failed; nothing was published.')
  if (git(['status', '--porcelain']) || git(['rev-parse', '--verify', 'HEAD^{commit}']) !== source) {
    throw new Error('Source changed during the build. Commit the changes and run publication again.')
  }
  writeFileSync(join(output, '.nojekyll'), '')

  const remoteRef = git(['ls-remote', 'origin', targetBranch])
  let parent
  if (remoteRef) {
    git(['fetch', '--no-tags', 'origin', targetBranch])
    parent = git(['rev-parse', '--verify', 'FETCH_HEAD^{commit}'])
  }
  const tree = writeTree(output)
  if (parent && git(['rev-parse', `${parent}^{tree}`]) === tree) {
    console.log('The published preview files are already current. No new deployment commit is needed.')
  } else {
    const commit = git(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', `Publish preview of source ${source}`])
    // A normal push preserves any concurrent remote update; never force-push the site.
    git(['push', 'origin', `${commit}:${targetBranch}`])
    console.log(`Uploaded preview commit ${commit.slice(0, 7)} to gh-pages.`)
  }
  console.log('One-time GitHub setup: Settings → Pages → Deploy from a branch → gh-pages → /(root) → Save.')
  console.log('Use the site link GitHub displays after its Pages deployment succeeds.')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  if (output) rmSync(output, { recursive: true, force: true })
}
