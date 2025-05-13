#!/bin/bash

echo "Setting up the splash screen for iOS..."

# Create the imageset directory if it doesn't exist
mkdir -p ios/Rewire/Images.xcassets/SplashImage.imageset

# Copy the splash image to the iOS assets at different scales
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

echo "Splash screen setup complete! The splash screen has been added to your iOS project."
echo "Remember to rebuild your iOS app to see the changes."
