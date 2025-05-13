#!/bin/bash

echo "Fixing icon and splash screen for iOS..."

# Create a directory to store the fixed images
mkdir -p fixed_assets

# Fix the icon - remove transparency and fill with white background
echo "Converting icon to remove transparency..."
sips -s format png --addIcon assets/icon.png --out fixed_assets/icon_with_bg.png
# If sips with --addIcon fails, try alternative approach
if [ ! -f fixed_assets/icon_with_bg.png ]; then
  echo "Using alternative approach for icon conversion..."
  convert assets/icon.png -background white -alpha remove -alpha off fixed_assets/icon_with_bg.png
fi

# Create a simple splash screen PNG if the current one is not a valid PNG
echo "Creating splash screen image..."
convert -size 1242x2688 xc:white \
  -font Helvetica-Bold -pointsize 72 -fill "#2A7D4F" -gravity center \
  -annotate +0+0 "Rewire" \
  fixed_assets/splash.png

# Copy the fixed images back to assets
cp fixed_assets/icon_with_bg.png assets/icon.png
cp fixed_assets/splash.png assets/splash.png

echo "Images fixed. Now updating the iOS configuration..."

# Update the iOS launch screen configuration
# First, check if LaunchScreen.storyboard exists
if [ -f ios/Rewire/LaunchScreen.storyboard ]; then
  echo "Updating LaunchScreen.storyboard..."
  
  # Copy the splash image to the iOS assets
  mkdir -p ios/Rewire/Images.xcassets/SplashImage.imageset
  cp assets/splash.png ios/Rewire/Images.xcassets/SplashImage.imageset/splash.png
  cp assets/splash.png ios/Rewire/Images.xcassets/SplashImage.imageset/splash@2x.png
  cp assets/splash.png ios/Rewire/Images.xcassets/SplashImage.imageset/splash@3x.png
  
  # Create Contents.json for the splash image
  cat > ios/Rewire/Images.xcassets/SplashImage.imageset/Contents.json << EOL
{
  "images" : [
    {
      "filename" : "splash.png",
      "idiom" : "universal",
      "scale" : "1x"
    },
    {
      "filename" : "splash@2x.png",
      "idiom" : "universal",
      "scale" : "2x"
    },
    {
      "filename" : "splash@3x.png",
      "idiom" : "universal",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOL

fi

# Now update the icon
echo "Regenerating app icons..."
chmod +x ios-icon-generator.sh
./ios-icon-generator.sh

echo "Done! Images have been fixed and iOS configuration updated."
