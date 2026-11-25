# Ajouter un thème ou des phrases

Tout le wolof de l'app passe par `npm run check:wolof`, lancé automatiquement avant chaque `npm run build` : une erreur d'orthographe ou d'identifiant bloque le build.

## 1. Créer le thème

```
npm run new:lesson -- 04 transports "Transports"
npm run new:lesson -- 05 vie-quotidienne "Vie quotidienne" --prefix=quotidien
```

Cela crée `src/data/lessons/04-transports.ts` (vide, `published: false`) et `public/audio/04-transports/`. Le fichier est chargé automatiquement : aucune liste à tenir à jour. Le script refuse un numéro, un identifiant ou un préfixe déjà pris.

Un thème non publié est invisible dans l'app mais déjà vérifié : on peut le remplir petit à petit sans casser le build.

## 2. Ajouter des phrases

Le modèle de phrase est en commentaire en haut du fichier créé. Règles :

| Élément | Format | Exemple |
|---|---|---|
| Leçon (fichier, dossier audio) | `NN-slug` | `04-transports` |
| Ordre | le numéro `NN` | `4` |
| Phrase | `<préfixe>-NN` | `transports-01` |
| Audio | `/audio/<leçon>/<phrase>.mp3` et `-slow.mp3` | via `audioFor(ID, 'transports-01')` |

- Toute phrase nouvelle est en `review: DRAFT` jusqu'à sa relecture par un locuteur natif.
- Ne pas copier une phrase existante d'un autre thème : le contrôle le signale ; la révision espacée la fera revenir de toute façon. Si la répétition est voulue (même phrase, autre contexte), la déclarer avec `duplicateOf: '<id de l'original>'` : le contrôle l'accepte et vérifie que les deux textes sont bien identiques.
- L'exercice d'assemblage (`assembly.steps`) ne peut citer que des phrases de la même leçon, 6 au maximum. L'app ne le propose que lorsque chacune de ses phrases a déjà été rencontrée (présentée dans la session ou travaillée avant) ; les phrases de l'assemblage encore inédites sont présentées en priorité, sinon l'exercice est reporté à une session suivante.

## 3. Identifiants stables

L'identifiant d'une phrase est la clé de la progression des apprenants (localStorage) et du nom de ses fichiers audio. Une fois validé, il est **figé** dans `src/data/lessons/phrase-ids.lock.json` :

```
npm run check:wolof -- --update-ids
```

Ensuite, le contrôle signale :

- **erreur** : un identifiant figé a disparu (renommé ou supprimé) ;
- **erreur** : un identifiant retiré est réutilisé ;
- **avertissement** : le texte d'une phrase figée a changé (vérifier l'audio et la relecture), ou une phrase a changé de leçon ;
- **avertissement** : une nouvelle phrase n'est pas encore figée.

Pour corriger une phrase : garder son identifiant, modifier le texte, puis `--update-ids`. Pour la remplacer par une autre : nouvel identifiant (numéro suivant). Pour abandonner définitivement une phrase supprimée :

```
npm run check:wolof -- --retire=transports-03
```

Un identifiant retiré n'est jamais réutilisable.

## 4. Publier

Quand le thème compte au moins 6 phrases (de quoi remplir une session de 30 min) et un résumé : `published: true`. Le contrôle refuse une leçon publiée incomplète.

## Récapitulatif

1. `npm run new:lesson -- NN slug "Titre"`
2. Rédiger les phrases (`DRAFT`) → `npm run check:wolof`
3. Relecture native → `review: { status: 'reviewed' }`
4. `npm run check:wolof -- --update-ids`
5. Enregistrements → `npm run check:wolof -- --audio` (voir `docs/audio.md`)
6. `published: true` → `npm run build`
