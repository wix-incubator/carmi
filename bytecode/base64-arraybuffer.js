/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function () {
    'use strict';
  
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
    // Use a lookup table to find the index.
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
  
    exports.encode = function (arraybuffer) {
      const bytes = new Uint8Array(arraybuffer);
      let i; 
      const len = bytes.length; 
      let base64 = '';
  
      for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
        base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
        base64 += chars[bytes[i + 2] & 63];
      }
  
      if (len % 3 === 2) {
        base64 = `${base64.substring(0, base64.length - 1)}=`;
      } else if (len % 3 === 1) {
        base64 = `${base64.substring(0, base64.length - 2)}==`;
      }
  
      return base64;
    };
  
    exports.decode = function (base64) {
      let bufferLength = base64.length * 0.75;
      const len = base64.length; let i; let p = 0;
      let encoded1; let encoded2; let encoded3; let encoded4;
  
      if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
          bufferLength--;
        }
      }
  
      const arraybuffer = new ArrayBuffer(bufferLength);
      const bytes = new Uint8Array(arraybuffer);
  
      for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];
  
        bytes[p++] = encoded1 << 2 | encoded2 >> 4;
        bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
        bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
      }
  
      return arraybuffer;
    };
  }());
  