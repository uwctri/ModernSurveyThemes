<?php

namespace UWMadison\ModernSurvey;

use ExternalModules\AbstractExternalModule;
use REDCap;
use Files;
use FileRepository;
use Project;
use finfo;

class ModernSurvey extends AbstractExternalModule
{
    private $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    public function redcap_every_page_top($project_id)
    {
        if ($this->isPage('Surveys/edit_info.php') || $this->isPage('Surveys/create_survey.php'))
            $this->injectSurveySettingsAssets($project_id);
    }

    public function redcap_survey_page_top($project_id, $record, $instrument)
    {
        $result = $this->query(
            "SELECT custom_css FROM redcap_surveys WHERE project_id = ? AND form_name = ? LIMIT 1",
            [$project_id, $instrument]
        );
        $row = $result ? $result->fetch_assoc() : null;
        $customCss = $row['custom_css'] ?? '';

        if (strpos($customCss, 'Modern Survey') === false)
            return;

        $fontsCssUrl = $this->getUrl('fonts/fonts.css');
        $clientCssUrl = $this->getUrl('css/survey_client.css');
        $criticalCss = '';
        if (preg_match('/(:root\s*\{[^}]+\})/s', $customCss, $rootMatches))
            $criticalCss .= $rootMatches[1] . "\n";
        if (preg_match('/(body\s*\{[^}]+\})/s', $customCss, $bodyMatches))
            $criticalCss .= $bodyMatches[1] . "\n";

        echo "<link rel='stylesheet' type='text/css' href='{$fontsCssUrl}'>\n";
        echo "<link rel='stylesheet' id='ms-client-styles' type='text/css' href='{$clientCssUrl}'>\n";
        echo "<style id='ms-fouc-guard'>
                {$criticalCss}
                html body #pagecontainer {
                    opacity: 0;
                    transition: opacity 0.75s linear;
                }
                body.modern-survey-ready #pagecontainer,
                #pagecontainer.modern-survey-ready {
                    opacity: 1;
                }
              </style>\n";
    }

    public function redcap_survey_page()
    {
        $clientJsUrl = $this->getUrl('survey_client.js');
        echo "<script type='text/javascript' src='{$clientJsUrl}'></script>\n";
    }

    public function redcap_module_ajax($action, $payload, $project_id)
    {
        if ($action === 'upload_bg_image')
            return $this->handleBackgroundUpload($payload, $project_id);
        return null;
    }

    private function injectSurveySettingsAssets()
    {
        // Load theme metadata from themes.json and read corresponding standalone CSS files
        $themesJsonPath = $this->getSafePath('themes.json');
        $themes = json_decode(file_get_contents($themesJsonPath), true);

        $fontsCssUrl = $this->getUrl('fonts/fonts.css');

        foreach ($themes as $id => &$theme) {
            $cssFile = $this->getSafePath($theme['file']);
            $cssContent = file_get_contents($cssFile);
            $theme['css'] = str_replace('../fonts/fonts.css', $fontsCssUrl, $cssContent);
        }

        // Check File Repository availability using framework user rights
        $fileRepoEnabled = ($GLOBALS['file_repository_enabled'] == '1');
        if ($fileRepoEnabled) {
            $rights = REDCap::getUserRights(USERID);
            if (isset($rights[USERID]['file_repository']) && $rights[USERID]['file_repository'] == '0')
                $fileRepoEnabled = false;
        }

        // Initialize JavaScript Module Object (REDCap Native JSMO AJAX)
        $this->initializeJavascriptModuleObject();
        $jsObject = $this->getJavascriptModuleObjectName();
        $jsonData = json_encode($themes);

        // Output stylesheet, themes data on JSMO, and main JavaScript
        $cssUrl = $this->getUrl('css/survey_settings.css');
        $jsUrl = $this->getUrl('survey_settings.js');

        echo "<link rel='stylesheet' type='text/css' href='{$fontsCssUrl}'>\n";
        echo "<link rel='stylesheet' type='text/css' href='{$cssUrl}'>\n";
        echo "<script type='text/javascript'>\n";
        echo "  {$jsObject}.themes = {$jsonData};\n";
        echo "  {$jsObject}.fontsCssUrl = '{$fontsCssUrl}';\n";
        echo "  {$jsObject}.fileRepoEnabled = " . ($fileRepoEnabled ? 'true' : 'false') . ";\n";
        echo "</script>\n";
        echo "<script type='text/javascript' src='{$jsUrl}'></script>\n";
    }

    private function handleBackgroundUpload($payload, $project_id)
    {
        // Verify File Repository is enabled at the system level
        if ($GLOBALS['file_repository_enabled'] != '1') {
            return [
                'success' => false,
                'error' => 'REDCap File Repository is disabled on this server. Custom image uploads are unavailable.'
            ];
        }

        // Verify user has File Repository permissions in this project
        $rights = REDCap::getUserRights(USERID);
        if (isset($rights[USERID]['file_repository']) && $rights[USERID]['file_repository'] == '0') {
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
        if (!in_array($ext, $this->allowedExts, true)) {
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
        $maxBytes = maxUploadSizeFileRepository() * 1024 * 1024; // Convert MB to bytes
        if ($fileSize > $maxBytes) {
            return [
                'success' => false,
                'error' => 'Image file exceeds maximum allowable upload size.'
            ];
        }

        // Write to temporary file for content inspection and upload
        $tempFile = tempnam(sys_get_temp_dir(), 'ms_bg_');
        if (!$tempFile || file_put_contents($tempFile, $binaryData) === false) {
            if ($tempFile && file_exists($tempFile))
                @unlink($tempFile);
            return [
                'success' => false,
                'error' => 'Failed to write temporary upload file.'
            ];
        }

        // Validate actual MIME type via finfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($tempFile);

        if (!in_array($detectedMime, $this->allowedMimes, true)) {
            @unlink($tempFile);
            return [
                'success' => false,
                'error' => 'Uploaded file is not a supported image type: ' . $detectedMime
            ];
        }

        // Store file in REDCap edocs storage via REDCap::storeFile
        $edoc_id = REDCap::storeFile($tempFile, $project_id, $origName);
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
