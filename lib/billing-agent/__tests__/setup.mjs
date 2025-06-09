// Add TextEncoder and TextDecoder polyfills
import util from 'util';
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Add ReadableStream polyfill if needed
if (!global.ReadableStream) {
  import('web-streams-polyfill').then(({ ReadableStream }) => {
    global.ReadableStream = ReadableStream;
  });
}

// Add Request and Response polyfills if needed
if (!global.Request || !global.Response) {
  import('undici').then(({ Request, Response }) => {
    global.Request = Request;
    global.Response = Response;
  });
}
