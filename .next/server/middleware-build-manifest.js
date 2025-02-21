self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [
    "static/chunks/webpack.js",
    "static/chunks/main-app.js"
  ],
  "pages": {
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/quick-property-submission": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/quick-property-submission.js"
    ],
    "/sell-your-office": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/sell-your-office.js"
    ],
    "/success": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/success.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];