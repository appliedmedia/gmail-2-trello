# PR Title
Reorganize test directory: move .md files to docs/ and archive non-test files

# PR Description
## Changes Made

### 1. Moved .md files to docs/ with git history preserved
- `test/CODE_FLOW_ANALYSIS.md` → `docs/CODE_FLOW_ANALYSIS.md` (using `git mv`)
- `test/class_refactor.md` → `docs/class_refactor.md` (using `git mv`)

### 2. Moved all non-test_* files to archives
- **23 files moved** from `test/` to `Ω_archives_ignore/`
- All `obsolete_*.js` files and non-test HTML files archived
- Cleaned up test directory to contain only essential test files

### 3. Final test/ directory structure
The `test/` directory now contains only:
- `test_shared.js` - Shared test utilities
- `test_class_utils.js` - Utils class tests (158 tests passing)
- `test_class_app.js` - App class tests
- `test_class_gmailView.js` - GmailView class tests
- `test_class_goog.js` - Goog class tests
- `test_class_model.js` - Model class tests
- `test_class_trel.js` - Trel class tests

### 4. Verification
- ✅ Git history preserved for .md files using `git mv`
- ✅ Test suite still works (158 tests passing)
- ✅ Clean, organized directory structure

## Commits Included
- `ddad5ad` - Move obsolete test files and documentation to archives
- `57e2c68` - Add createMockInstances method and rename test static const file

# PR URL
https://github.com/appliedmedia/gmail-2-trello/compare/main...cursor/rename-static-const-and-run-tests-97fe