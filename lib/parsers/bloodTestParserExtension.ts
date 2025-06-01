// lib/parsers/bloodTestParserExtension.ts

import { BloodTestParser } from './bloodTestParser';
import { Parser } from './utils/parserFactory';

/**
 * Extend the BloodTestParser class with dispose and isDisposed methods
 * to make it compatible with the Parser interface
 */

// Add type declaration to extend BloodTestParser
declare module './bloodTestParser' {
  interface BloodTestParser extends Parser {
    dispose(): void;
    isDisposed(): boolean;
  }
}

// Extend the prototype to add the required methods
BloodTestParser.prototype.dispose = function(this: BloodTestParser): void {
  // Implementation for legacy parser
  // Mark as disposed and clean up any resources
  (this as any).isDisposedFlag = true;
  
  // Free any resources
  if ((this as any).content) {
    (this as any).content = null;
  }
  
  // Clear any cached results
  if ((this as any).result) {
    (this as any).result = null;
  }
  
  console.log('[BloodTestParser] Disposed');
};

BloodTestParser.prototype.isDisposed = function(this: BloodTestParser): boolean {
  return !!(this as any).isDisposedFlag;
};

// Ensure BloodTestParser implements Parser interface
(BloodTestParser as any).implementsParser = true;
