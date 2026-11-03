# Linux Incident Arena
Developer: Hamdy Abou El Anein — info@software-coders.ch
Licence du code pédagogique : GPL-3.0-only.

Ce laboratoire démarre un **vrai noyau Linux** et Alpine Linux 3.22.7 x86 dans v86. Le shell est BusyBox ash. Ce n'est pas une simulation des commandes en JavaScript.

## Fonctionnement
Le bouton Démarrer télécharge environ 14 Mo. La machine dispose de 128 Mio de mémoire émulée. Aucun disque de l'utilisateur, aucun relais réseau, aucun secret et aucun serveur distant de calcul ne sont attachés. Le serveur HTTP de l'exercice écoute uniquement sur le loopback du Linux émulé. Le score reste en mémoire dans la page, n'est ni certifié ni envoyé à un classement. Recommencer, Arrêter et le rechargement effacent la session. L'onglet masqué met en pause une session déjà démarrée.

Les quatre exercices vérifient l'état réel des fichiers, un résultat HTTP local, une réponse tirée des logs et l'espace libre d'un vrai volume tmpfs. Les indices et les solutions sont accessibles sans inscription. Les exercices sont indépendants : leur sélection remet leurs fichiers pédagogiques à zéro.

## Sources, versions et licences
- Code source et scripts de construction : [dépôt Software-Coders](https://github.com/hamdyaea/software-coders-ch), dossier `arena/guest` et `scripts/build-arena.py`. Voir aussi la branche de publication `publish/cloudflare-pages-20261103`.
- Les entrées sont verrouillées par URL et SHA-256/SHA-512 dans `arena/inputs.lock.json`. Le manifeste public contient les empreintes de chaque fichier exécuté.
- Alpine Linux : [sources des paquets v3.22](https://gitlab.alpinelinux.org/alpine/aports/-/tree/3.22-stable), [téléchargements officiels](https://dl-cdn.alpinelinux.org/alpine/v3.22/releases/x86/). L'inventaire exact des paquets et licences est disponible dans [packages.json](packages.json).
- Le noyau Linux et les composants Alpine sont ceux des entrées vérifiées du projet Daylight. Les archives des sources correspondantes conservées pour cette version sont disponibles dans la [publication des sources du runtime](https://github.com/hamdyaea/Daylight-GNU-Linux/releases/tag/web-preview-runtime-20261103). Elles incluent les sources du noyau et de BusyBox ; busybox-extras utilise la même version de BusyBox 1.37.0-r20.
- Émulateur [v86](https://github.com/copy/v86), version 0.5.473 : [licence BSD-2-Clause](licenses/V86-LICENSE.txt).
- Terminal [xterm.js](https://github.com/xtermjs/xterm.js), version 6.0.0, addon-fit 0.11.0 : [licence MIT](licenses/XTERM-LICENSE.txt), [licence de l'extension](licenses/FIT-LICENSE.txt).
- SeaBIOS / VGA BIOS : versions et empreintes identiques aux entrées Daylight ; licences et sources disponibles dans l'archive de sources ci-dessus.
- [Licence du laboratoire](licenses/ARENA-LICENSE.txt).

## Reconstruction
Sur Linux, en utilisateur normal, avec Python 3, bubblewrap, bsdtar, cpio, gzip et bash :
```sh
python3 scripts/build-arena.py
python3 scripts/build-pages.py
```
Les téléchargements sont vérifiés. Le paquet busybox-extras est en plus vérifié par APK avec les clés du minirootfs officiel, sans autoriser de paquet non signé. L'installation s'exécute dans un espace utilisateur bubblewrap limité à la racine jetable ; aucun paquet n'est installé sur l'hôte. La construction utilise le réseau uniquement pour télécharger les entrées verrouillées.

Le runtime généré est versionné dans Git : Cloudflare Pages ne reconstruit pas Linux à chaque déploiement. Aucun fichier n'atteint 16 Mio. Les pages sont statiques, sans Pages Functions et sans dépendance au Raspberry Pi.

## Vérifications
`tests/arena-boot.mjs` vérifie les quatre incidents dans le vrai système (avant et après réparation). `tests/arena-browser.cjs` vérifie le démarrage volontaire, le clavier dans le terminal, les validations, les indices, l'arrêt et les mises en page. Dépendances de test : v86 et Playwright/Chromium. Les chemins des outils peuvent être configurés avec ARENA_V86_MODULE, ARENA_PLAYWRIGHT et ARENA_BROWSER.
