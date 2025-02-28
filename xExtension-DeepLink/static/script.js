(function () {
  // Extension initialization
  function init() {
    // Initialize when page is loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupExtension);
    } else {
      setupExtension();
    }

    // Also listen for AJAX content updates
    document.addEventListener("freshrss:loaded-streams", setupExtension);
  }

  // Setup the extension functionality
  function setupExtension() {
    // Check for deep links on page load
    setTimeout(checkForDeepLink, 300);

    // Setup article click listeners
    setupArticleListeners();

    // Add class to body if article parameter exists
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get("article");
    if (articleId) {
      document.body.classList.add("article-focused");
    }
  }

  // Setup listeners for article opening
  function setupArticleListeners() {
    // Get all article elements that don't have listeners yet
    const articles = document.querySelectorAll(
      ".flux:not([data-deeplink-initialized])"
    );

    articles.forEach((article) => {
      // Mark the article as initialized
      article.setAttribute("data-deeplink-initialized", "true");

      // Find article ID - typically in the format 'flux_[ARTICLE_ID]'
      const articleId = article.getAttribute("id");
      if (!articleId) return;

      // In FreshRSS, clicking on the title or header expands the article
      const expandElements = article.querySelectorAll(
        ".flux_header, .flux_title a"
      );

      expandElements.forEach((element) => {
        element.addEventListener("click", function () {
          // Short delay to ensure the article is actually opened
          setTimeout(() => {
            // Check if article is expanded/opened
            if (article.classList.contains("active")) {
              // Get current URL and add/update the article parameter
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set("article", articleId);

              // Update the URL without reloading the page
              history.pushState(
                { articleId: articleId },
                "",
                currentUrl.toString()
              );
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
    const articleId = urlParams.get("article");

    // If there's an article ID in the URL
    if (articleId) {
      // Try to find the article
      const article = document.getElementById(articleId);

      if (article) {
        // Find the clickable element to open the article
        const clickElement = article.querySelector(
          ".flux_header, .flux_title a"
        );

        if (clickElement) {
          // Simulate click to open the article
          clickElement.click();

          // Scroll to the article
          article.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        // Instead of logging an error, try a different approach for server-filtered articles
        // Look for any article that might have been filtered server-side
        const anyArticle = document.querySelector(".flux");
        if (anyArticle) {
          const clickElement = anyArticle.querySelector(
            ".flux_header, .flux_title a"
          );
          if (clickElement) {
            // Simulate click to open the article
            clickElement.click();
          }
        }
      }
    }
  }

  // Initialize the extension
  init();
})();
