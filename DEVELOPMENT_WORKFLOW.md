# Development Workflow Guide

## 🚀 Clean Development Process

### **Before Starting Work:**
1. **Always pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Check current status:**
   ```bash
   git status
   ```

### **During Development:**
1. **Make small, focused commits:**
   ```bash
   git add <specific-files>
   git commit -m "Clear, descriptive message"
   ```

2. **Test before committing:**
   ```bash
   npm run build
   npm run lint
   ```

3. **Keep commits atomic** - one logical change per commit

### **Before Pushing:**
1. **Ensure clean working directory:**
   ```bash
   git status
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

3. **Resolve any conflicts immediately**

4. **Test the build:**
   ```bash
   npm run build
   ```

### **Pushing Changes:**
1. **Push directly to main (for this project):**
   ```bash
   git push origin main
   ```

## 🛠️ ESLint Configuration

### **Current ESLint Rules:**
- **Critical (Blocking):** TypeScript errors, unused imports, missing dependencies
- **Warnings (Non-blocking):** Image optimization suggestions

### **Quick Fix Commands:**
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check specific files
npm run lint -- app/dashboard/page.tsx

# Build to see all issues
npm run build
```

## 🔧 Common Issues & Solutions

### **Merge Conflicts:**
1. **If you get merge conflicts:**
   ```bash
   git status  # See conflicted files
   # Edit files to resolve conflicts
   git add <resolved-files>
   git commit -m "Resolve merge conflicts"
   ```

2. **If merge gets messy:**
   ```bash
   git merge --abort  # Cancel merge
   git pull --rebase origin main  # Try rebase instead
   ```

### **TypeScript Errors:**
1. **Replace `any` types with proper types**
2. **Add missing dependencies to useEffect**
3. **Remove unused imports**

### **Build Failures:**
1. **Check ESLint output first**
2. **Fix critical errors (not warnings)**
3. **Test build again**

## 📋 Pre-Deployment Checklist

- [ ] All TypeScript errors fixed
- [ ] No unused imports
- [ ] All useEffect dependencies correct
- [ ] Build passes (`npm run build`)
- [ ] No merge conflicts
- [ ] Working directory clean

## 🚨 Emergency Procedures

### **If Deployment Fails:**
1. **Check build logs for specific errors**
2. **Fix critical ESLint errors**
3. **Commit and push fixes**
4. **Redeploy**

### **If Git Gets Messy:**
1. **Don't panic!**
2. **Check current status: `git status`**
3. **Use `git log --oneline -5` to see recent commits**
4. **If needed, reset to a clean state:**
   ```bash
   git reset --hard origin/main
   # Then reapply your changes carefully
   ```

## 🎯 Best Practices

1. **Always work from the latest main branch**
2. **Commit frequently with clear messages**
3. **Test builds before pushing**
4. **Keep commits small and focused**
5. **Resolve conflicts immediately**
6. **Use descriptive commit messages**

## 📞 When Things Go Wrong

1. **Check this guide first**
2. **Look at recent git history: `git log --oneline -10`**
3. **Check for merge commits that might have overwritten changes**
4. **If needed, revert to a working state and reapply changes**

---

**Remember:** Clean, organized development prevents most issues. When in doubt, pull latest changes and test before pushing! 