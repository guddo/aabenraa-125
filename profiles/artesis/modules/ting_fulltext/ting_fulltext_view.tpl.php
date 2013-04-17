<div class="ting_fulltext_wrap">

<h1>
<?php 
   if( isset($variables['element']['#fields']['title']) ) {
     echo $variables['element']['#fields']['title'];
   }
?>
</h1>

<div class="ting_fulltext_name">
<?php
   if( !empty($variables['element']['#fields']['firstname'] ) ) {
     echo '<b>Forfatter :</b>&nbsp';
     echo $variables['element']['#fields']['firstname'].'&nbsp;'.$variables['element']['#fields']['surname'];
   }
?>
</div><!-- name -->
<?php
if( isset($variables['element']['#fields']['subject']) ) {
  echo '<div class="ting_fulltext_subject">'.t('subject:').'</div>';
  foreach( $variables['element']['#fields']['subject'] as $key => $subject ) {
    echo '<div class="ting_fulltext_subjectitem">'.$subject.'</div>';
  }
  echo '</div><!-- subject -->'; 
}
?>


<?php
if( isset( $variables['element']['#fields']['section']) ) {
  foreach( $variables['element']['#fields']['section'] as $key => $section ) {
    if( isset($section['title']) ) {
      echo '<h4>'.$section['title'].'</h4>';
    }
    if( isset($section['para']) ) {
      foreach($section['para'] as $para) {      
	echo '<div class="ting_fulltext_txt">'.$para.'</div>';
      }
    }
  }
}
?>
</div> <!-- wrapper -->
