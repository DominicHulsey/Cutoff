#!/bin/bash

# iOS icon generator script
# Generates all required icon sizes for iOS from a single source image

SOURCE_ICON="./assets/icon.png"
OUTPUT_DIR="./ios/Rewire/Images.xcassets/AppIcon.appiconset"

# Clear existing icons in the AppIcon.appiconset directory
find "$OUTPUT_DIR" -name "*.png" -delete

# Create iOS icon sizes
echo "Generating iOS icons..."

# iPhone icons
sips -z 40 40 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-20@2x.png"
sips -z 60 60 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-20@3x.png"
sips -z 58 58 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-29@2x.png"
sips -z 87 87 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-29@3x.png"
sips -z 80 80 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-40@2x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-40@3x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-60@2x.png"
sips -z 180 180 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-60@3x.png"

# App Store icon
sips -z 1024 1024 "$SOURCE_ICON" --out "$OUTPUT_DIR/icon-1024.png"

echo "iOS icons generated successfully!"
