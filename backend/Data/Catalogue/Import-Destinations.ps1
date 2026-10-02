# Run from the repository root. Adds missing catalogue entries without replacing curated content.
$ErrorActionPreference = 'Stop'
$config = Get-Content (Join-Path $PSScriptRoot '../../appsettings.json') -Raw | ConvertFrom-Json
$parts = @{}
$config.ConnectionStrings.DefaultConnection.Split(';') | ForEach-Object { $pair=$_.Split('=',2); if($pair.Count -eq 2) { $parts[$pair[0]]=$pair[1] } }
function Quote-Sql([string]$value) { return "'" + $value.Replace("'", "''") + "'" }
$rows = Get-Content (Join-Path $PSScriptRoot 'destinations.json') -Raw | ConvertFrom-Json
$statements = @('BEGIN;')
foreach($row in $rows) {
 $name=Quote-Sql $row.name; $slug=Quote-Sql $row.slug; $district=Quote-Sql $row.district; $province=Quote-Sql $row.province
 $short=Quote-Sql $row.shortDescription
 $description=Quote-Sql ($row.shortDescription + "`n`nMake this stop part of your Sri Lanka journey. Explore the tours below or tell us your travel dates, interests and preferred pace so that the route can be planned around you.")
 $photo=Quote-Sql ('/images/destinations/'+$row.slug+'.jpg')
 $statements += @"
INSERT INTO "Destinations" ("Name","Slug","District","Province","ShortDescription","Description","ImageUrl","IsFeatured","IsActive","CreatedAt")
SELECT $name,$slug,$district,$province,$short,$description,$photo,false,true,NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Destinations" WHERE "Slug"=$slug);
UPDATE "Destinations" SET "ImageUrl"=$photo WHERE "Slug"=$slug AND ("ImageUrl" IS NULL OR "ImageUrl"='');
UPDATE "Destinations" SET "ShortDescription"=$short,"Description"=$description WHERE "Slug"=$slug AND "Description" LIKE '%Development demo content%';
"@
}
$statements += 'COMMIT;'
$previousPassword=$env:PGPASSWORD
try {
 $env:PGPASSWORD=$parts['Password']
 ($statements -join "`n") | & psql -h $parts['Host'] -p $parts['Port'] -U $parts['Username'] -d $parts['Database'] -v ON_ERROR_STOP=1
 if($LASTEXITCODE -ne 0) { throw 'Catalogue import failed.' }
} finally { $env:PGPASSWORD=$previousPassword }
