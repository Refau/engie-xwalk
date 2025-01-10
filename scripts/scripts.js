/* eslint-disable import/no-cycle */
import {
  sampleRUM,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  loadScript,
  toCamelCase,
  toClassName
} from './aem.js';



const AUDIENCES = {
  mobile: () => window.innerWidth < 600,
  desktop: () => window.innerWidth >= 600,
  // define your custom audiences here as needed
};

/**
 * Gets all the metadata elements that are in the given scope.
 * @param {String} scope The scope/prefix for the metadata
 * @returns an array of HTMLElement nodes that match the given scope
 */
export function getAllMetadata(scope) {
  return [
    ...document.head.querySelectorAll(`meta[property^="${scope}:"],meta[name^="${scope}-"]`),
  ].reduce((res, meta) => {
    const id = toClassName(
      meta.name
        ? meta.name.substring(scope.length + 1)
        : meta.getAttribute('property').split(':')[1],
    );
    res[id] = meta.getAttribute('content');
    return res;
  }, {});
}

/**
 * Returns the current timestamp used for scheduling content.
 */
export function getTimestamp() {
  if (
    (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.hlx.page')) &&
    window.sessionStorage.getItem('preview-date')
  ) {
    return Date.parse(window.sessionStorage.getItem('preview-date'));
  }
  return Date.now();
}

/**
 * Determines whether scheduled content with a given date string should be displayed.
 */
export function shouldBeDisplayed(date) {
  const now = getTimestamp();

  const split = date.split('-');
  if (split.length === 2) {
    const from = Date.parse(split[0].trim());
    const to = Date.parse(split[1].trim());
    return now >= from && now <= to;
  }
  if (date !== '') {
    const from = Date.parse(date.trim());
    return now >= from;
  }
  return false;
}

/**
 * Remove scheduled blocks that should not be displayed.
 */
function scheduleBlocks(main) {
  const blocks = main.querySelectorAll('div.section > div > div');
  blocks.forEach((block) => {
    let date;
    const rows = block.querySelectorAll(':scope > div');
    rows.forEach((row) => {
      const cols = [...row.children];
      if (cols.length > 1) {
        if (cols[0].textContent.toLowerCase() === 'date') {
          date = cols[1].textContent;
          row.remove();
        }
      }
    });
    if (date && !shouldBeDisplayed(date)) {
      block.remove();
    }
  });
}

/**
 * Remove scheduled sections that should not be displayed.
 */
function scheduleSections(main) {
  const sections = main.querySelectorAll('div.section');
  sections.forEach((section) => {
    const { date } = section.dataset;
    if (date && !shouldBeDisplayed(date)) {
      section.remove();
    }
  });
}

// Define an execution context
const pluginContext = {
  getAllMetadata,
  getMetadata,
  loadCSS,
  loadScript,
  sampleRUM,
  toCamelCase,
  toClassName,
};

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from?.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost'))
      sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(element) {
  element.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');

    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

function preloadFile(href, as) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';

  decorateTemplateAndTheme();

  // Instrument experimentation plugin
  if (
    getMetadata('experiment') ||
    Object.keys(getAllMetadata('campaign')).length ||
    Object.keys(getAllMetadata('audience')).length
  ) {
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager: runEager } = await import('../plugins/experimentation/src/index.js');
    await runEager(document, { audiences: AUDIENCES }, pluginContext);

    sampleRUM.enhance();
  }

  window.adobeDataLayer = window.adobeDataLayer || [];

  let pageType = 'CMS';

  window.adobeDataLayer.push({
    pageContext: {
      pageType,
      pageName: document.title,
      eventType: 'visibilityHidden',
      maxXOffset: 0,
      maxYOffset: 0,
      minXOffset: 0,
      minYOffset: 0,
    },
  });
  if (pageType !== 'Product') {
    window.adobeDataLayer.push((dl) => {
      dl.push({ event: 'page-view', eventInfo: { ...dl.getState() } });
    });
  }

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await Promise.all([
    loadHeader(doc.querySelector('header')),
    loadFooter(doc.querySelector('footer')),
    loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`),
    loadFonts()
  ]);


  // Implement experimentation preview pill
  if (
    getMetadata('experiment') ||
    Object.keys(getAllMetadata('campaign')).length ||
    Object.keys(getAllMetadata('audience')).length
  ) {
    // eslint-disable-next-line import/no-relative-packages
    const { loadLazy: runLazy } = await import('../plugins/experimentation/src/index.js');
    await runLazy(document, { audiences: AUDIENCES }, pluginContext);
  }

  // Load scheduling sidekick extension
  import('./scheduling/scheduling.js');
}

export async function fetchIndex(indexFile, pageSize = 500) {
  const handleIndex = async (offset) => {
    const resp = await fetch(`/${indexFile}.json?limit=${pageSize}&offset=${offset}`);
    const json = await resp.json();

    const newIndex = {
      complete: json.limit + json.offset === json.total,
      offset: json.offset + pageSize,
      promise: null,
      data: [...window.index[indexFile].data, ...json.data],
    };

    return newIndex;
  };

  window.index = window.index || {};
  window.index[indexFile] = window.index[indexFile] || {
    data: [],
    offset: 0,
    complete: false,
    promise: null,
  };

  // Return index if already loaded
  if (window.index[indexFile].complete) {
    return window.index[indexFile];
  }

  // Return promise if index is currently loading
  if (window.index[indexFile].promise) {
    return window.index[indexFile].promise;
  }

  window.index[indexFile].promise = handleIndex(window.index[indexFile].offset);
  const newIndex = await window.index[indexFile].promise;
  window.index[indexFile] = newIndex;

  return newIndex;
}

export function jsx(html, ...args) {
  return html.slice(1).reduce((str, elem, i) => str + args[i] + elem, html[0]);
}

export function createAccordion(header, content, expanded = false) {
  // Create a container for the accordion
  const container = document.createElement('div');
  container.classList.add('accordion');
  const accordionContainer = document.createElement('details');
  accordionContainer.classList.add('accordion-item');

  // Create the accordion header
  const accordionHeader = document.createElement('summary');
  accordionHeader.classList.add('accordion-item-label');
  accordionHeader.innerHTML = `<div>${header}</div>`;

  // Create the accordion content
  const accordionContent = document.createElement('div');
  accordionContent.classList.add('accordion-item-body');
  accordionContent.innerHTML = content;

  accordionContainer.append(accordionHeader, accordionContent);
  container.append(accordionContainer);

  if (expanded) {
    accordionContent.classList.toggle('active');
    accordionHeader.classList.add('open-default');
    accordionContainer.setAttribute('open', true);
  }

  function updateContent(newContent) {
    accordionContent.innerHTML = newContent;
    // accordionContent.innerHTML = '<p>Hello world</p>';
  }

  return [container, updateContent];
}

export function generateListHTML(data) {
  let html = '<ul>';
  data.forEach((item) => {
    html += `<li>${item.label}: <span>${item.value}</span></li>`;
  });
  html += '</ul>';
  return html;
}

export function isAuthorEnvironment() {
  return document.querySelector('*[data-aue-resource]') !== null;
}

/**
 * Check if consent was given for a specific topic.
 * @param {*} topic Topic identifier
 * @returns {boolean} True if consent was given
 */
// eslint-disable-next-line no-unused-vars
export function getConsent(topic) {
  console.warn('getConsent not implemented');
  return true;
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
}

loadPage();
