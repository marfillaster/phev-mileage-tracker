/// <reference lib="webworker" />

const SW_VERSION = "1.0.1"
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
  const { request } = event
  const url = new URL(request.url)

  // For HTML documents, use network-first strategy
  if (request.headers.get("accept")?.includes("text/html") || url.pathname === "/") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cached) => cached || caches.match("/"))
        }),
    )
    return
  }

  // For other assets, use cache-first strategy
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              if (request.method === "GET") {
                cache.put(request, fetchResponse.clone())
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
