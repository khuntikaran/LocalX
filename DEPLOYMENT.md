
# Deployment Instructions for Firebase

## Prerequisites
1. Install Firebase CLI globally:
```
npm install -g firebase-tools
```

2. Login to Firebase:
```
firebase login
```

## Steps to Deploy

1. Build the project:
```
npm run build
```

2. Deploy to Firebase:
```
firebase deploy
```

## Deployment Verification
1. After deployment completes, Firebase will provide a URL where your site is hosted.
2. Visit this URL to verify your application is working correctly.
3. Test all functionality, especially file conversions and user authentication.

## Continuous Deployment
For automatic deployments when you push to your repository:

1. In your GitHub repository, go to Settings > Secrets
2. Add the following secrets:
   - `FIREBASE_TOKEN`: Get this by running `firebase login:ci` in your terminal
   
3. Create a GitHub workflow file at `.github/workflows/firebase-deploy.yml`:
```yml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]
jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseToken: '${{ secrets.FIREBASE_TOKEN }}'
          channelId: live
```

## Manual Deployment Without Firebase CLI
If you prefer not to install the Firebase CLI globally, you can use npx:
```
npx firebase-tools login
npx firebase-tools deploy
```

## Trouble-shooting Common Deployment Issues

1. **Authentication Issues**: If users cannot log in after deployment, check:
   - Firebase authentication is enabled in the Firebase console
   - The correct Firebase project is selected in `.firebaserc`

2. **Missing Files**: If your site deploys but shows 404 errors:
   - Verify the `dist` directory was properly built
   - Check `firebase.json` for correct public directory setting

3. **Performance Issues**: For large file conversions:
   - Add cache-control headers for static assets in `firebase.json`
   
4. **Quota Limits**: Firebase has limits on its free tier:
   - Monitor usage in the Firebase console
   - Set up budget alerts to avoid unexpected charges

## Important Notes About LocalX

- All file conversions happen locally in the user's browser, not on Firebase servers
- User data is stored in Firebase Authentication and Firestore
- Free users get 10 conversions, premium users get unlimited conversions
- The app emphasizes privacy by not uploading files to any server
