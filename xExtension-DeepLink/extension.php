<?php
class DeepLinkExtension extends Minz_Extension {
  private $targetArticleId = null;
  private $articleTitle = null;
  private $articleContent = null;
  private $articleLink = null;
  private $articleImageUrl = null;

  public function init() {
    // Register JavaScript
    Minz_View::appendScript(url: $this->getFileUrl(filename: 'script.js', type: 'js'), cond: false, defer: true, async: false);

    // Add CSS for hiding elements
    Minz_View::appendStyle(url: $this->getFileUrl(filename: 'style.css', type: 'css'));

    // Check if we have an article ID in the URL
    if (isset($_GET['article'])) {
      $this->targetArticleId = $_GET['article'];

      // Register hook to filter entries
      $this->registerHook(hook_name: 'entry_before_display', hook_function: array($this, 'filterEntries'));

      // Load article data early
      $this->loadArticleData();

      if ($this->articleTitle) {
        // Override page title using the built-in title variable
        Minz_View::_param(key: 'pageTitle', value: $this->articleTitle);

        // Register hook to add meta tags to the head
        $this->registerHook(hook_name: 'head', hook_function: array($this, 'addMetaTagsToHead'));
      }
    }
  }

  // Load article data from the database
  private function loadArticleData()
  {
    // Extract the numeric ID from the "flux_XXXXX" format
    $id_parts = explode('_', $this->targetArticleId);
    $entry_id = isset($id_parts[1]) ? intval($id_parts[1]) : 0;

    if ($entry_id <= 0) {
      return;
    }

    // Get the entry from the database
    $entryDAO = FreshRSS_Factory::createEntryDao();
    $entry = $entryDAO->searchById($entry_id);

    if (!$entry) {
      return;
    }

    // Store article data for later use
    $this->articleTitle = $entry->title();
    $this->articleContent = $entry->content();
    $this->articleLink = $entry->link();

    // Try to find an image URL in the content
    if (preg_match('/<img.+?src=[\'"]([^\'"]+)[\'"].*?>/i', $this->articleContent, $matches)) {
      $this->articleImageUrl = $matches[1];
    }
  }

  // Filter entries to only show the requested article
  public function filterEntries($entry)
  {
    if (!$this->targetArticleId) {
      return $entry;
    }

    // Extract the numeric ID from the flux_XXXXX format
    $id_parts = explode('_', $this->targetArticleId);
    $target_entry_id = isset($id_parts[1]) ? intval($id_parts[1]) : 0;

    // If we found a valid ID, only show the target entry
    if ($target_entry_id > 0) {
      // Compare with the current entry ID
      if ($entry->id() != $target_entry_id) {
        // Return null to remove this entry from the display
        return null;
      } else {
        // Make sure this article has the correct id attribute
        $entry->_attributes('id', $this->targetArticleId);
      }
    }

    return $entry;
  }

  // Add meta tags to the head section
  public function addMetaTagsToHead()
  {
    if (!$this->articleTitle) {
      return;
    }

    // Generate a description by stripping HTML and truncating
    $description = strip_tags($this->articleContent);
    $description = mb_substr($description, 0, 200, 'UTF-8');
    if (mb_strlen($description, 'UTF-8') >= 200) {
      $description .= '...';
    }

    // Build meta tags content
    $meta_content = '';

    // Standard meta description
    $meta_content .= '<meta name="description" content="' . htmlspecialchars($description, ENT_QUOTES) . '">' . "\n";

    // Open Graph meta tags
    $meta_content .= '<meta property="og:title" content="' . htmlspecialchars($this->articleTitle, ENT_QUOTES) . '">' . "\n";
    $meta_content .= '<meta property="og:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '">' . "\n";
    $meta_content .= '<meta property="og:url" content="' . htmlspecialchars(Minz_Url::display(array('params' => array('article' => $this->targetArticleId))), ENT_QUOTES) . '">' . "\n";
    $meta_content .= '<meta property="og:type" content="article">' . "\n";

    if ($this->articleImageUrl) {
      $meta_content .= '<meta property="og:image" content="' . htmlspecialchars($this->articleImageUrl, ENT_QUOTES) . '">' . "\n";
    }

    // Twitter Card meta tags
    $meta_content .= '<meta name="twitter:card" content="summary_large_image">' . "\n";
    $meta_content .= '<meta name="twitter:title" content="' . htmlspecialchars($this->articleTitle, ENT_QUOTES) . '">' . "\n";
    $meta_content .= '<meta name="twitter:description" content="' . htmlspecialchars($description, ENT_QUOTES) . '">' . "\n";

    if ($this->articleImageUrl) {
      $meta_content .= '<meta name="twitter:image" content="' . htmlspecialchars($this->articleImageUrl, ENT_QUOTES) . '">' . "\n";
    }

    // Add canonical link to original article
    $meta_content .= '<link rel="canonical" href="' . htmlspecialchars($this->articleLink, ENT_QUOTES) . '">' . "\n";

    echo $meta_content;
  }
}
