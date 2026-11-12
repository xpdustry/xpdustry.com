---
title: "Bêta 7 : des bannissements automatiques fiables"
description: >-
  Deux améliorations de la précision qui, ensemble, rendent enfin fiables
  les bannissements automatiques sur la base d’un verdict NSFW.
publishedAt: 2026-05-22
author: phinner
topic: NoHorny
topicVersion: "4"
releases:
  - xpdustry/nohorny@v4.0.0-beta.7
---

La semaine se termine, c’est donc l’heure d’une nouvelle version du plugin Mindustry NoHorny. Voici la **bêta 7**.

## Une meilleure précision

- **Les outils de suivi attendent la fin de la construction.** Ils estiment le temps nécessaire pour construire un canevas
  ou un schéma logique et attendent que la construction soit terminée. Cette petite astuce réduit nettement
  le nombre de faux positifs et de requêtes, surtout pour les canevas. Merci à
  [Lett](https://github.com/BnDLett) du
  [réseau MDN](https://github.com/mindustry-ddns-net) pour son aide.
- **Le modèle public a été affiné.** J’ai fini d’ajuster le modèle utilisé par le serveur public NoHorny.
  Les images ambiguës ne seront plus classées `NSFW`, mais `WARN`.

> [!NOTE] En bref
> Avec tous ces changements, les bannissements automatiques sur la base d’un verdict `NSFW` sont enfin fiables.

## Et le reste

- Le serveur NoHorny est maintenant publié dans le registre de paquets GitHub. Plus besoin
  de le compiler en local.
- NoHorny peut désormais être configuré par programmation.
- Tu peux choisir un nom d’utilisateur pour le webhook Discord.
- Plein d’améliorations générales et de corrections de bugs. Consulte la liste des changements pour les détails.
