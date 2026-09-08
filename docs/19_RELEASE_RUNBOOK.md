# RELEASE RUNBOOK

## Environments
- local
- dev
- staging
- production later

Google recommends separate projects per deployment tier. [réf. non résolue — à revérifier]

## Pre-release
1. lockfile clean ;
2. migrations tested on disposable DB ;
3. RLS suite green ;
4. OAuth tests green ;
5. secret scan ;
6. dependency audit ;
7. cost budget check ;
8. delete/export test ;
9. crash/error states reviewed ;
10. release notes.

## Pilot rollout
- 5 testers first;
- 20 next;
- 50 only after security gate;
- up to 100 Google test users under Testing state if applicable.

## Rollback
Every migration must have rollback/forward recovery strategy. Feature flags must allow disabling a connector or AI service independently.
