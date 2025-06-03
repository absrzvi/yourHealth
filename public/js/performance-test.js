/**
 * Homepage Performance Test Script
 * This script helps identify performance bottlenecks in the homepage animations
 */

// Function to measure layout thrashing and rendering performance
function measureLayoutPerformance() {
  console.group('Layout Performance Metrics');
  
  // Check for layout thrashing
  const start = performance.now();
  let layouts = 0;
  
  // Force layout recalculation multiple times to detect potential issues
  for (let i = 0; i < 10; i++) {
    // Force layout by reading offsetHeight
    document.body.offsetHeight;
    layouts++;
  }
  
  const end = performance.now();
  console.log(`Layout recalculations: ${layouts}`);
  console.log(`Average layout calculation time: ${((end - start) / layouts).toFixed(2)}ms`);
  
  // Check for heavy animation elements
  const animatedElements = document.querySelectorAll('.animate-float, .animate-float-subtle, .animate-badge-pulse, .animate-pulse-slow');
  console.log(`Number of animated elements: ${animatedElements.length}`);
  
  // Check for elements with will-change property
  const elementsWithWillChange = Array.from(document.querySelectorAll('*')).filter(elem => {
    const style = window.getComputedStyle(elem);
    return style.willChange !== 'auto';
  });
  console.log(`Elements with will-change: ${elementsWithWillChange.length}`);
  
  // Check for potential z-index stacking context issues
  const stackingContexts = Array.from(document.querySelectorAll('*')).filter(elem => {
    const style = window.getComputedStyle(elem);
    return style.zIndex !== 'auto' && style.position !== 'static';
  });
  console.log(`Potential stacking contexts: ${stackingContexts.length}`);
  
  console.groupEnd();
}

// Function to measure animation frame rate
function measureFrameRate() {
  console.group('Animation Frame Rate');
  
  let frames = 0;
  let lastTime = performance.now();
  let frameTimes = [];
  
  function countFrame() {
    const now = performance.now();
    const frameTime = now - lastTime;
    frameTimes.push(frameTime);
    lastTime = now;
    frames++;
    
    if (frames < 100) {
      requestAnimationFrame(countFrame);
    } else {
      // Calculate statistics
      const totalTime = frameTimes.reduce((a, b) => a + b, 0);
      const averageFrameTime = totalTime / frames;
      const fps = 1000 / averageFrameTime;
      
      console.log(`Average frame time: ${averageFrameTime.toFixed(2)}ms`);
      console.log(`Approximate FPS: ${fps.toFixed(2)}`);
      
      // Detect dropped frames (frame times > 33.33ms = less than 30fps)
      const droppedFrames = frameTimes.filter(time => time > 33.33).length;
      console.log(`Potential dropped frames: ${droppedFrames}`);
      console.log(`Percentage of dropped frames: ${((droppedFrames / frames) * 100).toFixed(2)}%`);
      
      console.groupEnd();
    }
  }
  
  requestAnimationFrame(countFrame);
}

// Function to test responsive layout issues
function testResponsiveLayout() {
  console.group('Responsive Layout Test');
  
  // Test for elements that might break layout at smaller widths
  const overflowingElements = [];
  const allElements = document.querySelectorAll('*');
  const viewportWidth = window.innerWidth;
  
  allElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth + 5) { // 5px tolerance
      overflowingElements.push({
        element: el,
        overflow: rect.right - viewportWidth
      });
    }
  });
  
  if (overflowingElements.length > 0) {
    console.warn(`Found ${overflowingElements.length} elements overflowing the viewport:`);
    overflowingElements.forEach(item => {
      console.log(`Element ${item.element.tagName}${item.element.className ? '.' + item.element.className.split(' ').join('.') : ''} overflows by ${item.overflow.toFixed(2)}px`);
    });
  } else {
    console.log('No horizontally overflowing elements detected.');
  }
  
  console.groupEnd();
}

// Run all tests
function runPerformanceTests() {
  console.group('Homepage Performance Tests');
  console.log('Running performance tests on yourHealth homepage...');
  
  measureLayoutPerformance();
  measureFrameRate();
  testResponsiveLayout();
  
  console.log('Performance tests complete.');
  console.groupEnd();
}

// Lighthouse-inspired audit functions
function auditPerformance() {
  console.group('Performance Audit');
  
  // Check for render-blocking resources
  const scripts = document.querySelectorAll('script');
  const blockingScripts = Array.from(scripts).filter(script => 
    !script.hasAttribute('async') && 
    !script.hasAttribute('defer') && 
    script.getAttribute('type') !== 'module'
  );
  
  console.log(`Found ${blockingScripts.length} potentially render-blocking scripts`);
  
  // Check for large layout shifts
  const layoutShiftElements = [];
  const checkLayoutShift = () => {
    if (typeof window.PerformanceObserver === 'undefined') {
      console.log('PerformanceObserver not supported in this browser');
      return;
    }
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          if (entry.value > 0.01) {
            layoutShiftElements.push({
              value: entry.value,
              time: entry.startTime
            });
          }
        }
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.log('Error monitoring layout shifts:', e);
    }
  };
  
  // Calculate approximate first contentful paint
  const approximateFCP = () => {
    const navStart = performance.timeOrigin || performance.timing.navigationStart;
    const now = performance.now();
    console.log(`Approximate time since navigation start: ${Math.round(now)}ms`);
  };
  
  approximateFCP();
  checkLayoutShift();
  
  // Check for unused CSS
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  console.log(`Found ${stylesheets.length} external stylesheets`);
  
  // Check for optimized images
  const images = document.querySelectorAll('img');
  const unoptimizedImages = Array.from(images).filter(img => {
    // Check if image has width and height attributes to prevent layout shift
    return !img.hasAttribute('width') || !img.hasAttribute('height');
  });
  
  console.log(`Found ${unoptimizedImages.length} images missing width/height attributes`);
  
  console.groupEnd();
}

function auditAccessibility() {
  console.group('Accessibility Audit');
  
  // Check for images without alt text
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.hasAttribute('alt'));
  console.log(`Found ${imagesWithoutAlt.length} images without alt text`);
  
  if (imagesWithoutAlt.length > 0) {
    console.warn('Images without alt text:');
    imagesWithoutAlt.forEach(img => {
      console.log(img.src);
    });
  }
  
  // Check for color contrast issues (simplified check)
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
  console.log(`Scanned ${textElements.length} text elements for potential contrast issues`);
  
  // Check for proper heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
  
  let isSequential = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      isSequential = false;
      break;
    }
  }
  
  console.log(`Heading hierarchy is ${isSequential ? 'properly' : 'improperly'} structured`);
  
  // Check for keyboard navigability
  const interactiveElements = document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]');
  const nonKeyboardElements = Array.from(interactiveElements).filter(el => {
    const tabindex = el.getAttribute('tabindex');
    return tabindex && parseInt(tabindex) < 0;
  });
  
  console.log(`Found ${nonKeyboardElements.length} interactive elements that may not be keyboard accessible`);
  
  console.groupEnd();
}

function auditSEO() {
  console.group('SEO Audit');
  
  // Check meta tags
  const title = document.querySelector('title');
  console.log(`Title tag: ${title ? title.textContent : 'Missing'}`);
  
  const metaDescription = document.querySelector('meta[name="description"]');
  console.log(`Meta description: ${metaDescription ? metaDescription.getAttribute('content') : 'Missing'}`);
  
  // Check for structured data
  const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
  console.log(`Found ${structuredData.length} structured data elements`);
  
  // Check for social media tags
  const openGraphTags = document.querySelectorAll('meta[property^="og:"]');
  const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
  
  console.log(`Found ${openGraphTags.length} Open Graph tags and ${twitterTags.length} Twitter Card tags`);
  
  // Check for internal links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
  console.log(`Found ${internalLinks.length} internal links`);
  
  console.groupEnd();
}

function auditBestPractices() {
  console.group('Best Practices Audit');
  
  // Check for console errors
  const originalConsoleError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    errorCount++;
    originalConsoleError.apply(console, args);
  };
  
  // Restore original after a short delay
  setTimeout(() => {
    console.log(`Detected ${errorCount} console errors`);
    console.error = originalConsoleError;
  }, 1000);
  
  // Check for HTTPS
  const isHttps = window.location.protocol === 'https:';
  console.log(`Using HTTPS: ${isHttps}`);
  
  // Check for proper document type
  const doctype = document.doctype;
  console.log(`Doctype declaration: ${doctype ? 'Present' : 'Missing'}`);
  
  // Check for deprecated HTML
  const deprecatedElements = document.querySelectorAll('marquee, blink, center, font, frame, frameset');
  console.log(`Found ${deprecatedElements.length} deprecated HTML elements`);
  
  console.groupEnd();
}

// Function to run comprehensive site audit
function runComprehensiveAudit() {
  console.group('Comprehensive Site Audit (Lighthouse-inspired)');
  console.log('--------------------------------------------');
  console.log('Starting comprehensive site audit...');
  
  auditPerformance();
  auditAccessibility();
  auditSEO();
  auditBestPractices();
  measureLayoutPerformance();
  measureFrameRate();
  testResponsiveLayout();
  
  console.log('--------------------------------------------');
  console.log('Audit complete! Check the console groups above for detailed results.');
  console.groupEnd();
}

// Export functions
window.performanceTest = {
  runAll: runPerformanceTests,
  layoutTest: measureLayoutPerformance,
  fpsTest: measureFrameRate,
  responsiveTest: testResponsiveLayout,
  auditPerformance: auditPerformance,
  auditAccessibility: auditAccessibility,
  auditSEO: auditSEO,
  auditBestPractices: auditBestPractices,
  lighthouses: runComprehensiveAudit
};

console.log('Performance testing and audit tools loaded.');
console.log('- Run window.performanceTest.runAll() for basic performance tests');
console.log('- Run window.performanceTest.lighthouses() for comprehensive audit');
