const compress_images = require('compress-images')
const glob = require("glob")
const PngQuant = require("pngquant")
const path = require('path')
const fs = require('fs')

const ts = () => new Date().toTimeString().substr(0, 8)
const pngQuantArgs = [256, '--quality', '70-100']

const fromDir = "H:/ip7-bcsystem-backup/bcdata/raw/bcdata/images/201811"
const toDir = "H:/ip7-bcsystem-backup/bcdata/raw/bcdata-compressed/images/201811"

if (!fs.existsSync(toDir)) {
  console.warn("Create Directory %s", toDir);
  fs.mkdirSync(toDir)
}

fs.readdir(fromDir, (err, files) => {
  let totalFiles = files.length
  let pngs = files.filter(f => f.toLowerCase().endsWith(".png"))
  let totalPngs = pngs.length
  let startTime = new Date().getTime()
  console.log("%s totalPngs=%s, totalFiles=%s", ts(), totalPngs, totalFiles)

  // sequence
  let p = Promise.resolve()
  let errorFiles = []
  pngs.forEach((file, index) => {
    p = p.then(() => compressPng(file, index, totalPngs))
      .catch(error => {
        errorFiles.push(file);
        console.info("%s [%s/%s] error='%s'", ts(), index + 1, total, error);
      });
  });

  p.then(() => {
    if (errorFiles.length > 0) console.error("error compress files = %s", errorFiles.join("\r\n"))
  })
});

function compressPng(file, index, total) {
  return new Promise((resolve, reject) => {
    let target = path.resolve(toDir, file)
    if (fs.existsSync(target)) {
      console.info("%s [%s/%s] ignore because target file exists: '%s'", new Date().toTimeString().substr(0, 8), index + 1, total, target)
      resolve()
    } else {
      let source = path.resolve(fromDir, file)
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
