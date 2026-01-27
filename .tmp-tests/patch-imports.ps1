$root = Join-Path (Get-Location) '.tmp-server'
$patterns = @(
  'from\s+["''](\.?\.\/[^"'']+)["'']',
  'from\s+["''](\.\.\/[^"'']+)["'']',
  'import\s+["''](\.?\.\/[^"'']+)["'']',
  'import\s+["''](\.\.\/[^"'']+)["'']',
  'import\(\s*["''](\.?\.\/[^"'']+)["'']\s*\)',
  'import\(\s*["''](\.\.\/[^"'']+)["'']\s*\)',
  'export\s+\*\s+from\s+["''](\.?\.\/[^"'']+)["'']',
  'export\s+\*\s+from\s+["''](\.\.\/[^"'']+)["'']',
  'export\s+\{[^}]*\}\s+from\s+["''](\.?\.\/[^"'']+)["'']',
  'export\s+\{[^}]*\}\s+from\s+["''](\.\.\/[^"'']+)["'']'
)

Get-ChildItem -Recurse -Path $root -Filter *.js | ForEach-Object {
  $content = Get-Content -Raw $_.FullName
  $orig = $content
  foreach ($pat in $patterns) {
    $content = [regex]::Replace($content, $pat, {
      param($m)
      $p = $m.Groups[1].Value
      if ([System.IO.Path]::HasExtension($p)) { return $m.Value }
      return $m.Value.Replace($p, "$p.js")
    })
  }
  if ($content -ne $orig) {
    Set-Content -Path $_.FullName -Value $content
  }
}
