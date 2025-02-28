/**
 * loads and decorates the hero
 * @param {Element} block The hero block element
 */
import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Target the third child div to add button-primary class
  const blockConfig = readBlockConfig(block);
  console.log(blockConfig);
  console.log(blockConfig.heading);
  console.log(blockConfig['heading']);
  const div = block.children[2];

  if (div) {
    const btnContainer = div.querySelector('.button-container');
    btnContainer.querySelector('a').classList.add('button-primary');
  }
}
