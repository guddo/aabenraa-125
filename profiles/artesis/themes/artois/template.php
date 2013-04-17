<?php

/**
 * Implements hooks_css_alter().
 */
function artois_css_alter(&$css) {
  // Remove a couple of unwanted CSS files.
  foreach (array_keys($css) as $filename) {
    if (strpos($filename, 'addressfield/addressfield.css')) {
      unset($css[$filename]);
    }
  }
}

/**
 * Override or insert variables into the page template for HTML output.
 */
function artois_process_html(&$variables) {
  if (module_exists('color')) {
    _color_html_alter($variables);
  }
}

/**
 * Theme override function, to be able to show different
 * label text to each date popup field.
 *
 * @param Array $vars
 * @return Stringp
 */
function artois_date_part_label_date($vars) {
  $element = $vars['element'];
  if (stristr($element['#date_title'], 'start')) {
    $date_string = 'Start date';
  }
  else {
    $date_string = 'End date';
  }

  return t($date_string, array(), array('context' => 'datetime'));
}

/**
 * Preprocess function for page.
 */
function artois_preprocess_page(&$vars) {
  // Don't show title for panel pages, we assume they provide their
  // own as part of the panel.
  if ($panel_page = page_manager_get_current_page()) {
    $vars['title'] = '';
  }
}

function artois_form_alter(&$form, &$form_state, $form_id) {
  switch ($form_id) {
    // add a login link to the horizontal login bar block
    case 'user_login':
      $form['name']['#type'] = 'password';
      break;
    case 'user_login_block':
      $form['name']['#prefix'] = '<span class="lead-text">'.t('Log in:').'</span>';
      $form['actions']['submit']['form_id']['#suffix'] = '<div class="clearfix"></div>';
      // HTML5 placeholder attribute
      $form['name']['#attributes']['placeholder'] = t('Username');
      $form['name']['#type'] = 'password';
      $form['pass']['#attributes']['placeholder'] = t('Password');
      $form['links']['#markup'] = "";
      break;
    case 'search_block_form':
      $form['search_block_form']['#size'] = '25';
      // HTML5 placeholder attribute
      $form['search_block_form']['#attributes']['placeholder'] = t('Enter search terms');
      $form['actions']['#suffix'] = '<div class="clearfix"></div>';
      break;
    case 'comment_node_ding_news_form':
      $form['actions']['submit']['#prefix'] = '<div>';
      $form['actions']['submit']['#suffix'] = '</div>';
      $form['actions']['preview']['#prefix'] = '<div>';
      $form['actions']['preview']['#suffix'] = '</div>';
      $form['subject']['#type'] = 'hidden';
      break;
  }
}

/**
 * Preprocess field template variables.
 *
 * If we want to alter fields which deviate from core/module field behaviour.
 */
function artois_preprocess_field(&$variables, $hook) {
  switch ($variables['element']['#field_type']) {
    case 'ting_series':
    case 'ting_subjects':
      // Remove the clearfix on fields with class field-label-inline, since it
      // breaks the layout in this theme.
      unset($variables['classes_array'][array_search('clearfix', $variables['classes_array'])]);
    break;
  }
  if ($variables['element']['#field_name'] == 'ding_library_opening_hours') {
    $variables['items'][0]['#markup'] = str_replace("\n", '<br />', $variables['items'][0]['#markup']);
  }
}

/**
 * Preprocess ting_object template variables.
 */
function artois_preprocess_ting_object(&$variables) {
  $places = array(
    'ting_cover' => 'left',
    'ting_title' => 'right',
    'ting_abstract' => 'right',
    'ting_author' => 'right',
    'ting_type' => 'right',
    'ting_subjects' => 'right',
    'ting_series' => 'right',
    'ding_availability_item' => 'right',
  );
  $variables['content']['left'] = array();
  $variables['content']['right'] = array();

  foreach ($variables['content'] as $name => $render) {
    if (isset($places[$name])) {
      $variables['content'][$places[$name]][] = $render;
      unset($variables['content'][$name]);
    }
  }
}

/**
 * Overriding theme_breadcrumb().
 */
function artois_breadcrumb($variables) {
  $breadcrumb = $variables['breadcrumb'];
  if (count($breadcrumb) > 1) {
    // Provide a navigational heading to give context for breadcrumb links to
    // screen-reader users. Make the heading invisible with .element-invisible.
    end($breadcrumb);
    $key = key($breadcrumb);
    $breadcrumb[$key] = '<span class="last-breadcrumb">' . $breadcrumb[$key] . '</span>';

    $output = '<h2 class="title">' . t('You are here') . ':</h2>';
    $output .= '<div class="trail">' . implode(' › ', $breadcrumb) . '</div>';
    return $output;
  }
}

function artois_links__library_menu(&$variables) {
  return '<div class="wrapper">' . theme('links', $variables) . '</div>';
}

/**
 * Preprocess node template variables.
 */
function artois_preprocess_node(&$variables) {
  switch ($variables['view_mode']) {
    case 'teaser_highlight':
      $variables['theme_hook_suggestion'] = 'node__' . $variables['type'] . '__teaser_highlight';
      // INTENTIONALLY no break here
    case 'teaser':
      // Link title to node in teaser and teaser highlight view.
      $variables['title_prefix'] = '<a href="' . $variables['node_url'] . '">';
      $variables['title_suffix'] = '</a>';
      break;
  }
  if ($variables['view_mode'] == 'teaser') {
    $variables['node_type'] = check_plain(node_type_get_name($variables['node']));
    if (!empty($variables['content']['field_list_image'])) {
      $variables['classes_array'][] = 'has-image';
    }
  }

  switch ($variables['type']) {
    case 'ding_event':
      // timestamp on event nodes should be the event start time
      $date = new DateObject(
        $variables['field_event_date'][0]['value'],
        $variables['field_event_date'][0]['timezone_db'],
        date_type_format($variables['field_event_date'][0]['date_type'])
      );
      $variables['content']['artois_node_date'] = $date->format(DATE_FORMAT_UNIX);
      break;
    default:
      // timestamp on nodes default to the created timestamp
      $variables['content']['artois_node_date'] = $variables['created'];
      break;
  }
}
