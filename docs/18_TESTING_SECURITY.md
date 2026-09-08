# TESTING + SECURITY GATES

## Test layers
- unit ;
- integration ;
- contract ;
- RLS isolation ;
- OAuth ;
- upload security ;
- prompt injection ;
- end-to-end happy path ;
- offline/error states ;
- regression knowledge.

## Mandatory RLS tests
User A can access A only; never B. Test SELECT/INSERT/UPDATE/DELETE. Test Storage similarly.

Supabase recommends RLS on every exposed table, and Storage uses RLS policies for access control. [réf. non résolue — à revérifier]

## OAuth adversarial tests
Invalid state, missing code verifier, replayed callback, expired code, revoked grant, wrong account, missing scope.

## Upload tests
MIME spoofing, oversized files, dangerous filenames, malformed PDF/image, decompression bombs, SVG/HTML handling.

## Prompt injection fixtures
Emails/docs containing instructions such as “ignore previous rules”, fake system messages, external links, requests to exfiltrate data.

## License regression
A dataset marked blocked must fail ingestion even if the endpoint is reachable.

## Knowledge regression
Any change to a certified fact/rule must run impacted fixtures and historical cases.

## Security DoD
No critical/high unresolved vulnerability, no secrets in git, no cross-user leak, no bypass of action confirmation, no raw PII to external AI.
