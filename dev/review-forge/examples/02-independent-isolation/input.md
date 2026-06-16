# Input

Run Independent Reviewer.

Diff:

```diff
diff --git a/src/calc.js b/src/calc.js
- return total / count;
+ return count ? total / count : 0;
```

Additional context (must not be passed to Independent Reviewer): architecture decision says zero is acceptable.
