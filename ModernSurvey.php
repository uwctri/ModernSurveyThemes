<?php

namespace UWMadison\ModernSurvey;

use ExternalModules\AbstractExternalModule;

class ModernSurvey extends AbstractExternalModule
{
    public function redcap_every_page_top($project_id)
    {
        if ($this->isSurveySettingsPage()) {
            $this->injectSurveySettingsAssets();
        }
    }

    public function redcap_survey_page($project_id, $record, $instrument, $event_id, $group_id, $survey_hash, $response_id, $repeat_instance = 1)
    {
        // Ensure viewport meta tag exists for responsive mobile layout
        echo '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">';
        
        // Inline subtle font smoothing helper
        echo '<style type="text/css">
            body, #pagecontainer, #container, #questiontable {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
        </style>';
    }

    public function isSurveySettingsPage()
    {
        return $this->isPage('Surveys/edit_info.php') || $this->isPage('Surveys/create_survey.php');
    }

    protected function injectSurveySettingsAssets()
    {
        // 1. Load theme metadata from themes.json and read corresponding standalone CSS files
        $themesJsonPath = $this->getSafePath('themes.json');
        $themes = [];
        if (file_exists($themesJsonPath)) {
            $themes = json_decode(file_get_contents($themesJsonPath), true);
        }

        foreach ($themes as $id => &$theme) {
            $cssFile = isset($theme['file']) ? $this->getSafePath($theme['file']) : '';
            if ($cssFile && file_exists($cssFile)) {
                $theme['css'] = file_get_contents($cssFile);
            } else {
                $theme['css'] = '';
            }
        }
        unset($theme);

        // 2. Initialize JavaScript Module Object
        $this->initializeJavascriptModuleObject();
        $jsObject = $this->getJavascriptModuleObjectName();
        $jsonData = json_encode($themes);

        // 3. Output stylesheet, themes data on JSMO, and main JavaScript
        $cssUrl = $this->getUrl('css/survey_settings.css');
        $jsUrl = $this->getUrl('survey_settings.js');

        echo "\n<!-- REDCap Modern Survey Themes Module -->\n";
        echo "<link rel='stylesheet' type='text/css' href='{$cssUrl}'>\n";
        echo "<script type='text/javascript'>\n";
        echo "  {$jsObject}.themes = {$jsonData};\n";
        echo "</script>\n";
        echo "<script type='text/javascript' src='{$jsUrl}'></script>\n";
    }
}
