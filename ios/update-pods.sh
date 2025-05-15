#!/bin/bash
# Script to update pods and handle Hermes engine version mismatch

echo "Cleaning pods cache to avoid version conflicts..."
rm -rf Pods Podfile.lock

echo "Installing pods..."
bundle exec pod install --repo-update

# If the initial pod install fails, try updating Hermes engine
if [ $? -ne 0 ]; then
  echo "Pod install failed. Trying to update Hermes engine..."
  bundle exec pod update hermes-engine --no-repo-update
  
  echo "Retrying pod install..."
  bundle exec pod install
fi

echo "Pod installation completed."
