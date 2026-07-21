"""
app/prompts/json/
==================
Caution: this package is named `json`, same as the stdlib module. This is
safe in Python 3 because imports are absolute by default -- `import json`
anywhere in the codebase still resolves to the stdlib, and this package is
only ever reached via its full dotted path (`app.prompts.json.json_rules`).
Do not add a `from . import json` style relative import inside this
package; use explicit names (`from app.prompts.json import json_rules`)
to keep this unambiguous for future contributors.
"""
