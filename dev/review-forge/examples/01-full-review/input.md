# Input

Review the supplied diff with all Review Forge v1 lenses.

```diff
diff --git a/src/example.js b/src/example.js
+function readUser(id) {
+  return db.query('select * from users where id = ' + id);
+}
```

Context: no upstream specification supplied.
