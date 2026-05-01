$content = Get-Content index.html -Raw

$old = @"
<div class="dropdown-item" onclick="setFontSize('small')">FONT SIZE SMALL</div>
                            <div class="dropdown-item" onclick="setFontSize('medium')">FONT SIZE MEDIUM</div>
                            <div class="dropdown-item" onclick="setFontSize('large')">FONT SIZE LARGE</div>
                            <div class="dropdown-item" onclick="toggleRobotInfo()">HIDE ROBOT INFO</div>
                            <div class="dropdown-item" onclick="toggleLcdBrightness()">LCD BRIGHT: 100%</div>
                            <div class="dropdown-item" onclick="resetLayout()">RESET LAYOUT</div>
"@

$new = @"
<div class="dropdown-item" onclick="displaySetupChangeFont()">CHANGE FONT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeButton()">CHANGE BUTTON<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupInitializeLayout()">INITIALIZE LAYOUT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeWindowPattern()">CHANGE WINDOW PATTERN<br><span style="font-size:5px;color:#666;">Operation</span></div>
"@

$content = $content.Replace($old, $new)
$content | Set-Content index.html
Write-Host "OK"
