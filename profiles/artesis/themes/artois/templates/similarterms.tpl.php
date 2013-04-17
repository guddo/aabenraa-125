<?php

/**
 * @file
 * simterms.tpl.ph
 * Theme implementation to display a list of related content.
 *
 * Available variables:
 * - $display_options:
 *    'title_only' Display titles only
 *    'teaser'     Display titles and teaser
 * - $display_options: Show the block display even with an empty list.
 * - $items: the list.
 * - $nodes: The raw data of the listed items.
 */
?>

<?php if( strlen($items) > 0 ) {
echo '<h2>'. t('Related content').'</h2>';
  print($items);
}
