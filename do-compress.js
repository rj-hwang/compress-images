const compress_images = require('compress-images')
const glob = require("glob")
const PngQuant = require("pngquant")
const path = require('path')
const fs = require('fs')
const PromisePool = require('es6-promise-pool')

const ts = () => new Date().toTimeString().substr(0, 8)
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
fs.readdir(fromDir, (err, files) => {
  let totalFiles = files.length

  // filter only png images
  let pngs = files.filter(f => f.toLowerCase().endsWith(".png"))
  let totalPngs = pngs.length
  console.log("%s totalPngs=%s, totalFiles=%s", ts(), totalPngs, totalFiles)
  let errorFiles = []

  // pool
  const generatePromises = function* () {
    for (let index = 0; index < totalPngs; index++) {
      yield compressPng(pngs[index], index, totalPngs).catch(error => errorFiles.push(pngs[index]))
    }
  }
  const promiseIterator = generatePromises()
  const pool = new PromisePool(promiseIterator, concurrency)
  pool.start().then(() => {
    console.error("Compress files: success=%s, failed=%s", totalPngs - errorFiles.length, errorFiles.length)
    if (errorFiles.length > 0) console.error("failed files = %s", errorFiles.join("\r\n  "))
    if (totalFiles !== totalPngs) console.warn("You need to manual deal with %s files (not png image) in the source directory!", totalFiles - totalPngs)
  })
});

// compress one png image
function compressPng(png, index, total) {
  return new Promise((resolve, reject) => {
    let target = path.resolve(toDir, png)
    if (fs.existsSync(target)) {
      console.info("%s [%s/%s] ignore because target file exists: '%s'", new Date().toTimeString().substr(0, 8), index + 1, total, target)
      resolve()
    } else {
      let source = path.resolve(fromDir, png)
      //console.info("%s [%s/%s] from=%s, to=%s", new Date().toTimeString().substr(0, 8), index + 1, total, source, target)
      const input = fs.createReadStream(source)
      const output = fs.createWriteStream(target)
      output.on('error', reject)
      input.on('error', reject)
      output.on('finish', () => {
        console.info("%s [%s/%s] from='%s', to='%s'", ts(), index + 1, total, source, target)
        resolve()
      });
      input.pipe(new PngQuant(pngQuantArgs)).pipe(output)
    }
  });
}
