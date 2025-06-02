/**
 * Smoke test to verify Jest is working
 */
describe('Smoke Test', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle simple math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async code', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });
});
