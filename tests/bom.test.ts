import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitMarkdownIntoSlides} from '../src/markdownToSlides.js';
test('a UTF-8 BOM does not hide the opening code fence',()=>{
 const source='```markdown\n---\n```\n---\n# Next';
 assert.deepEqual(splitMarkdownIntoSlides('\ufeff'+source),splitMarkdownIntoSlides(source));
 assert.deepEqual(splitMarkdownIntoSlides('\ufeff'+source),['```markdown\n---\n```','# Next']);
});
