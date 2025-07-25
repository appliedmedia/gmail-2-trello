/**
 * Comprehensive Jest test suite for markdownify functionality
 * Tests the Utils class markdownify and related methods
 */

// Mock jQuery for testing
global.$ = jest.fn();

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Import the Utils class
const Utils = require('../chrome_manifest_v3/class_utils.js');

describe('Utils.markdownify', () => {
  let utils;

  beforeEach(() => {
    // Create a fresh Utils instance for each test
    utils = new Utils({ debug: false });
    
    // Reset jQuery mock
    $.mockClear();
  });

  describe('anchorMarkdownify', () => {
    test('should handle empty input', () => {
      expect(utils.anchorMarkdownify('', '')).toBe('');
      expect(utils.anchorMarkdownify(null, null)).toBe('');
      expect(utils.anchorMarkdownify(undefined, undefined)).toBe('');
    });

    test('should handle same text and href', () => {
      const result = utils.anchorMarkdownify('https://example.com', 'https://example.com');
      expect(result).toBe(' <https://example.com> ');
    });

    test('should handle mailto links', () => {
      const result = utils.anchorMarkdownify('test@example.com', 'mailto:test@example.com');
      expect(result).toBe(' <test@example.com> ');
    });

    test('should handle different text and href', () => {
      const result = utils.anchorMarkdownify('Click here', 'https://example.com');
      expect(result).toBe(' [Click here](<https://example.com>) ');
    });

    test('should handle different text and href with comment', () => {
      const result = utils.anchorMarkdownify('Click here', 'https://example.com', 'External link');
      expect(result).toBe(' [Click here](<https://example.com> "External link") ');
    });

    test('should trim whitespace', () => {
      const result = utils.anchorMarkdownify('  text  ', '  href  ', '  comment  ');
      expect(result).toBe(' [text](<href> "comment") ');
    });
  });

  describe('markdownify basic functionality', () => {
    test('should return empty string for null/undefined input', () => {
      expect(utils.markdownify(null)).toBe('');
      expect(utils.markdownify(undefined)).toBe('');
    });

    test('should return empty string for empty jQuery object', () => {
      const $empty = { html: () => '', length: 0 };
      expect(utils.markdownify($empty)).toBe('');
    });

    test('should handle simple text without HTML', () => {
      const $simple = { html: () => 'Simple text content' };
      const result = utils.markdownify($simple);
      expect(result).toBe('Simple text content');
    });

    test('should normalize line endings', () => {
      const $withLineEndings = { html: () => 'Line 1\r\nLine 2\rLine 3\nLine 4' };
      const result = utils.markdownify($withLineEndings);
      expect(result).toBe('Line 1\nLine 2\nLine 3\nLine 4');
    });
  });

  describe('markdownify HTML tag conversion', () => {
    test('should convert paragraph tags to double line breaks', () => {
      const $withParagraphs = { html: () => '<p>First paragraph</p><p>Second paragraph</p>' };
      const result = utils.markdownify($withParagraphs);
      expect(result).toBe('First paragraph\n\nSecond paragraph');
    });

    test('should convert div tags to double line breaks', () => {
      const $withDivs = { html: () => '<div>First div</div><div>Second div</div>' };
      const result = utils.markdownify($withDivs);
      expect(result).toBe('First div\n\nSecond div');
    });

    test('should convert break tags to single line breaks', () => {
      const $withBreaks = { html: () => 'Line 1<br>Line 2<br/>Line 3' };
      const result = utils.markdownify($withBreaks);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should convert horizontal rules', () => {
      const $withHR = { html: () => '<hr>Content<hr/>' };
      const result = utils.markdownify($withHR);
      expect(result).toBe('\n\n---\n\nContent\n\n---\n\n');
    });

    test('should convert text formatting tags', () => {
      const $withFormatting = { 
        html: () => '<strong>bold</strong><em>italic</em><u>underline</u><strike>strikethrough</strike>' 
      };
      const result = utils.markdownify($withFormatting);
      expect(result).toBe('**bold***italic*__underline__~~strikethrough~~');
    });

    test('should convert header tags', () => {
      const $withHeaders = { 
        html: () => '<h1>Header 1</h1><h2>Header 2</h2><h3>Header 3</h3>' 
      };
      const result = utils.markdownify($withHeaders);
      expect(result).toBe('# Header 1\n\n## Header 2\n\n### Header 3');
    });
  });

  describe('markdownify link handling', () => {
    test('should convert anchor tags to markdown links', () => {
      const $withLinks = { 
        html: () => '<a href="https://example.com">Example Link</a>' 
      };
      const result = utils.markdownify($withLinks);
      expect(result).toBe('[Example Link](<https://example.com>)');
    });

    test('should handle links with same text and href', () => {
      const $withSameText = { 
        html: () => '<a href="https://example.com">https://example.com</a>' 
      };
      const result = utils.markdownify($withSameText);
      expect(result).toBe(' <https://example.com> ');
    });

    test('should handle mailto links', () => {
      const $withMailto = { 
        html: () => '<a href="mailto:test@example.com">test@example.com</a>' 
      };
      const result = utils.markdownify($withMailto);
      expect(result).toBe(' <test@example.com> ');
    });
  });

  describe('markdownify cleanup and formatting', () => {
    test('should normalize multiple line breaks', () => {
      const $withMultipleBreaks = { html: () => 'Text\n\n\n\nMore text' };
      const result = utils.markdownify($withMultipleBreaks);
      expect(result).toBe('Text\n\nMore text');
    });

    test('should normalize multiple spaces', () => {
      const $withMultipleSpaces = { html: () => 'Text    with    multiple    spaces' };
      const result = utils.markdownify($withMultipleSpaces);
      expect(result).toBe('Text with multiple spaces');
    });

    test('should convert bullet points', () => {
      const $withBullets = { html: () => '• Item 1\n• Item 2' };
      const result = utils.markdownify($withBullets);
      expect(result).toBe('* Item 1\n* Item 2');
    });

    test('should trim whitespace from result', () => {
      const $withWhitespace = { html: () => '  \n  Content  \n  ' };
      const result = utils.markdownify($withWhitespace);
      expect(result).toBe('Content');
    });
  });

  describe('markdownify with features parameter', () => {
    test('should respect features configuration', () => {
      const $content = { html: () => '<strong>bold</strong><em>italic</em>' };
      const features = { bold: true, italic: false };
      const result = utils.markdownify($content, features);
      // Should only convert bold, not italic
      expect(result).toBe('**bold**<em>italic</em>');
    });

    test('should handle empty features object', () => {
      const $content = { html: () => '<strong>bold</strong>' };
      const result = utils.markdownify($content, {});
      expect(result).toBe('**bold**');
    });
  });

  describe('markdownify edge cases', () => {
    test('should handle nested HTML tags', () => {
      const $nested = { 
        html: () => '<div><p><strong>Bold text</strong> in paragraph</p></div>' 
      };
      const result = utils.markdownify($nested);
      expect(result).toBe('**Bold text** in paragraph');
    });

    test('should handle HTML entities', () => {
      const $withEntities = { html: () => 'Text &amp; more &lt;content&gt;' };
      const result = utils.markdownify($withEntities);
      expect(result).toBe('Text & more <content>');
    });

    test('should handle mixed content', () => {
      const $mixed = { 
        html: () => '<p>Paragraph with <strong>bold</strong> and <a href="https://example.com">link</a>.</p>' 
      };
      const result = utils.markdownify($mixed);
      expect(result).toBe('Paragraph with **bold** and [link](<https://example.com>).');
    });

    test('should handle very long content', () => {
      const longText = 'A'.repeat(10000);
      const $long = { html: () => longText };
      const result = utils.markdownify($long);
      expect(result).toBe(longText);
      expect(result.length).toBe(10000);
    });
  });

  describe('markdownify helper methods', () => {
    test('markdownify_sortByLength should sort by length descending', () => {
      const a = 'short';
      const b = 'very long text';
      const result = utils.markdownify_sortByLength(a, b);
      expect(result).toBeGreaterThan(0); // b should come before a
    });

    test('markdownify_featureEnabled should check feature flags', () => {
      const features = { bold: true, italic: false };
      expect(utils.markdownify_featureEnabled(features, 'bold')).toBe(true);
      expect(utils.markdownify_featureEnabled(features, 'italic')).toBe(false);
      expect(utils.markdownify_featureEnabled(features, 'unknown')).toBe(true); // default
    });

    test('escapeRegExp should escape special regex characters', () => {
      expect(utils.escapeRegExp('test')).toBe('test');
      expect(utils.escapeRegExp('test*test')).toBe('test\\*test');
      expect(utils.escapeRegExp('test.test')).toBe('test\\.test');
      expect(utils.escapeRegExp('test+test')).toBe('test\\+test');
    });
  });

  describe('markdownify performance', () => {
    test('should handle large HTML content efficiently', () => {
      const largeHTML = '<p>' + 'Content '.repeat(1000) + '</p>';
      const $large = { html: () => largeHTML };
      
      const startTime = Date.now();
      const result = utils.markdownify($large);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle many HTML tags efficiently', () => {
      const manyTags = '<strong>bold</strong>'.repeat(100);
      const $manyTags = { html: () => manyTags };
      
      const startTime = Date.now();
      const result = utils.markdownify($manyTags);
      const endTime = Date.now();
      
      expect(result).toBe('**bold**'.repeat(100));
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});