const fs = require('fs-extra-promise');
const request = require('request-promise');
const IMAGE_SAVE_BASE_PATH = './images/';
var Scraper = require('images-scraper'),
  bing = new Scraper.Bing();

function downloadImage(url, filePath) {
  let urlCopy = url;
  let saveFilePath = `${IMAGE_SAVE_BASE_PATH}${filePath}`;
  filePath = `${IMAGE_SAVE_BASE_PATH}${filePath.includes('/') ? filePath.split('/')[0] : ''}`;
  return ensureDir(filePath)
    .then(() => request.head(url))
    .then(() => {
      return new Promise((resolve) => {
        request(url).pipe(fs.createWriteStream(saveFilePath)).on('close', () => resolve());
      });
    });
}

function ensureDir(dir) {
  return new Promise((resolve, reject) => {
    fs.ensureDir(dir, error => error ? reject(error) : resolve());
  });
}

function searchGoogle(search) {
  return bing.list({
      keyword: search.keyword,
      num: search.number,
      detail: true,
      nightmare: { show: false }
    })
    .then(function(res) {
      search.images = res;
      return search;
    }).catch(function(err) {
      console.log('err', err);
    });
}

let searches = [
  {
    keyword: 'american currency',
    name: 'american',
    number: 500,
    saveAs: (name, index) => `${name}/${name}.${index}.jpg`,
    images: []
  },
  {
    keyword: 'canadian currency',
    name: 'canadian',
    number: 500,
    saveAs: (name, index) => `${name}/${name}.${index}.jpg`,
    images: []
  }
];

Promise.all(searches.map(search => searchGoogle(search)))
  .then(res => {
    console.log(res);
    return Promise.all(res.map(search => Promise.all(search.images.map((image, index) => downloadImage(image, search.saveAs(search.name, index))))));
  })
  .then(res => {
    console.log(res);
  })
  .catch(error => console.error(error));
