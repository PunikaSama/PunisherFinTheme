# PunisherFinTheme

![PunisherFinTheme banner](PunisherFinThemeBanner.png)

PunisherFinTheme brings selectable, accent-aware designs to Jellyfin 12 Web while preserving Jellyfin's native behavior. The original PunisherFin design remains unchanged and is still the default.

## Features

- Modern home and library layouts for desktop and mobile
- Selectable PunisherFin and Cinema Deck designs with full homepage previews in settings
- One global accent color shared by every design
- Wide artwork and optional muted video previews on hover or TV focus
- Responsive episode lists and redesigned playback controls
- Accent-color integration for the InPlayerEpisodePreview plugin
- Rotating backgrounds from a selectable media library
- Adjustable background appearance, transitions, and accent color
- Live background-effects preview using a random backdrop from the selected library
- Optional PunisherFin header and browser-tab branding, enabled by default

## Requirements

- Jellyfin Server 12.0.x
- [File Transformation 3.0.0.0](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation/releases/tag/3.0.0.0)

## Installation

Add this repository URL under **Dashboard → Plugins → Repositories**:

```text
https://raw.githubusercontent.com/PunikaSama/PunisherFinTheme/main/manifest.json
```

Install PunisherFinTheme and restart Jellyfin completely. Configure the theme under the plugin settings.

## Clients

The theme works in Jellyfin Web and clients that embed Jellyfin Web. Fully native client interfaces are not modified.

## License

PunisherFinTheme is licensed under the MIT License. Copyright © 2026 PunisherSama.
