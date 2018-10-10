/**
* Модуль получает в качестве парамента json-строку, где один из параметров относительный адрес имиджа
* Вычисляет средние значения цветов в имидже, а потом сравнивает с эталоном отсутствия имиджа
* 
*
* @function checkImage
* @param {String} foo Argument 1
*/

const request = require('request');
const path = require('path');
const util = require('util');

const streamToBufferProm = util.promisify(require('stream-to-buffer'));
const readimageProm = util.promisify(require('readimage'));

// Эталон, вычисляемый эксперементальным путем, ваше оригинальное значение [28, 28, 28, 255]
// Я сделал чуть с запасом
const controlPoint = [30, 30, 30, 255]

// Само вычисление значений цвета
async function process(data) {
    const image = await readimageProm(data);

    var pixels = image.frames[0].data;

    var totalRed = 0,
        totalGreen = 0,
        totalBlue = 0,
        totalAlpha = 0;

    for (var i = 0; i < pixels.length; i += 4) {
        totalRed += pixels[i],
            totalGreen += pixels[i + 1],
            totalBlue += pixels[i + 2],
            totalAlpha += pixels[i + 3];
    }

    var pixelsCount = pixels.length / 4;

    var averageRed = Math.round(totalRed / pixelsCount),
        averageGreen = Math.round(totalGreen / pixelsCount),
        averageBlue = Math.round(totalBlue / pixelsCount),
        averageAlpha = Math.round(totalAlpha / pixelsCount);

    return [averageRed, averageGreen, averageBlue, averageAlpha];
}

// Обработка входного параметра (json-строки), загрузка имиджа в буффер, анализ и возврат сравнения
async function checkImage(jsonStr) {
    const relFileUrl = path.join('http://cdn.snap.menu', JSON.parse(jsonStr).Records[0].s3.object.key);

    // URL-ы имиджей для проверки работы из задания, можно подставить напрямую в аргумент request
    const url1 = 'https://bytebucket.org/snippets/top-devs/qebnqo/raw/476397382680dac386086a7b178d54129c1bfccf/0.jpeg';
    const url2 = 'https://bytebucket.org/snippets/top-devs/qebnqo/raw/476397382680dac386086a7b178d54129c1bfccf/1.jpeg';

    const buffer = await streamToBufferProm(request.get(relFileUrl));
    const color = await process(buffer);
    const state = new Number(color[0] > controlPoint[0] && color[1] > controlPoint[1] && color[2] > controlPoint[2]);

    return JSON.stringify({ state });
}

module.exports.checkImage = checkImage;