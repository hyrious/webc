/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="dom" />

const $log = document.querySelector("#log");
function log(str) {
  $log.textContent += str + "\n";
}

const $iframe = document.querySelector("#target");
/** @type {HTMLTextAreaElement} */
const $html = document.querySelector("#html");
/** @type {HTMLTextAreaElement} */
const $js = document.querySelector("#js");

let timer = 0;
$html.oninput = $js.oninput = () => {
  clearTimeout(timer);
  timer = setTimeout(refresh, 400);
};

let doc = { html: "", js: "" };
function refresh() {
  [doc.html, doc.js] = [$html.value, $js.value];
  $iframe.src = "./~/index.html?t=" + Date.now();
}

navigator.serviceWorker.addEventListener("message", ev => {
  const { path } = ev.data;
  if (path === "/index.html") {
    ev.ports[0].postMessage({ contents: doc.html, loader: "html" });
  }
  if (path === "/main.js") {
    ev.ports[0].postMessage({ contents: doc.js, loader: "js" });
  }
});

async function main() {
  log("sw: before installing");
  let reg = await navigator.serviceWorker.register("./sw.js");
  /** @type ServiceWorker | undefined */
  let sw;
  if (reg.installing) {
    sw = reg.installing;
    log("sw: installing");
  } else if (reg.waiting) {
    sw = reg.waiting;
    log("sw: waiting");
  } else if (reg.active) {
    sw = reg.active;
    log("sw: active");
    setTimeout(refresh, 1000);
  }
  if (sw) {
    sw.addEventListener("statechange", e => {
      log("sw: " + e.target.state);
      if (e.target.state === "redundant") {
        location.reload();
      }
      if (e.target.state === "activated") {
        setTimeout(refresh, 1000);
      }
    });
  } else {
    $iframe.srcdoc = "<p>Not found service worker.</p>";
  }
}

main().catch(console.error);
