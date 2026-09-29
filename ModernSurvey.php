<?php

namespace UWMadison\ModernSurvey;

use ExternalModules\AbstractExternalModule;
use REDCap;
use Files;
use FileRepository;
use Project;

class ModernSurvey extends AbstractExternalModule
{
    public function redcap_every_page_top($project_id)
    {
        if ($this->isSurveySettingsPage()) {
            $this->injectSurveySettingsAssets($project_id);
        } else {
            global $custom_css;
            if (!empty($custom_css) && strpos($custom_css, 'Modern Survey Theme:') !== false)
                echo "<style type=\"text/css\">\n/* Preloaded Modern Survey CSS to eliminate FOUC */\n" . strip_tags($custom_css) . "\n</style>\n";
        }
    }

    public function redcap_survey_page($project_id, $record = null, $instrument = null, $event_id = null, $group_id = null, $survey_hash = null, $response_id = null, $repeat_instance = 1)
    {
        global $Proj;
        $customCss = '';
        if (isset($Proj) && isset($Proj->forms[$instrument]['survey_id'])) {
            $survey_id = $Proj->forms[$instrument]['survey_id'];
            $customCss = $Proj->surveys[$survey_id]['custom_css'] ?? '';
        }
        if (empty($customCss) && !empty($survey_hash)) {
            $sql = "SELECT s.custom_css FROM redcap_surveys s JOIN redcap_surveys_participants p ON s.survey_id = p.survey_id WHERE p.hash = ?";
            $res = $this->query($sql, [$survey_hash]);
            if ($res && ($row = $res->fetch_assoc())) {
                $customCss = $row['custom_css'] ?? '';
            }
        }

        if (!empty($customCss) && strpos($customCss, 'Modern Survey Theme:') !== false) {
            $clientJsUrl = $this->getUrl('survey_client.js');
            echo "<script type='text/javascript' src='{$clientJsUrl}'></script>\n";
        }
    }

    public function isSurveySettingsPage()
    {
        return $this->isPage('Surveys/edit_info.php') || $this->isPage('Surveys/create_survey.php');
    }

    public function redcap_module_ajax($action, $payload, $project_id)
    {
        if ($action === 'upload_bg_image')
            return $this->handleBackgroundUpload($payload, $project_id);
        return null;
    }

    private function injectSurveySettingsAssets()
    {
        global $user_rights;

        // Load theme metadata from themes.json and read corresponding standalone CSS files
        $themesJsonPath = $this->getSafePath('themes.json');
        $themes = [];
        if (file_exists($themesJsonPath))
            $themes = json_decode(file_get_contents($themesJsonPath), true);

        foreach ($themes as $id => &$theme) {
            $cssFile = isset($theme['file']) ? $this->getSafePath($theme['file']) : '';
            if ($cssFile && file_exists($cssFile)) {
                $theme['css'] = file_get_contents($cssFile);
            } else {
                $theme['css'] = '';
            }
        }

        // Check File Repository availability
        $fileRepoEnabled = ($GLOBALS['file_repository_enabled'] == '1');
        if (isset($user_rights['file_repository']) && $user_rights['file_repository'] == '0')
            $fileRepoEnabled = false;

        // Initialize JavaScript Module Object (REDCap Native JSMO AJAX)
        $this->initializeJavascriptModuleObject();
        $jsObject = $this->getJavascriptModuleObjectName();
        $jsonData = json_encode($themes);

        // Output stylesheet, themes data on JSMO, and main JavaScript
        $cssUrl = $this->getUrl('css/survey_settings.css');
        $jsUrl = $this->getUrl('survey_settings.js');

        echo "<link rel='stylesheet' type='text/css' href='{$cssUrl}'>\n";
        echo "<script type='text/javascript'>\n";
        echo "  {$jsObject}.themes = {$jsonData};\n";
        echo "  {$jsObject}.fileRepoEnabled = " . ($fileRepoEnabled ? 'true' : 'false') . ";\n";
        echo "</script>\n";
        echo "<script type='text/javascript' src='{$jsUrl}'></script>\n";
    }

    private function handleBackgroundUpload($payload, $project_id)
    {
        global $user_rights;

        // Verify File Repository is enabled at the system level
        if ($GLOBALS['file_repository_enabled'] != '1') {
            return [
                'success' => false,
                'error' => 'REDCap File Repository is disabled on this server. Custom image uploads are unavailable.'
            ];
        }

        // Verify user has File Repository permissions in this project
        if (isset($user_rights['file_repository']) && $user_rights['file_repository'] == '0') {
            return [
                'success' => false,
                'error' => 'You do not have permission to upload files to the File Repository in this project.'
            ];
        }

        // Validate payload
        $dataUrl = $payload['dataUrl'] ?? '';
        $origName = basename($payload['filename'] ?? 'background.jpg');

        if (empty($dataUrl)) {
            return [
                'success' => false,
                'error' => 'No image data provided.'
            ];
        }

        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($ext, $allowedExts, true)) {
            return [
                'success' => false,
                'error' => 'Invalid file extension. Please upload a JPG, PNG, WEBP, or GIF image.'
            ];
        }

        // Extract and decode Base64 data URL
        if (!preg_match('/^data:([^;]+);base64,(.+)$/', $dataUrl, $matches)) {
            return [
                'success' => false,
                'error' => 'Invalid image payload format.'
            ];
        }

        $binaryData = base64_decode($matches[2]);
        if ($binaryData === false || strlen($binaryData) === 0) {
            return [
                'success' => false,
                'error' => 'Failed to decode image data.'
            ];
        }

        $fileSize = strlen($binaryData);
        $maxBytes = function_exists('maxUploadSizeFileRepository') ? (maxUploadSizeFileRepository() * 1024 * 1024) : (32 * 1024 * 1024);
        if ($fileSize > $maxBytes) {
            return [
                'success' => false,
                'error' => 'Image file exceeds maximum allowable upload size.'
            ];
        }

        // Write to temporary file for content inspection and upload
        $tempFile = tempnam(sys_get_temp_dir(), 'ms_bg_');
        if (!$tempFile || file_put_contents($tempFile, $binaryData) === false) {
            if ($tempFile && file_exists($tempFile)) @unlink($tempFile);
            return [
                'success' => false,
                'error' => 'Failed to write temporary upload file.'
            ];
        }

        // Validate actual MIME type via finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $tempFile);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($detectedMime, $allowedMimes, true)) {
            @unlink($tempFile);
            return [
                'success' => false,
                'error' => 'Uploaded file is not a supported image type: ' . $detectedMime
            ];
        }

        // Store file in REDCap edocs storage
        $fileArray = [
            'name' => $origName,
            'type' => $detectedMime,
            'size' => $fileSize,
            'tmp_name' => $tempFile,
            'error' => UPLOAD_ERR_OK
        ];

        $edoc_id = Files::uploadFile($fileArray, $project_id);
        if (file_exists($tempFile))
            @unlink($tempFile);

        if (!$edoc_id) {
            return [
                'success' => false,
                'error' => 'Failed to store image in REDCap storage.'
            ];
        }

        // Add file to REDCap File Repository
        $comment = 'Modern Survey Background: ' . $origName;
        $repoAdded = REDCap::addFileToRepository($edoc_id, $project_id, $comment, false, $origName);
        if (!$repoAdded) {
            return [
                'success' => false,
                'error' => 'Failed to register image in the project File Repository.'
            ];
        }

        // Retrieve created docs_id from redcap_docs_to_edocs
        $sql = "SELECT docs_id FROM redcap_docs_to_edocs WHERE doc_id = ? ORDER BY docs_id DESC LIMIT 1";
        $result = $this->query($sql, [$edoc_id]);
        $row = $result ? $result->fetch_assoc() : null;
        if (!$row || empty($row['docs_id'])) {
            return [
                'success' => false,
                'error' => 'Could not locate File Repository entry for the uploaded file.'
            ];
        }
        $docs_id = (int)$row['docs_id'];

        // Ensure file is also in redcap_docs_attachments so it is served on public surveys
        // even if general public file sharing is disabled at the system level
        $this->query("REPLACE INTO redcap_docs_attachments (docs_id) VALUES (?)", [$docs_id]);

        // Generate public link using REDCap FileRepository framework
        $publicLink = FileRepository::getPublicLink($docs_id, $project_id);
        if (!$publicLink) {
            return [
                'success' => false,
                'error' => 'Failed to generate public access URL for uploaded background image.'
            ];
        }

        // Append passthru to stream raw image bytes directly for CSS background-image
        $docHash = Files::docIdHash($edoc_id, Project::getProjectSalt($project_id));
        $imageUrl = $publicLink . '&__passthru=' . urlencode('DataEntry/image_view.php') . '&doc_id_hash=' . $docHash . '&id=' . $edoc_id;

        return [
            'success' => true,
            'url' => $imageUrl,
            'filename' => $origName,
            'edoc_id' => $edoc_id,
            'docs_id' => $docs_id
        ];
    }
}
