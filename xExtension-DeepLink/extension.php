<?php
class DeepLinkExtension extends Minz_Extension {
  public function init() {
    Minz_View::appendScript($this->getFileUrl('script.js', 'js'), false, true, false);
  }
}

