# Aiven Free PostgreSQL provisioning

Observed on 2026-10-09 through the authenticated Aiven Console using the orca-cli and computer-use skills. User selected Aiven Free, explicitly authorized creation ("pode criar"), and performed account login manually.

| Property | Verified value |
| --- | --- |
| Service | estudisc-postgres |
| Existing project | matheusmendes077-49e1 |
| Service tier / plan | Free / Free-1-1gb |
| Final creation price | Free ($0 service tier) |
| PostgreSQL version | 18 |
| Resources | 1 node, 1 CPU, 1 GB RAM, 1 GB storage |
| Selected location | North America |
| Assigned provider / region | DigitalOcean sfo — United States, California |
| Last observed status | Running (authenticated system Chrome, 2026-10-09) |

[Service Console](https://console.aiven.io/account/a5e76e50330e/project/matheusmendes077-49e1/services/estudisc-postgres/overview)

The actual creation summary showed Free pricing before Create service was submitted. The subsequent service list independently confirmed the name, plan and resources; a fresh authenticated system-Chrome inspection on 2026-10-09 confirms Running. The exact cloud/region is assigned by the Free flow, which exposes only broad location choices. Running is provider readiness, not a verified SQL restore or application cutover.

The account already contained pg-ec32595, a Developer-1 service, before this action. It was not created, upgraded, deleted or modified here. The account trial banner is separate from the new service's explicitly verified Free plan.

No password/API key was revealed or copied, no production environment variable changed, no existing data deleted, and no lesson or user-state import performed. This service is empty and is not a replacement for a verified complete backup.

## Next action

Obtain a full original-database dump or provider-supported backup. The authenticated Neon Console confirms monthly network transfer exhaustion (5.54 GB), source storage around 55.5 MB and a Free billing period Oct 2 to Nov 1, 2026. Source reads/export remain blocked; request a free temporary export allowance only with explicit external-message authorization, or wait for the monthly allowance renewal. Validate complete restored size/headroom, connection budget, compatible schema/restore, ownership, published-version immutability and append-only history before a reversible cutover; retain the original database. Source packs and partial user exports are not a substitute for the complete original database.

## Validation

Authenticated Console UI: final Free creation summary and actual service list. Documentation-only repository changes: git diff --check. No application code changed; application tests were not rerun for provisioning documentation.
