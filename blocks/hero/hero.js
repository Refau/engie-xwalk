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


    // Sélectionne tous les h4 dans la section héro
    const headings = document.querySelectorAll('.hero-wrapper .hero.block > div:nth-child(2) h4');

    // SVG à ajouter après chaque h4
    const svgIcon = `
    <svg class="c-header3Cta__linkIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13.9,12,6.6,4.7,8,3.3,16.7,12,8,20.7,6.6,19.3Z" fill-rule="evenodd"></path>
    </svg>
  `;

    // Parcours chaque h4 et ajoute l'élément SVG
    headings.forEach(function(heading) {
      heading.insertAdjacentHTML('afterend', svgIcon);
    });
}
