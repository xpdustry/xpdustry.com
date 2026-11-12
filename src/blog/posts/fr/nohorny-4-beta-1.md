---
title: "NoHorny v4 bêta 1 est là !"
description: >-
  Plus besoin de configurer manuellement un service externe de détection NSFW.
  Un serveur hébergé est fourni par défaut et le suivi est quasi instantané.
publishedAt: 2026-04-13
author: phinner
topic: NoHorny
topicVersion: "4"
releases:
  - xpdustry/nohorny@v4.0.0-beta.1
---

Bonne nouvelle, tout le monde : **NoHorny v4 bêta**, le plugin Mindustry, est disponible. Juste à temps pour Mindustry v8.

Cette bêta apporte de grosses améliorations :

- **Ça marche dès l’installation.** Plus besoin de configurer manuellement un service externe de détection NSFW. Une instance publique
  du serveur NoHorny est fournie par défaut. Tu peux aussi héberger ton propre serveur.
- **L’algorithme de suivi a été nettement amélioré.** Les écrans et les canevas sont désormais traités
  **presque instantanément**, au lieu de toutes les 5 secondes.
- **Réécrit en Java ☕**, pour gagner en compatibilité et en efficacité.

À peine l’écran posé, je suis banni :

<!-- ::start:post-video src="/blog/nohorny-showcase.mp4" webm="/blog/nohorny-showcase.webm" poster="/blog/nohorny-showcase-poster.webp" width="1550" height="911" caption="Je pose l’écran, je me fais bannir et l’image arrive sur Discord via le webhook." -->

Dans cette capture vidéo, un joueur pose un écran avec une image NSFW. NoHorny le supprime et bannit le joueur.
Une alerte arrive sur Discord via le webhook avec le nom du joueur et les coordonnées.
[Télécharge la vidéo](/blog/nohorny-showcase.mp4) si ton navigateur ne peut pas la lire.

<!-- ::end:post-video -->

Il me reste quelques détails à peaufiner avant la sortie de la v4, surtout les logs et
le cache, mais cette bêta est déjà tout à fait utilisable. Tes retours sur cette version
me seraient bien utiles.
