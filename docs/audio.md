# Ajouter les enregistrements audio natifs

L'app ne simule jamais une prononciation : tant qu'un fichier manque, elle affiche « Audio natif pas encore enregistré » et renvoie vers la note de prononciation.

## Où déposer les fichiers

```
public/audio/
  01-salutations/
    salutations-01.mp3        ← version normale
    salutations-01-slow.mp3   ← version lente
    …
  02-au-marche/
  03-se-presenter/
  glossaire/
    v-a.mp3                   ← exemple prononcé de la fiche « v-a »
    …
```

- Le dossier porte l'`id` de la leçon, le fichier porte l'`id` de la phrase (`src/data/lessons/*.ts`).
- Version lente : même nom suivi de `-slow`.
- Glossaire : un fichier par fiche, nommé d'après son `id` (`src/data/soundCards.ts`), qui prononce l'exemple de la fiche.

La liste exacte des fichiers attendus et encore manquants, avec la phrase à enregistrer :

```
npm run check:wolof -- --audio
```

Le même contrôle signale aussi les fichiers vides et les fichiers « orphelins » (nom mal orthographié, phrase supprimée).

## Enregistrement

- **Locuteur natif** du wolof de Dakar, une seule voix par leçon si possible.
- **Version lente** : enregistrée par le locuteur, articulée lentement mais naturellement. Ne pas ralentir la version normale au logiciel. Si la version lente manque, l'app lit la version normale à 75 % de sa vitesse et le signale.
- Format : MP3 mono, 44,1 kHz, 96 à 128 kbit/s. Environ 0,3 s de silence au début et à la fin, volume normalisé (pas de saturation).
- Une phrase par fichier, exactement le texte `wolof` de la phrase : si le locuteur préfère une autre formulation, corriger d'abord la phrase (et la faire valider), puis enregistrer.

## Vérifier

1. `npm run check:wolof` : le compteur « Audio natif » augmente, aucun fichier orphelin.
2. Lancer l'app : les boutons « Lecture normale » / « Lecture lente » apparaissent pour les phrases enregistrées ; la comparaison de la phase 3 rejoue le modèle puis ta voix.
