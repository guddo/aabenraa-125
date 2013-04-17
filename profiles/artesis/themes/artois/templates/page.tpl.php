<?php
/**
 * @file
 * Main page template.
 */
?>
  <?php print render($page['page_top']); ?>
  <div id="wrap">
    <div id="wrap-right">
      <div id="wrap-left">
        <?php if ($logo): ?>
          <a href="<?php print $front_page; ?>" title="<?php print t('Home'); ?>" rel="home" id="logo">
            <img src="<?php print $logo; ?>" alt="<?php print t('Home'); ?>" />
          </a>
        <?php endif; ?>
        <div id="header">
          <?php print render($page['header']); ?>
        </div>
        <div class="subheader">
          <?php print render($page['subheader']); ?>
        </div>
        <div id="main">
          <?php if ($messages): ?>
            <div id="messages"><div class="section clearfix">
              <?php print $messages; ?>
            </div></div> <!-- /.section, /#messages -->
          <?php endif; ?>

          <?php if ($breadcrumb): ?>
          <div id="breadcrumb" class="clearfix"><?php print $breadcrumb; ?></div>
          <?php endif; ?>

          <?php print $title; ?>
          <?php if ($tabs): ?>
            <div class="tabs">
              <?php print render($tabs); ?>
            </div>
          <?php endif; ?>
          <?php print render($page['content']); ?>
        </div>
      </div>
    </div>
  </div>
  <div id="footer">
    <?php print render($page['footer']); ?>
  </div>
