# Profiles

Named environment profiles let you save, load, and switch between sets of environment variables without manually editing `.env` files.

## Storing profiles

Profiles are saved as JSON files in `.pour-profiles/` in your project root.

```
.pour-profiles/
  staging.json
  production.json
  local.json
```

## CLI usage

```bash
# Save current env as a profile
pour-env profile save staging

# Load a profile into the current shell
pour-env profile load staging

# List all saved profiles
pour-env profile list

# Delete a profile
pour-env profile delete staging

# Switch from one profile to another
pour-env profile switch staging production
```

## Programmatic usage

```js
import { saveProfile, loadProfile, listProfiles } from './src/profile.js';
import { applyProfile, switchProfile } from './src/profile-apply.js';

// Save the current env as "staging"
saveProfile('staging', process.env);

// Apply a profile to process.env
applyProfile('staging');

// Switch profiles (removes old-only keys)
switchProfile('staging', 'production');
```

## Notes

- Profile names must be valid strings (no slashes or special chars recommended).
- `mergeSafe` is used by default so existing env vars are not overwritten unless `override: true` is passed.
- Profiles are not automatically redacted — use `redactEnv` before saving if needed.
