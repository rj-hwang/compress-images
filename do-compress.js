var compress_images = require('compress-images');

const fromDir = 'fromDir/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}';
const toDir = 'toDir/';

// see https://www.npmjs.com/package/compress-images
//     https://github.com/semiromid/compress-images#api
// compress_images(input, output, option, globoption, enginejpg, enginepng, enginesvg, enginegif, callback)
compress_images(
  fromDir,
  toDir,
  {
    // 设置为 false 避免重复压缩，即如果输出目录已经有同名文件，则忽略该文件继续压缩下一个文件
    compress_force: false,
    // 设为 true 统计文件的压缩情况信息，此时 callback 中的第 3 个参数才有值
    statistic: true,
    // 是否自动更新 compress_images 为最新版本
    autoupdate: true
  },
  false,
  { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
    { png: { engine: 'pngquant', command: ['--quality=70-100'] } },
  { svg: { engine: 'svgo', command: '--multipass' } },
  { gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } },
  function (error, completed, statistic) {
    console.log('-------------');
    console.log("error=" + JSON.stringify(error));
    console.log("completed=" + completed);
    console.log("statistic=" + JSON.stringify(statistic));
    console.log('-------------');
    if (completed === true) {
      console.log("success compressed images");
    }
  }
);