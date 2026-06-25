# Mobile Release Parity

Phase 26 release coverage:

| Capability                                  | Controller/widget coverage         | Release gate               |
| ------------------------------------------- | ---------------------------------- | -------------------------- |
| Shared login and session restore            | `auth_controller_test.dart`        | Flutter test               |
| Preferred city and public offers            | region unit/widget tests           | Flutter test               |
| Saved lists and checklist state             | shopping-list unit/widget tests    | Flutter test               |
| Local/global optimization evidence          | optimization unit/widget tests     | Flutter test               |
| Receipt submission and manual-release state | receipt gateway tests              | Flutter test               |
| Location permission and radius              | location controller tests          | Flutter test               |
| Monetary privacy                            | persistent privacy controller test | Flutter test               |
| Android package                             | release APK                        | Release Readiness workflow |

The monetary privacy toggle is available in Profile. It masks prices, savings,
totals, and subtotals across home, lists, offer details, and optimization result
surfaces. The preference is stored locally and defaults to visible for existing
users.

iOS packaging remains dependent on an Apple-signing runner and is not claimed
by the current Linux workflow.
