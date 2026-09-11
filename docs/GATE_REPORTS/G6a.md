# RAPPORT DE GATE — G6a Mécanisme OAuth, chiffrement d'appareil, récupération

Date : 2026-09-11 · Format imposé par `RUN-26_FOUNDER_CLAUDE_RUNBOOK`

---

## GATE

**G6a** — première moitié de G6, ouverte le 2026-09-09 sur validation des quatre points RED. Décision R2 du fondateur : le mécanisme d'abord, Google ensuite.

Condition de sortie de G6 (`RUN-42`) : **PKCE + `state`, échange côté serveur, scopes minimaux, purge à la déconnexion, aucun jeton ni corps brut dans les journaux.**

## STATUS

**PASSED sur les quatre conditions démontrables sans fournisseur réel.** La cinquième — l'échange côté serveur — est spécifiée et non implémentée : elle attend une décision d'hébergement (ADR-0019).

## EVIDENCE

| Condition de sortie           | Preuve                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Aucun jeton dans les journaux | `logging.test.ts` — 22 tests ; rédaction par nom de clé **et** par forme de valeur ; `no-console` en erreur               |
| PKCE + `state`                | `oauth.test.ts` — 31 tests, un contrôle négatif par mode d'échec de `docs/15`                                             |
| Scopes minimaux               | `oauth.test.ts` + `connection.test.ts` — deny by default dans le code **et** en base                                      |
| Purge à la déconnexion        | `connection.test.ts` — contrainte `connection_purged_when_closed` : une connexion fermée **ne peut pas** détenir de jeton |
| Échange côté serveur          | **Non implémenté.** ADR-0019 propose une Edge Function Supabase ; décision RED en attente                                 |
| Chiffrement des champs L3     | `crypto-web.test.ts` — interopérabilité serveur ↔ appareil vérifiée dans les deux sens                                    |
| Informer avant de collecter   | `recovery.test.ts` + `recuperation.test.tsx` — la collecte est refusée tant que le secret n'est pas créé **et** confirmé  |
| Chaîne complète               | `npm run ci` — **EXIT 0**, 422 tests (384 vitest, 38 jest)                                                                |

## CE QUE CETTE GATE DÉMONTRE VRAIMENT

**Les propriétés exigées par G6 ne dépendent d'aucun fournisseur.** PKCE, `state`, scopes et purge sont des propriétés du mécanisme. Les démontrer contre un fournisseur synthétique n'était pas un pis-aller : c'était la seule façon de les éprouver **avant** qu'un compte Google existe, qu'un compteur démarre, et qu'une donnée personnelle soit en jeu. Le jour où Google arrive, il n'apporte qu'une configuration.

**La purge a cessé d'être une promesse.** Un `update` qui passe une connexion à `DISCONNECTED` sans effacer les jetons est **refusé par la base**. Ce n'est pas une tâche de nettoyage qu'on espère voir passer.

**ADR-0008 a cessé de tenir par la forme du schéma.** Tant que seul le serveur savait déchiffrer, « aucune clé maître serveur » était une propriété de structure. L'appareil déchiffre désormais réellement ce que le serveur a scellé.

**La décision R4 du fondateur est devenue impossible à contourner.** Une contrainte interdit d'inscrire dans la liste blanche des scopes un scope contenant `full`, `readall`, `body`, `attachment`, `write`, `modify` ou `send` — y compris par un administrateur.

## CE QUE LES CONTRÔLES ONT TROUVÉ

**Le scan de secrets ne détectait pas `client_secret`.** Le souligné est un caractère de mot : il n'y avait aucune limite entre « client\_ » et « secret ». Défaut présent depuis G1, dans un contrôle qui n'avait **jamais été testé**. C'est le type d'identifiant qu'utilisent précisément PISTE et Google.

**`no-console` était un avertissement.** `eslint .` sort à 0 malgré les avertissements : la troisième preuve de `SEC-34` était déclarée sans rien empêcher.

**Un test approuvait réellement Légifrance en base.** Il prenait la source réelle comme exemple d'une source non vérifiée ; sa licence vérifiée, l'`update` a réussi. Le test de dérive registre ↔ base l'a rattrapé à la requête suivante.

**`crypto-web.ts` ramenait `node:crypto` dans le bundle** en important `crypto.ts` — le défaut du 2026-09-09, sur le point de se reproduire. C'est ce qui a motivé l'extraction de `crypto-envelope.ts`.

**Deux conditions bloquantes du registre n'étaient pas des chaînes** mais des paires clé/valeur : YAML avale un « : » suivi d'une espace. Présent depuis G5, la condition comptait pour une et se serait affichée « [object Object] ».

**Un `await` manquant sur `fireEvent`** laissait une portée `act()` ouverte qui faisait échouer les tests **suivants**, loin de la cause.

**L'en-tête affichait « RECUPERATION/INDEX ».** Invisible aux 422 tests, visible en trois secondes dans le navigateur. Le constat de G4 n'a pas vieilli.

## RISKS

1. **L'échange côté serveur n'existe pas.** C'est la seule condition de sortie de G6 non tenue, et elle attend une décision d'hébergement, pas du code.
2. **Trois implémentations du chiffrement à venir** (Node, web, appareil). Le risque de divergence augmente mécaniquement ; il n'est tenu que par le test d'interopérabilité croisée, qui devra couvrir les trois sens.
3. **PBKDF2 en JavaScript pur se comptera en secondes** sur un téléphone d'entrée de gamme. Une fois par déverrouillage, et l'écran devra annoncer l'attente plutôt que paraître figé.
4. **Le secret de récupération n'est encore stocké nulle part.** L'écran le produit et le fait confirmer ; sa persistance — `expo-secure-store`, Keychain et Keystore — relève de G6b.
5. **Aucune donnée réelle n'a transité.** Tout ce qui précède est prouvé sur du synthétique. C'est voulu, et cela reste une limite.
6. ~~Un choix de conception à confirmer~~ — **confirmé le 2026-09-11** : les « recovery codes » de `SEC-31` restent les segments d'**un seul** secret. Le risque d'oubli demeure, et se traitera par l'ergonomie de sauvegarde, jamais en affaiblissant la protection.

## OPEN DECISIONS

**ADR-0019**, `PROPOSED`, deux volets RED : l'exécution de l'échange OAuth, et la cryptographie sur appareil. G6b ne s'ouvre pas avant.

## ROLLBACK

Deux migrations (`20260909120000`, `20260911100000`). Rollback : `drop table identity.connection, identity.provider_scope;` puis `git reset --hard 422ce0e`.

**Aucun compte externe, aucun compteur démarré, aucune donnée personnelle.** C'est tout l'intérêt d'avoir séparé G6a de G6b.

## NEXT GATE

**G6b — le connecteur Google réel.** Création du projet Cloud, scopes minimaux, échange serveur, première connexion.

## CE QUE LE FONDATEUR DOIT JUGER

- **Sécurité** : la purge est refusée par la base, pas nettoyée après coup. Vérifiable en tentant une déconnexion sans effacer les jetons.
- **Confidentialité** : aucune donnée réelle, aucun compte externe.
- **Honnêteté du produit** : ouvrir `/recuperation`. Le produit vous dit ce que vous risquez **avant** de vous montrer le secret. Est-ce compréhensible, et est-ce supportable ?
- **Rollback** : deux tables, aucune donnée.
- **Ce qui vous revient** : les quatre points listés à la fin d'ADR-0019.
