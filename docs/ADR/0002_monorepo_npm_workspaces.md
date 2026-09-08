# ADR-0002 — Monorepo npm workspaces

- **Statut** : ACCEPTED
- **Date** : 2026-09-08
- **Décision d'origine** : D6
- **Approuvé par** : Fondateur
- **Réversible** : oui (migration vers pnpm possible sans redécoupage)

## Context

`DECISION_LEDGER_COMPILED.md` pose « Monorepo TypeScript » et `architecture/03_CORE_MODULE_ARCHITECTURE.md` en impose l'arborescence, tandis que `docs/02_DECISIONS_LOCKED` autorise une application unique « si le dépôt réel ne justifie pas un monorepo ». Le monorepo ne figure pas dans les `hard_invariants` du manifeste. Aucun gestionnaire de paquets n'était nommé.

Environnement constaté : npm 11.19.0 présent ; pnpm et yarn absents. Contrainte technique : Metro, le bundler Expo, résout mal les `node_modules` symlinkés ; pnpm exigerait `node-linker=hoisted` et une configuration `watchFolders` / `nodeModulesPaths`.

## Decision

Monorepo **npm workspaces**. Les paquets sont créés **au fur et à mesure des gates**, jamais en arborescence vide.

Périmètre G1 :

```
apps/mobile
packages/core
packages/test-fixtures
supabase/
tooling/
docs/
```

`apps/web` n'est pas créé (Web différé). Les autres paquets — `module-sdk`, `privacy`, `security`, `knowledge`, `ai-gateway`, `ui`, `modules/*` — sont ajoutés à la gate qui les introduit.

L'invariant « aucune dépendance module → module » est contrôlé par un **lint de frontières de paquets**, exigé par `23_SECURITY_CONTROL_MATRIX` (« No direct module access → architecture lint »).

## Rationale

Respecte l'invariant du ledger sans dépendance d'outillage supplémentaire, et suit le chemin le mieux supporté par Expo/Metro et EAS Build.

## Alternatives

- **pnpm workspaces** — rejetée pour P0 : bénéfice tardif, coût immédiat de configuration pendant le bootstrap.
- **Application unique modulaire** — rejetée : contredit une décision verrouillée du ledger (condition STOP) et affaiblit le contrôle automatique des imports inter-modules.

## Consequences

Résolution de dépendances moins stricte que pnpm : risque de dépendances fantômes, compensé par le lint de frontières et par la revue des nouveaux paquets (`docs/12`, supply chain).

## Affected systems

Racine du dépôt, CI, configuration Metro, lint d'architecture.

## Security

Neutre à positif : les frontières de paquets rendent le contrôle d'import plus net.

## Privacy

Neutre.

## Tests

Test d'architecture `no illegal module imports`, obligatoire dès G3.

## Rollback

Migration vers pnpm par changement de lockfile, sans redécoupage des paquets.

## Points rattachés

- Nom de scope des paquets (`@olappus/*`) à figer avant la première commande de bootstrap.
- Runtime Node : voir ADR-0014.
