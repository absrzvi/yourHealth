// Add essential polyfills required for web APIs in Node.js environment
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Add URL and URLSearchParams if they're not available (might be needed by undici)
if (!global.URL) {
  const { URL } = require('url');
  global.URL = URL;
}

if (!global.URLSearchParams) {
  const { URLSearchParams } = require('url');
  global.URLSearchParams = URLSearchParams;
}

// Add ReadableStream, WritableStream, and TransformStream polyfills
const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Add MessagePort, MessageChannel, and BroadcastChannel polyfills
class MessagePort {
  constructor() {
    this.onmessage = null;
  }
  postMessage() {}
  start() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

class MessageChannel {
  constructor() {
    this.port1 = new MessagePort();
    this.port2 = new MessagePort();
  }
}

class BroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

global.MessagePort = MessagePort;
global.MessageChannel = MessageChannel;
global.BroadcastChannel = BroadcastChannel;

// Add Request and Response polyfills
const { Request, Response, Headers, FormData, File, Blob } = require('undici');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.FormData = FormData;
global.File = File;
global.Blob = Blob;
