---
title: "Bêta 8 : incompatibilité et alertes floutées"
description: >-
  Le rendu des bâtiments suivis se fait désormais en local : les clients bêta 7
  sont incompatibles avec le serveur public. Les alertes Discord sont floutées.
publishedAt: 2026-07-20
author: phinner
topic: NoHorny
topicVersion: "4"
hero: /blog/nohorny-admin-overview-dark.webp
releases:
  - xpdustry/nohorny@v4.0.0-beta.8
---

En ce lundi matin, je te présente la **bêta 8** du plugin Mindustry NoHorny.

> [!WARNING] Rupture de compatibilité
> Comme je te l’ai dit la semaine dernière, cette version rend l’instance publique du serveur NoHorny
> incompatible avec les versions précédentes. Mets ton fichier jar NoHorny à jour vers la bêta 8,
> sauf si tu héberges ton propre serveur NoHorny.

- **Le rendu des bâtiments suivis se fait en local**, puis les images sont envoyées au serveur. Avant, une
  représentation binaire maison était envoyée au serveur, qui se chargeait du rendu. Ça me simplifie beaucoup
  l’architecture. Désolé pour le dérangement.
- **Les alertes Discord sont maintenant floutées**, grâce aux composants v2 de Discord.
- **Un bon paquet de bugs corrigés.**

<!-- ::post-image src="/blog/nohorny-discord-alert.webp" alt="Une alerte Discord de NoHorny avec l’auteur, les coordonnées, le verdict et le niveau de confiance, ainsi que l’image générée masquée par un spoiler" width="799" height="741" caption="L’alerte floutée, grâce aux composants v2 de Discord." -->

J’ai aussi posé les bases des dernières bêtas.
L’authentification intégrée et un panneau d’administration arrivent très bientôt. Bon, au boulot.
