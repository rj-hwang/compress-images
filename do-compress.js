const compress_images = require('compress-images')
const glob = require("glob")
const PngQuant = require("pngquant")
const path = require('path')
const fs = require('fs')
const PromisePool = require('es6-promise-pool')

const ts = () => new Date().toTimeString().substr(0, 8)
const fileSize = file => fs.statSync(file)["size"]
const pngQuantArgs = [256, '--quality', '70-100']
const concurrency = 10

const fromDir = "H:/ip7-bcsystem-backup/bcdata/raw/bcdata/images/201811"
const toDir = "H:/ip7-bcsystem-backup/bcdata/raw/bcdata-compressed/images/201811"

// create target directory if not exixts
if (!fs.existsSync(toDir)) {
  console.warn("Create Directory %s", toDir);
  fs.mkdirSync(toDir)
}

// read all files from source directory
let errorFiles = []
let zeroFiles = []
let preCompressedFiles = []
fs.readdir(fromDir, (err, files) => {
  let totalFiles = files.length

  // filter only png images
  let pngs = files.filter(f => f.toLowerCase().endsWith(".png"))
  let notPngs = files.filter(f => !(f.toLowerCase().endsWith(".png")))
  let totalPngs = pngs.length
  console.log("%s totalFiles=%s, totalPngs=%s totalNotPngs=%s", ts(), totalFiles, totalPngs, notPngs.length)

  // pool
  const generatePromises = function* () {
    for (let index = 0; index < totalPngs; index++) {
      yield compressPng(pngs[index], index, totalPngs).catch(error => {
        console.error("%s [%s/%s] Error: file='%s', error='%s'", ts(), index + 1, totalPngs, pngs[index], error)
        errorFiles.push(pngs[index])
      })
    }
  }
  const promiseIterator = generatePromises()
  const pool = new PromisePool(promiseIterator, concurrency)
  pool.start().then(() => {
    let msg = `Result: compressed=${totalPngs - preCompressedFiles.length - zeroFiles.length - errorFiles.length}`
      + `, zeroSizeIgnored=${zeroFiles.length}, preCompressedIgnored=${preCompressedFiles.length}`
      + `, failed=${errorFiles.length}, notPngs=${notPngs.length}`
    if (zeroFiles.length > 0) msg += `\r\n  zeroFiles:\r\n    ${zeroFiles.join("\r\n    ")}`
    if (errorFiles.length > 0) msg += `\r\n  errorFiles:\r\n    ${errorFiles.join("\r\n    ")}`
    if (notPngs.length > 0) msg += `\r\n  notPngs:\r\n    ${notPngs.join("\r\n    ")}`
    console.warn(msg)
  })
});

// compress one png image
function compressPng(png, index, total) {
  return new Promise((resolve, reject) => {
    let source = path.resolve(fromDir, png)
    let target = path.resolve(toDir, png)
    if (fs.existsSync(target) && fileSize(target) > 0) {
      //console.info("%s [%s/%s] ignore because target file exists: '%s'", ts(), index + 1, total, target)
      preCompressedFiles.push(png)
      resolve()
    } else if (fileSize(source) === 0) {
      console.info("%s [%s/%s] ignore because source file size=0: file='%s'", ts(), index + 1, total, source)
      zeroFiles.push(png)
      resolve()
    } else {
      console.info("%s [%s/%s] start from=%s, to=%s", ts(), index + 1, total, source, target)
      // input
      const input = fs.createReadStream(source)
      input.on('error', e => resolveError(resolve, e, png, index, total))

      // output
      const output = fs.createWriteStream(target)
      output.on('error', e => resolveError(resolve, e, png, index, total))
      output.on('finish', () => {
        console.info("%s [%s/%s] end from='%s', to='%s'", ts(), index + 1, total, source, target)
        resolve()
      });

      // pngQuqnt
      const pngQuant = new PngQuant(pngQuantArgs)
      pngQuant.on('error', e => resolveError(resolve, e, png, index, total))

      // pipe all
      input.pipe(pngQuant).pipe(output)
    }
  });
}

const resolveError = (resolve, e, png, index, total) => {
  errorFiles.push(png)
  console.error("%s [%s/%s] error: file='%s', error='%s'", ts(), index + 1, total, png, e)
  resolve()
}