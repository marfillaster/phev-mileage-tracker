/// <reference lib="webworker" />

const SW_VERSION = "1.0.0"
const CACHE_NAME = `phev-tracker-${SW_VERSION}`

const STATIC_ASSETS = ["/", "/manifest.json"]

declare const self: ServiceWorkerGlobalScope

self.addEventListener("install", (event) => {
  console.log("[v0] Service Worker installing")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[v0] Service Worker activating")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[v0] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              if (event.request.method === "GET") {
                cache.put(event.request, fetchResponse.clone())
              }
              return fetchResponse
            })
          })
        )
      })
      .catch(() => {
        return caches.match("/")
      }),
  )
})
