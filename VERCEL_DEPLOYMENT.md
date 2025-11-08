# Vercel Deployment Instructions

## Option 1: Configure Root Directory in Vercel (Recommended)

1. Go to your Vercel project settings
2. Navigate to **Settings** → **General**
3. Under **Root Directory**, set it to: `website-new`
4. Save and redeploy

This is the cleanest solution and will make Vercel serve files directly from the `website-new` directory.

## Option 2: Use vercel.json (Current Setup)

The `vercel.json` file is configured to route all requests to the `website-new` directory. If you're still getting 404 errors:

1. Make sure `vercel.json` is in the root of your repository
2. Redeploy your project
3. Check that the routes are working:
   - `/` → `website-new/index.html`
   - `/privacy-policy` → `website-new/privacy-policy.html`
   - `/terms-of-service` → `website-new/terms-of-service.html`

## Troubleshooting

If you continue to see 404 errors:

1. **Check Vercel Build Logs**: Look for any errors during deployment
2. **Verify File Paths**: Ensure all files in `website-new/` are committed to git
3. **Clear Cache**: Try redeploying with "Clear Cache and Deploy"
4. **Check Routes**: Verify that the routes in `vercel.json` match your file structure

## Alternative: Move Files to Root

If the above doesn't work, you can move the website files to the repository root:

```bash
mv website-new/* .
rm -rf website-new
```

Then update all file paths in the HTML files to remove `website-new/` prefixes.

