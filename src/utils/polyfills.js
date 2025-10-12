
import 'react-native-get-random-values';


if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = require('process/browser.js');
}

global.process.version = '';
global.process.browser = true;
global.process.env = global.process.env || {};
global.process.nextTick = setImmediate;

// Mock WebSocket implementation for React Native
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('react-native/Libraries/WebSocket/WebSocket');
}