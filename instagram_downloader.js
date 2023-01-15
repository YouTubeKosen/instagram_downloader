
function downloadImage(src, filename) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', src, true);
  xhr.responseType = "blob";
  xhr.filename = filename;
  xhr.onload = saveImage;
  xhr.send();
}

function saveImage() {
  const atag = document.createElement("a");
  const src = URL.createObjectURL(this.response);
  atag.href = src;
  atag.download = this.filename + `.${this.response.type.replace("image/", "")}`;
  document.body.insertAdjacentElement("beforeEnd", atag);
  atag.click();
  atag.remove();
  setTimeout(function () {
    window.URL.revokeObjectURL(src);
  }, 1000);
}

async function waitForElement(selector, timeout = 15000) {
  let cnt = 0;
  return new Promise((resolve, reject) => {
    interval = setInterval(() => {
      const el = w.document.querySelector(selector);
      cnt += 1000;
      if (el) {
        clearInterval(interval);
        resolve(true);
      } else if (cnt > timeout) {
        clearInterval(interval);
        reject(false);
      }
    }, 1000);
  })
}

async function scanThumbnails() {
  const links = new Set();
  await waitForElement("article");
  return new Promise(resolve => {
    interval = setInterval(() => {
      let thumnails = w.document.querySelector("article").querySelectorAll("a");
      for (let thumbnail of thumnails) {
        links.add(thumbnail.href);
      }
      w.window.scrollBy(0, w.document.documentElement.clientHeight);
      if (w.document.querySelector("svg[aria-label='読み込み中']") == null) {
        clearInterval(interval);
        resolve(links);
      }
    }, 1000);
  })
}

function getImageUrl() {
  console.log(w.document.querySelector("img[alt*='Photo by']").alt);
  let url;
  if (w.document.querySelector("img[alt*='Photo by']").srcset) {
    const srcset = w.document.querySelector("img[alt*='Photo by']").srcset.split(",");
    let width_max = 0;
    let url_temp, width_temp;
    for (let src of srcset) {
      url_temp = src.split(" ")[0];
      width_temp = src.split(" ")[1];
      width_temp = Number(width_temp.replace(/[^0-9]/g, ''));
      if (width_temp > width_max) {
        width_max = width_temp;
        url = url_temp;
      }
    }
  }
  else {
    url = w.document.querySelector("img[alt*='Photo by']").src
  }
  console.log(url);
  return url;
}
async function main() {
  w = window.open(location.href, null, "width=1200");
  w.resizeTo(1200, 1000);
  const links = await scanThumbnails();
  console.log(`${links.size} images will be downloaded.`);

  for (let link of links.values()) {
    w.location = link;
    await new Promise(resolve => { setTimeout(resolve, 1000) }); /* sleep for HTTP ERROR 429 */
    const imgExist = await waitForElement("img[alt*='Photo by']");
    const dateExist = await waitForElement("[datetime]");
    if (imgExist == true && dateExist == true) {
      downloadImage(getImageUrl(), `${w.document.querySelector("[datetime]").dateTime.replace(".", "_")}`);
    }
  }

}

main();