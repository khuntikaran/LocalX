
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

## Continuous Deployment
You can set up GitHub Actions for continuous deployment by adding a workflow file. 
Please check Firebase documentation for more details.

## Manual Deployment Without Firebase CLI
If you prefer not to install the Firebase CLI globally, you can use npx:
```
npx firebase-tools login
npx firebase-tools deploy
```

## Troubleshooting
- If you encounter permission issues, make sure you're logged in with the correct account
- If build fails, ensure all dependencies are installed with `npm install`
- For routing issues, check the rewrites in firebase.json
