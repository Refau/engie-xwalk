/**
 * loads and decorates the hero
 * @param {Element} block The hero block element
 */
import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Target the third child div to add button-primary class
  document.addEventListener('DOMContentLoaded', function() {

    // Select the hero section where the h1 and content divs are located
    var heroSection = document.querySelector('.hero');

    // Select the <h1> element and the div containing the text and the button
    var heading = heroSection.querySelector('h1');
    var textContent = heroSection.querySelectorAll('div')[2]; // The div containing the text and button

    // Create a wrapper div for the two elements
    var flexWrapper = document.createElement('div');
    flexWrapper.style.display = 'flex';
    flexWrapper.style.justifyContent = 'space-between';
    flexWrapper.style.alignItems = 'center';
    flexWrapper.style.gap = '20px';

    // Append the heading and textContent div into the wrapper
    flexWrapper.appendChild(heading);
    flexWrapper.appendChild(textContent);

    // Add the new wrapper back into the hero section
    heroSection.appendChild(flexWrapper);

    // Remove the original div elements (since they are now inside the wrapper)
    heroSection.querySelectorAll('div').forEach(function(div) {
      if (div !== flexWrapper) {
        div.remove();
      }
    });

  });
}
