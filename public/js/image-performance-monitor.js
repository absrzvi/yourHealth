/**
 * Image Performance Monitor
 * 
 * This script helps track and report on image loading performance
 * to identify optimization opportunities.
 */

(function() {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;

  let loadedImages = 0;
  let totalImageSize = 0;
  let slowestImage = { src: '', loadTime: 0 };
  let unoptimizedImages = [];
  
  // Performance observer for image loads
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'img') {
            loadedImages++;
            
            // Extract image size if available (not always reliable)
            const resourceSize = entry.transferSize || 0;
            totalImageSize += resourceSize;
            
            // Track slow-loading images
            const loadTime = entry.duration;
            if (loadTime > slowestImage.loadTime) {
              slowestImage = { 
                src: entry.name, 
                loadTime: loadTime,
                size: resourceSize
              };
            }
            
            // Log information about this image
            console.log(`[Image Monitor] Loaded: ${entry.name}`, {
              loadTime: `${loadTime.toFixed(2)}ms`,
              size: resourceSize ? `${(resourceSize / 1024).toFixed(2)} KB` : 'Unknown',
              timing: entry
            });
          }
        });
      });
      
      observer.observe({ type: 'resource', buffered: true });
    } catch (e) {
      console.error('[Image Monitor] Error setting up PerformanceObserver', e);
    }
  }
  
  // Check DOM for unoptimized images
  function scanImagesOnPage() {
    const allImages = document.querySelectorAll('img');
    
    allImages.forEach(img => {
      // Check if image is using Next.js Image component (will have data-nimg attribute)
      const isNextImage = img.getAttribute('data-nimg') !== null;
      
      // Check for missing width/height
      const hasDimensions = img.getAttribute('width') !== null && 
                           img.getAttribute('height') !== null;
      
      // Check for missing alt text
      const hasAlt = img.getAttribute('alt') !== null && 
                    img.getAttribute('alt').trim() !== '';
      
      // Check for proper lazy loading
      const hasLoading = img.getAttribute('loading') !== null;
      
      // Record issues
      const issues = [];
      if (!isNextImage) issues.push('Not using Next.js Image');
      if (!hasDimensions) issues.push('Missing width/height');
      if (!hasAlt) issues.push('Missing alt text');
      if (!hasLoading && !isNextImage) issues.push('No loading attribute');
      
      if (issues.length > 0) {
        unoptimizedImages.push({
          src: img.src,
          issues: issues
        });
      }
    });
  }
  
  // Run the scan after page load
  window.addEventListener('load', () => {
    // Wait a bit to ensure all images are loaded
    setTimeout(() => {
      scanImagesOnPage();
      
      // Print summary
      console.group('[Image Monitor] Summary');
      console.log(`Total images loaded: ${loadedImages}`);
      console.log(`Total image size: ${(totalImageSize / 1024 / 1024).toFixed(2)} MB`);
      
      if (slowestImage.src) {
        console.warn(`Slowest image: ${slowestImage.src}`);
        console.log(`Load time: ${slowestImage.loadTime.toFixed(2)}ms`);
        if (slowestImage.size) {
          console.log(`Size: ${(slowestImage.size / 1024).toFixed(2)} KB`);
        }
      }
      
      if (unoptimizedImages.length > 0) {
        console.warn(`Found ${unoptimizedImages.length} unoptimized images:`);
        unoptimizedImages.forEach(img => {
          console.log(`- ${img.src}`);
          console.log(`  Issues: ${img.issues.join(', ')}`);
        });
      } else {
        console.log('No unoptimized images found. Great job!');
      }
      
      console.groupEnd();
    }, 3000);
  });
  
  // Expose API
  window.imageMonitor = {
    scanNow: scanImagesOnPage
  };
  
  console.log('[Image Monitor] Initialized. Check the console after page load for results.');
})();
