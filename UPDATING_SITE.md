# How to Update Your Website

Here is a quick cheat sheet for publishing changes to your live site.

## 1. Make Your Changes
Edit any files you want (e.g., `index.html`, `styles.css`, `app.js`, or `README.md`).

## 2. Open Terminal
Make sure you are in your project folder:
```bash
cd "/Users/jakealles/Desktop/MSBA/Spring 2026/Project "
```

## 3. Review Changes (Optional)
Check what files you've modified:
```bash
git status
```

## 4. Stage, Commit, and Push
Run these three commands in order:

```bash
# 1. Stage all changes
git add .

# 2. Commit with a message describing what you did
git commit -m "Describe your change here" 
# Example: git commit -m "Update player colors"

# 3. Push to GitHub
git push
```

## 5. Verify
-   Wait about **1-2 minutes**.
-   Visit your site: [https://jaa225.github.io/2024_nfl_wr_efficiency/](https://jaa225.github.io/2024_nfl_wr_efficiency/)
-   **Tip:** You might need to do a "Hard Refresh" to see changes immediately:
    -   **Mac**: `Cmd + Shift + R`
    -   **Windows**: `Ctrl + F5`
