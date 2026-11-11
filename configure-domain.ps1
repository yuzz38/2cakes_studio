param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl
)

# Run only after the real publishing URL is known. This script never uploads files.
$ErrorActionPreference = 'Stop'
$parsedSiteUrl = $null
if (-not [Uri]::TryCreate($SiteUrl, [UriKind]::Absolute, [ref]$parsedSiteUrl)) {
    throw 'Provide the full HTTPS site URL, including the repository path for GitHub Pages.'
}
if ($parsedSiteUrl.Scheme -ne 'https' -or $parsedSiteUrl.Host.EndsWith('.example') -or
    $parsedSiteUrl.Query -or $parsedSiteUrl.Fragment -or $parsedSiteUrl.UserInfo) {
    throw 'Use your real HTTPS URL without query parameters, fragment or credentials.'
}
if ($parsedSiteUrl.AbsolutePath.EndsWith('.html')) {
    throw 'Use the site directory URL, not an index.html URL.'
}

$siteBaseUrl = $parsedSiteUrl.AbsoluteUri.TrimEnd('/') + '/'
$siteRootPath = [IO.Path]::GetFullPath($PSScriptRoot)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$pageNames = @('index.html', 'menu.html', 'privacy.html')

foreach ($pageName in $pageNames) {
    $pagePath = Join-Path $siteRootPath $pageName
    $pageText = [IO.File]::ReadAllText($pagePath)
    $canonicalUrl = if ($pageName -eq 'index.html') { $siteBaseUrl } else { $siteBaseUrl + $pageName }
    $escapedUrl = [System.Security.SecurityElement]::Escape($canonicalUrl)
    $canonicalTag = '<link rel="canonical" href="' + $escapedUrl + '">'
    $canonicalPattern = '<link\s+rel="canonical"[^>]*>'
    if ([regex]::IsMatch($pageText, $canonicalPattern)) {
        $pageText = [regex]::Replace($pageText, $canonicalPattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $canonicalTag })
    } else {
        $pageText = $pageText.Replace('</head>', '  ' + $canonicalTag + "`n</head>")
    }
    $pageText = $pageText.Replace('<!-- SITE_CANONICAL -->', '')
    $pageText = [regex]::Replace($pageText, '<!-- Public URL is not supplied\.[\s\S]*?-->', '')
    if ($pageName -eq 'index.html') {
        $imageTag = '<meta property="og:image" content="' + [System.Security.SecurityElement]::Escape($siteBaseUrl + 'share.jpg') + '">'
        $pageText = [regex]::Replace($pageText, '<meta property="og:image"[^>]*>', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $imageTag })
        $ogUrlTag = '<meta property="og:url" content="' + $escapedUrl + '">'
        if ($pageText -match '<meta property="og:url"') {
            $pageText = [regex]::Replace($pageText, '<meta property="og:url"[^>]*>', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $ogUrlTag })
        } else {
            $pageText = $pageText.Replace('</head>', '  ' + $ogUrlTag + "`n</head>")
        }
        $ldMatch = [regex]::Match($pageText, '(?s)<script type="application/ld\+json">(.*?)</script>')
        if ($ldMatch.Success) {
            $entity = $ldMatch.Groups[1].Value | ConvertFrom-Json
            $entity | Add-Member -NotePropertyName url -NotePropertyValue $siteBaseUrl -Force
            $entity | Add-Member -NotePropertyName image -NotePropertyValue ($siteBaseUrl + 'share.jpg') -Force
            $entityJson = $entity | ConvertTo-Json -Depth 100
            $replacement = '<script type="application/ld+json">' + "`n" + $entityJson + "`n</script>"
            $pageText = $pageText.Replace($ldMatch.Value, $replacement)
        }
    }
    [IO.File]::WriteAllText($pagePath, $pageText, $utf8NoBom)
}

$xmlBaseUrl = [System.Security.SecurityElement]::Escape($siteBaseUrl)
$sitemapText = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>$xmlBaseUrl</loc></url>
  <url><loc>${xmlBaseUrl}menu.html</loc></url>
</urlset>
"@
[IO.File]::WriteAllText((Join-Path $siteRootPath 'sitemap.xml'), $sitemapText, $utf8NoBom)
$robotsText = "User-agent: *`nAllow: /`n`nSitemap: ${siteBaseUrl}sitemap.xml`n"
[IO.File]::WriteAllText((Join-Path $siteRootPath 'robots.txt'), $robotsText, $utf8NoBom)

foreach ($llmName in @('llms.txt', 'llms-full.txt')) {
    $llmPath = Join-Path $siteRootPath $llmName
    $llmText = [IO.File]::ReadAllText($llmPath)
    $llmText = [regex]::Replace($llmText, '(?m)^- .*2cakes\.example.*$', '- Website: ' + $siteBaseUrl)
    $llmText = [regex]::Replace($llmText, '(?m)^- Website: .*$', '- Website: ' + $siteBaseUrl)
    foreach ($targetName in @('index.html', 'menu.html', 'privacy.html', 'llms-full.txt')) {
        $targetPattern = '\]\((?:https://[^)\s]*/)?' + [regex]::Escape($targetName) + '\)'
        $newLinkEnding = '](' + $siteBaseUrl + $targetName + ')'
        $llmText = [regex]::Replace($llmText, $targetPattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newLinkEnding })
    }
    [IO.File]::WriteAllText($llmPath, $llmText, $utf8NoBom)
}
Write-Output ('Configured local website files for ' + $siteBaseUrl)
Write-Output 'Upload the contents of this folder to your static hosting. Nothing was published by this script.'
