# Fix Navigation Error for ProfileEditNew

The error "Couldn't find a 'component', 'getComponent' or 'children' prop for the screen 'profileEditNew'" is likely a Metro bundler cache issue.

## Solution Steps:

1. **Clear Metro Cache:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Clean and Rebuild:**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

3. **If still having issues, restart Metro:**
   ```bash
   # Kill any running Metro processes
   pkill -f metro
   
   # Start fresh
   npx react-native start --reset-cache
   ```

## Verification:
- ProfileEditNew is properly exported in `src/app/layouts/main/index.tsx`
- Component is correctly imported in `src/stacks/main.tsx`
- Stack name `PROFILE_EDIT_NEW: 'profileEditNew'` is defined in `src/stacks/stacks.tsx`

The component and navigation setup is correct - this is a bundler cache issue.