/*
  The core functionality of the autocomplete is work done by Stanislav Sysoev (@d4rkr00t)
  in his stylus extension and been adjusted to account for the slight differences between
  the languages.

  Original stylus version: https://github.com/d4rkr00t/language-stylus
*/
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  Range,
  TextDocument,
  workspace,
  SnippetString
} from 'vscode';

import * as cssSchema from './schemas/cssSchema';
import sassSchema from './schemas/sassSchema';
import sassSchemaUnits from './schemas/sassSchemaUnits';

/**
 * Naive check whether currentWord is class, id or placeholder
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isClassOrId(currentWord: string): boolean {
  return currentWord.startsWith('.') || currentWord.startsWith('#') || currentWord.startsWith('%');
}

export function isSelector(currentWord: string): boolean {
  return currentWord === 'section' || currentWord === 'div';
}

/**
 * Naive check whether currentWord is at rule
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isAtRule(currentWord: string): boolean {
  return currentWord.startsWith('@');
}

/**
 * Naive check whether currentWord is value for given property
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {Boolean}
 */
export function isValue(cssSchema, currentWord: string): boolean {
  const property = getPropertyName(currentWord);

  return property && Boolean(findPropertySchema(cssSchema, property));
}

/**
 * Formats property name
 * @param {String} currentWord
 * @return {String}
 */
export function getPropertyName(currentWord: string): string {
  return currentWord
    .trim()
    .replace(':', ' ')
    .split(' ')[0];
}

/**
 * Search for property in cssSchema
 * @param {Object} cssSchema
 * @param {String} property
 * @return {Object}
 */
export function findPropertySchema(cssSchema, property: string) {
  return cssSchema.data.css.properties.find(item => item.name === property);
}

/**
 * Returns at rules list for completion
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getAtRules(cssSchema, currentWord: string): CompletionItem[] {
  if (!isAtRule(currentWord)) {
    return [];
  }

  return cssSchema.data.css.atdirectives.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Keyword;

    return completionItem;
  });
}

/**
 * Returns property list for completion
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getProperties(cssSchema, currentWord: string, useSeparator: boolean): CompletionItem[] {
  if (isClassOrId(currentWord) || isAtRule(currentWord) || isSelector(currentWord)) {
    return [];
  }

  return cssSchema.data.css.properties.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.insertText = property.name + (useSeparator ? ': ' : ' ');
    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Property;

    return completionItem;
  });
}

/**
 * Returns values for current property for completion list
 * @param {Object} cssSchema
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function getValues(cssSchema, currentWord: string): CompletionItem[] {
  const property = getPropertyName(currentWord);
  const values = findPropertySchema(cssSchema, property).values;

  if (!values) {
    return [];
  }

  return values.map(property => {
    const completionItem = new CompletionItem(property.name);

    completionItem.detail = property.desc;
    completionItem.kind = CompletionItemKind.Value;

    return completionItem;
  });
}
/**
 * checks if currentWord last char is a number?
 * @param {String} currentWord
 * @return {CompletionItem}
 */
export function isNumber(currentWord: string): boolean {
  const reg = /[0-9]$/;
  return reg.test(currentWord);
}
/**
 * gets variable completions.
 * @param text
 */
export function getVariables(text: string) {
  const regex = /\${1}\S*:/g;
  let m;
  const variables = [];

  while ((m = regex.exec(text)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match: string) => {
      const rep = match.replace(':', '');
      const completionItem = new CompletionItem(rep.replace('$', ''));
      completionItem.insertText = rep;
      completionItem.detail = 'Sass Variable.';

      completionItem.kind = CompletionItemKind.Variable;
      variables.push(completionItem);
    });
  }
  return variables;
}
/**
 * gets unit completions.
 * @param currentword
 */
export function getUnits(currentword: string) {
  const units = [];

  sassSchemaUnits.forEach(item => {
    const lastWord = currentword.split(' ');
    const rep = lastWord[lastWord.length - 1];
    const completionItem = new CompletionItem(rep + item.name);
    completionItem.insertText = new SnippetString(rep + item.body);
    completionItem.detail = item.description;
    completionItem.kind = CompletionItemKind.Unit;
    units.push(completionItem);
  });
  return units;
}

class SassCompletion implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
    const start = new Position(position.line, 0);
    const range = new Range(start, position);
    const currentWord = document.getText(range).trim();
    const currentWordUT = document.getText(range);
    const text = document.getText();
    const value = isValue(cssSchema, currentWord);
    const config = workspace.getConfiguration('sass-indented');

    let atRules = [],
      Units = [],
      properties = [],
      values = [],
      variables = [];

    if (isNumber(currentWordUT)) {
      Units = getUnits(currentWord);
    }
    if (value) {
      values = getValues(cssSchema, currentWord);
      variables = getVariables(text);
    } else {
      atRules = getAtRules(cssSchema, currentWord);
      properties = getProperties(cssSchema, currentWord, config.get('useSeparator', true));
    }
    const completions = [].concat(atRules, properties, values, sassSchema, Units, variables);
    return completions;
  }
}

export default SassCompletion;
