---
title: "Bêta 3 : regroupement incrémental"
description: >-
  Comment NoHorny est passé du balayage de toute la carte dans un thread en
  arrière-plan à un algorithme de regroupement incrémental synchrone.
publishedAt: 2026-04-23
author: phinner
topic: NoHorny
topicVersion: "4"
releases:
  - xpdustry/nohorny@v4.0.0-beta.3
---

Un nouveau jour, une nouvelle version du plugin Mindustry NoHorny. Cette fois, c’est la **bêta 3**.
La grande amélioration de cette version, c’est l’algorithme de regroupement.

- **En v3**, je parcourais toute la carte à chaque changement, dans un thread en arrière-plan.
- **En v4 b1 et b2**, j’ai limité le balayage à une petite zone autour du bâtiment
  modifié. Les performances étant devenues prévisibles, plus besoin d’un thread en arrière-plan.
  Mais avec de grands groupes de canevas, au-delà de **20 blocs sur 20**, la précision
  baissait parce que les images obtenues étaient rognées.
- **En v4 b3**, j’ai étalé le regroupement sur plusieurs ticks, ce qui m’a permis
  d’agrandir nettement la zone : **400 blocs sur 400**.

Grâce à cette précision accrue, le modèle local du serveur NoHorny risque moins de produire des faux
positifs sur les grandes images formées de canevas.

Bon, maintenant que c’est réglé, je compte améliorer le suivi et la supervision pour la bêta 4. Je pense surtout
aux personnes qui préfèrent recevoir une alerte quand une construction NSFW est détectée,
plutôt que de bannir automatiquement les joueurs.

Pour ça, je vais soit ajouter une option côté client pour configurer un webhook Discord qui t’envoie
l’image suspecte, soit intégrer cette fonction directement au serveur NoHorny.
