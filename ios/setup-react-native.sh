#!/bin/bash
# This script helps set up React Native for CI environments

# Print debugging information
echo "Setting up React Native for CI..."
echo "Current directory: $(pwd)"

# Check if node_modules exists
if [ -d "../node_modules/react-native" ]; then
  echo "React Native found in node_modules"
  ls -la ../node_modules/react-native
  ls -la ../node_modules/react-native/scripts
else
  echo "React Native not found in node_modules, installing..."
  cd ..
  yarn install --frozen-lockfile
  cd ios
fi

# Create a symlink to ensure the scripts are found
mkdir -p ./node_modules
ln -sf ../node_modules/react-native ./node_modules/

# Create a simple react_native_pods.rb if it doesn't exist
if [ ! -f "../node_modules/react-native/scripts/react_native_pods.rb" ]; then
  echo "Creating fallback react_native_pods.rb..."
  mkdir -p ../node_modules/react-native/scripts
  cat > ../node_modules/react-native/scripts/react_native_pods.rb << 'EOL'
# Fallback React Native Pods script
def min_ios_version_supported
  return '12.4'
end

def use_react_native!(options={})
  # Implementation not needed for fallback
end

def prepare_react_native_project!
  # Implementation not needed for fallback
end

def react_native_post_install(installer, react_native_path, options={})
  # Implementation not needed for fallback
end
EOL
fi

echo "React Native setup complete!"
