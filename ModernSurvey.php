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
        if ($this->isSurveySettingsPage())
            $this->injectSurveySettingsAssets($project_id);
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

    private function injectSurveySettingsAssets($project_id = null)
    {
        global $user_rights;

        // 1. Load theme metadata from themes.json and read corresponding standalone CSS files
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

        // 2. Check File Repository availability
        $fileRepoEnabled = ($GLOBALS['file_repository_enabled'] == '1');
        if (isset($user_rights['file_repository']) && $user_rights['file_repository'] == '0')
            $fileRepoEnabled = false;

        // 3. Initialize JavaScript Module Object (REDCap Native JSMO AJAX)
        $this->initializeJavascriptModuleObject();
        $jsObject = $this->getJavascriptModuleObjectName();
        $jsonData = json_encode($themes);

        // 4. Output stylesheet, themes data on JSMO, and main JavaScript
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

        // 1. Verify File Repository is enabled at the system level
        if ($GLOBALS['file_repository_enabled'] != '1') {
            return [
                'success' => false,
                'error' => 'REDCap File Repository is disabled on this server. Custom image uploads are unavailable.'
            ];
        }

        // 2. Verify user has File Repository permissions in this project
        if (isset($user_rights['file_repository']) && $user_rights['file_repository'] == '0') {
            return [
                'success' => false,
                'error' => 'You do not have permission to upload files to the File Repository in this project.'
            ];
        }

        // 4. Validate payload
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

        // 5. Extract and decode Base64 data URL
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

        // 6. Write to temporary file for content inspection and upload
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

        // 7. Store file in REDCap edocs storage
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

        // 8. Add file to REDCap File Repository
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
        $q = db_query($sql, [$edoc_id]);
        if (!$q || !db_num_rows($q)) {
            return [
                'success' => false,
                'error' => 'Could not locate File Repository entry for the uploaded file.'
            ];
        }
        $docs_id = db_result($q, 0);

        // Ensure file is also in redcap_docs_attachments so it is served on public surveys
        // even if general public file sharing is disabled at the system level
        db_query("REPLACE INTO redcap_docs_attachments (docs_id) VALUES (?)", [$docs_id]);

        // 9. Generate public link using REDCap FileRepository framework
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
