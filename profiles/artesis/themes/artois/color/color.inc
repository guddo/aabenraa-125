<?php
$info = array(

  // Available colors and color labels used in theme.
  'fields' => array(
    'text'                    => t('Text color'),
    'base'                    => t('Base color'),
    'link'                    => t('Link color'),
    'input-submit'            => t('Button color'),
    'input-submit-subheader'  => t('Subheader button color'),
    'header-bottom'           => t('Header bottom color'),
    'region-subheader'        => t('SubHeader color'),
    'region-footer'           => t('Footer color'),
    'facet-header'            => t('Facet header color'),
    'menu-tabs'               => t('Menu tabs color'),
  ),

  // Pre-defined color schemes.
  'schemes' => array(
    'default' => array(
      'title' => t('Orange / Blue (Default)'),
      'colors' => array(
        'base' => '#ffffff',
        'text' => '#494949',
        'link' => '#e94927',
        'input-submit' => '#e94929',
        'header-bottom' => '#09a9e0',
        'region-subheader' => '#e94928',
        'input-submit-subheader' => '#09a9e1',
        'facet-header' => '#5ab5ed',
        'menu-tabs' => '#e94926',
        'region-footer' => '#44a5d2',
      ),
    ),
    'ash' => array(
      'title' => t('Blue / Green'),
      'colors' => array(
        'base' => '#ffffff',
        'text' => '#494949',
        'link' => '#09a9e9',
        'input-submit' => '#4eaa48',
        'header-bottom' => '#3f9a39',
        'region-subheader' => '#09a9e8',
        'input-submit-subheader' => '#3f9a40',
        'facet-header' => '#3f9a39',
        'menu-tabs' => '#09a9e8',
        'region-footer' => '#3f9a38',
      ),
    ),
    'aquamarine' => array(
      'title' => t('Pink / Green'),
      'colors' => array(
        'base' => '#ffffff',
        'text' => '#494949',
        'link' => '#4eaa47',
        'input-submit' => '#4eaa48',
        'header-bottom' => '#3f9a39',
        'region-subheader' => '#d51578',
        'input-submit-subheader' => '#3f9a40',
        'facet-header' => '#4eaa49',
        'menu-tabs' => '#4eaa46',
        'region-footer' => '#3f9a38',
      ),
    ),
  ),

  // Gradient definitions.
  'gradients' => array(
    array(
      // (x, y, width, height).
      'dimension' => array(0, 0, 0, 0),
      // Direction of gradient ('vertical' or 'horizontal').
      'direction' => 'vertical',
      // Keys of colors to use for the gradient.
      'colors' => array('top', 'bottom'),
    ),
  ),

  'blend_target'  => '#ffffff',
  'preview_css'   => 'color/preview.css',
  'preview_image' => 'color/preview.png',

  // Images which should not be altered.
  'copy' => array(),

  // CSS files (excluding @import) to rewrite with new color scheme.
  'css' => array(
    'css/colors.css',
  ),

  'base_image' => 'color/base.png',

  // Color areas to fill (x, y, width, height).
  'fill' => array(
    'region-subheader' => array(0,0,984,74),
    'region-footer' => array(0,74,1016,600),
  ),

  // Coordinates of all the theme slices (x, y, width, height)
  // with their filename as used in the stylesheet.
  'slices' => array(
    'images/header_background.png' => array(0,0,984,74),
    'images/footer_background.png' => array(0,74,1016,600),
    'images/icons/icon_rightarrow_14x14_white_on_orange.png' => array(0,674,14,14),
    'images/icons/icon_rightarrow_14x14_white_on_orange_on_grey.png' => array(14,674,14,14),
    'images/icons/icon_uparrow_14x14_white_on_orange.png' => array(28,674,14,14),
    'images/carousel_prev_40x70_orange_on_white.png' => array(0,688,40,70),
    'images/carousel_next_40x70_orange_on_white.png' => array(40,688,40,70),
    'images/carousel_prev_disabled_40x70_orange_on_white.png' => array(80,688,40,70),
    'images/carousel_next_disabled_40x70_orange_on_white.png' => array(120,688,40,70),
  ),

  'fill' => array(
    'link'      => array(0,674,42,14),
    'menu-tabs' => array(0,688,160,70),
  ),

);
