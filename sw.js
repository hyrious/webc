/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * @type {ServiceWorkerGlobalScope}
 */
const sw = self;

let scope = "";
{
  const paths = sw.location.pathname.split("/");
  paths.pop();
  scope = [...paths, "~"].join("/");
  console.log({ scope });
}

sw.addEventListener("install", () => {
  console.log("sw: installing");
  sw.skipWaiting(); // triggers "redundant" -> "activate"
});

sw.addEventListener("activate", () => {
  console.log("sw: activating");
});

sw.addEventListener("fetch", ev => {
  const { pathname } = new URL(ev.request.url);
  if (pathname.startsWith(scope)) {
    const path = pathname.slice(scope.length);
    console.log("->", path, ev.clientId);
    // sw.clients.get(ev.clientId) is the iframe.
    // not what we want to talk to.
    return ev.respondWith(
      (async () => {
        const clients = await sw.clients.matchAll({ type: "window" });
        if (!clients.length) {
          return new Response("not found client", { status: 404 });
        }
        const { contents, loader } = await new Promise(resolve => {
          const channel = new MessageChannel();
          channel.port1.onmessage = ev => {
            resolve(ev.data);
          };
          clients[0].postMessage({ path }, [channel.port2]);
        });
        return new Response(contents, {
          headers: {
            "Content-Type": loader === "js" ? "text/javascript" : "text/html",
          },
        });
      })()
    );
  }
  // ev.respondWith(fetch(ev.request));
});
