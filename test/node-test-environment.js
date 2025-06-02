// A custom environment to set the TextEncoder that is required by uuid
const NodeEnvironment = require('jest-environment-node');
const { TextEncoder, TextDecoder } = require('util');

module.exports = class CustomTestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    
    if (typeof this.global.TextEncoder === 'undefined') {
      this.global.TextEncoder = TextEncoder;
    }
    
    if (typeof this.global.TextDecoder === 'undefined') {
      this.global.TextDecoder = TextDecoder;
    }
    
    // Add any other Node.js globals your tests might need
    this.global.URL.createObjectURL = jest.fn();
    this.global.URL.revokeObjectURL = jest.fn();
  }
};
