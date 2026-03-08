#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

if (process.platform !== 'win32') {
  console.error('This generator currently supports Windows only.');
  process.exit(1);
}

const iconsDir = path.join(__dirname, 'icons');
const icoPath = path.join(iconsDir, 'favicon.ico');

const psScript = `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$icoPath = '${icoPath.replace(/\\/g, '\\\\')}'
$iconsDir = '${iconsDir.replace(/\\/g, '\\\\')}'

$stream = [System.IO.File]::OpenRead($icoPath)
$decoder = New-Object System.Windows.Media.Imaging.IconBitmapDecoder($stream, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
$frame = $decoder.Frames | Sort-Object PixelWidth -Descending | Select-Object -First 1

$pngEncoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$pngEncoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($frame))
$memory = New-Object System.IO.MemoryStream
$pngEncoder.Save($memory)
$memory.Position = 0
$source = [System.Drawing.Image]::FromStream($memory)

# ── บันทึก PNG พร้อมพื้นหลังสีขาว (ไม่โปร่งใส) ──────────────────────
function Save-ResizedPng($bitmap, $size, $outPath, $bgR=255, $bgG=255, $bgB=255) {
  $target = New-Object System.Drawing.Bitmap($size, $size)
  $target.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  # พื้นขาว — ทำให้ไอคอนมองเห็นได้บนพื้นหลังมืด
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB))
  $graphics.DrawImage($bitmap, 0, 0, $size, $size)
  $graphics.Dispose()
  $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $target.Dispose()
  $item = Get-Item $outPath
  Write-Output ('OK ' + $item.Name + ' ' + $size + 'x' + $size + ' ' + $item.Length + ' bytes')
}

# ── บันทึก PNG แบบ Maskable (ไอคอนย่อ 70% + พื้นหลังชมพู) ─────────────
function Save-MaskablePng($bitmap, $size, $outPath) {
  $target = New-Object System.Drawing.Bitmap($size, $size)
  $target.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($target)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  # พื้นชมพู (safe zone สำหรับ maskable icon)
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 255, 240, 245))
  # วาดไอคอนขนาด 70% ตรงกลาง (padding 15%)
  $pad = [int]($size * 0.15)
  $inner = $size - $pad * 2
  $graphics.DrawImage($bitmap, $pad, $pad, $inner, $inner)
  $graphics.Dispose()
  $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $target.Dispose()
  $item = Get-Item $outPath
  Write-Output ('OK (maskable) ' + $item.Name + ' ' + $size + 'x' + $size + ' ' + $item.Length + ' bytes')
}

# พื้นขาว สำหรับไอคอนทั่วไป
Save-ResizedPng $source 192 (Join-Path $iconsDir 'favicon-192.png')
Save-ResizedPng $source 512 (Join-Path $iconsDir 'favicon-512.png')
Save-ResizedPng $source 180 (Join-Path $iconsDir 'favicon-touch.png')
# Maskable (ชมพู+padding) สำหรับ Android home screen
Save-MaskablePng $source 512 (Join-Path $iconsDir 'favicon-maskable.png')

$source.Dispose()
$memory.Dispose()
$stream.Close()
`

const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
  stdio: 'inherit'
});

if (result.status !== 0) process.exit(result.status || 1);

console.log('\nFAN icons now use favicon.ico as the source (white background + maskable).');
