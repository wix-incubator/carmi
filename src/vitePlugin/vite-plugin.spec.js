const vitePlugin = require('./index');

describe('Carmi Vite Plugin', () => {
  let mockPluginContext;

  beforeEach(() => {
    mockPluginContext = {
      addWatchFile: jest.fn(),
      emitFile: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('transforms .carmi.js files', async () => {
    const plugin = vitePlugin();
    const mockCode = `
      const { root } = require('carmi');
      module.exports = { first: root.get(0) };
    `;

    const result = await plugin.transform.call(mockPluginContext, mockCode, 'test.carmi.js');

    expect(result).toBeDefined();
    expect(typeof result.code).toBe('string');
    expect(result.code).toContain('function model');
  });

  it('does not transform regular .js files', async () => {
    const plugin = vitePlugin();
    const mockCode = `
      const regularJsCode = 'Hello, World!';
    `;

    const result = await plugin.transform.call(mockPluginContext, mockCode, 'regular.js');

    expect(result).toBeNull();
  });

  it('transforms files with @carmi comment', async () => {
    const plugin = vitePlugin();
    const mockCode = `
      // @carmi
      const { root } = require('carmi');
      module.exports = { first: root.get(0) };
    `;

    const result = await plugin.transform.call(mockPluginContext, mockCode, 'test.carmi.js');

    expect(result).toBeDefined();
    expect(result.code).toContain('function model');
  });

  it('does not transform files without .carmi.js extension or @carmi comment', async () => {
    const plugin = vitePlugin();
    const mockCode = `
      const { root } = require('carmi');
      module.exports = { first: root.get(0) };
    `;

    const result = await plugin.transform.call(mockPluginContext, mockCode, 'test.js');

    expect(result).toBeNull();
  });

  it('handles carmi compiler options', async () => {
    const customOptions = {optimize: true};
    const plugin = vitePlugin(customOptions);
    const mockCode = `
      // @carmi
      const { root } = require('carmi');
      module.exports = { first: root.get(0) };
    `;

    const result = await plugin.transform.call(mockPluginContext, mockCode, 'test.carmi.js');

    expect(result).toBeDefined();
    expect(typeof result.code).toBe('string');
  });

  it('handles syntax errors gracefully', async () => {
    const plugin = vitePlugin();
    const mockCode = `
      // @carmi
      const { root } = require('carmi');
      module.exports = { first: root.get(0 };  // Missing closing parenthesis
    `;

    await expect(plugin.transform.call(mockPluginContext, mockCode, 'test.carmi.js'))
      .rejects.toThrow();
  });
});
