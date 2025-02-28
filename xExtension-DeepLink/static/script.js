console.log('hey');
(function() {
  // Extension initialization
  function init() {
    // Initialize when page is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupExtension);
    } else {
      setupExtension();
    }
    
    // Also listen for AJAX content updates
    document.addEventListener('freshrss:loaded-streams', setupExtension);
  }

  // Setup the extension functionality
  function setupExtension() {
    // Check for deep links on page load
    setTimeout(checkForDeepLink, 300);
    
    // Setup article click listeners
    setupArticleListeners();
  }

  // Setup listeners for article opening
  function setupArticleListeners() {
    // Get all article elements that don't have listeners yet
    const articles = document.querySelectorAll('.flux:not([data-deeplink-initialized])');
    
    articles.forEach(article => {
      // Mark the article as initialized
      article.setAttribute('data-deeplink-initialized', 'true');
      
      // Find article ID - typically in the format 'flux_[ARTICLE_ID]'
      const articleId = article.getAttribute('id');
      if (!articleId) return;
      
      // In FreshRSS, clicking on the title or header expands the article
      const expandElements = article.querySelectorAll('.flux_header, .flux_title a');
      
      expandElements.forEach(element => {
        element.addEventListener('click', function() {
          // Short delay to ensure the article is actually opened
          setTimeout(() => {
            // Check if article is expanded/opened
            if (article.classList.contains('active')) {
              // Get current URL and add/update the article parameter
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set('article', articleId);
              
              // Update the URL without reloading the page
              history.pushState({articleId: articleId}, '', currentUrl.toString());
            }
          }, 100);
        });
      });
    });
  }

  // Check for article deep links and open the article
  function checkForDeepLink() {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    
    // If there's an article ID in the URL
    if (articleId) {
      // Try to find the article
      const article = document.getElementById(articleId);
      
      if (article) {
        // Enable focused view mode
        enableFocusedViewMode(article);
        
        // Find the clickable element to open the article
        const clickElement = article.querySelector('.flux_header, .flux_title a');
        
        if (clickElement) {
          // Simulate click to open the article
          clickElement.click();
          
          // Scroll to the article
          article.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      } else {
        console.log('Deep linked article not found on current page');
        // The article might be on another page or not loaded yet
      }
    }
  }
  
  // Enable focused view mode for deep linked articles
  function enableFocusedViewMode(targetArticle) {
    // Hide side navigation
    const sideNav = document.getElementById('aside_feed');
    if (sideNav) {
      sideNav.style.display = 'none';
    }
    
    // Hide any navigation menus in the header
    const headerNav = document.querySelector('#header');
    if (headerNav) {
      headerNav.style.display = 'none';
    }
    
    // Use a more aggressive approach to hide all stream items
    // First, hide the entire stream
    const streamDiv = document.querySelector('#stream-items, .stream-items');
    if (streamDiv) {
      // Clone the target article
      const clonedArticle = targetArticle.cloneNode(true);
      
      // Clear the stream and only append our target article
      streamDiv.innerHTML = '';
      streamDiv.appendChild(clonedArticle);
      
      // Find the clickable element to open the article
      const clickElement = clonedArticle.querySelector('.flux_header, .flux_title a');
      if (clickElement) {
        // Simulate click to open the article
        setTimeout(() => {
          clickElement.click();
        }, 100);
      }
    } else {
      // Fallback to the old method if stream container not found
      const allArticles = document.querySelectorAll('.flux');
      allArticles.forEach(article => {
        if (article !== targetArticle) {
          article.style.display = 'none';
        }
      });
    }
    
    // Hide day dividers
    const dayDividers = document.querySelectorAll('div.day');
    dayDividers.forEach(div => {
      div.style.display = 'none';
    });
    
    // Hide navigation menus
    const navMenus = document.querySelectorAll('nav.nav_menu');
    navMenus.forEach(nav => {
      nav.style.display = 'none';
    });
    
    // Hide search areas
    const searchAreas = document.querySelectorAll('div.search');
    searchAreas.forEach(div => {
      div.style.display = 'none';
    });
    
    // Hide configuration areas - corrected from div to nav
    const configAreas = document.querySelectorAll('nav.configure');
    configAreas.forEach(nav => {
      nav.style.display = 'none';
    });
    
    // Hide stream footer
    const streamFooter = document.querySelector('form#stream-footer');
    if (streamFooter) {
      streamFooter.style.display = 'none';
    }
    
    // Hide div stream footer (alternative footer in some themes)
    const divStreamFooter = document.querySelector('div#stream-footer');
    if (divStreamFooter) {
      divStreamFooter.style.display = 'none';
    }
    
    // Make the content area full width
    const contentArea = document.querySelector('#stream');
    if (contentArea) {
      contentArea.style.width = '100%';
      contentArea.style.margin = '0 auto';
      contentArea.style.maxWidth = '800px';
    }
    
    // Add a class to body for additional CSS if needed
    document.body.classList.add('deeplink-focused-view');
    
    // Add mutation observer to ensure no other articles appear
    setupArticleObserver();
  }
  
  // Set up a mutation observer to hide any new articles that might appear
  function setupArticleObserver() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    
    const callback = function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          // Find any newly added articles
          const articles = document.querySelectorAll('.flux');
          const urlParams = new URLSearchParams(window.location.search);
          const articleId = urlParams.get('article');
          
          articles.forEach(article => {
            if (articleId && article.id !== articleId) {
              article.style.display = 'none';
            }
          });
        }
      }
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }

  // Initialize the extension
  init();
})();
