# BNT Enterprise v8

## Local launch

PowerShell:

Set-ExecutionPolicy -Scope Process Bypass

.\start.ps1


Main prototype:

http://localhost:8080


Digital Twin:

http://localhost:8080/digital-twin


## Google Maps

Local key:

config.local.json

This file is excluded from Git.


## Vercel

Environment variables:

GOOGLE_MAPS_API_KEY

GOOGLE_MAPS_MAP_ID


Production Digital Twin route:

/digital-twin


## Coordinates

Center:

41.6438169, 41.6605911


## Structure

Existing Report Studio remains in the repository.

New Digital Twin is added as a separate module
and does not overwrite the legacy reporting functionality.
