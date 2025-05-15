# Fallback React Native Pods script for CI environments
# This is a minimal implementation that allows the build to proceed

def min_ios_version_supported
  return '12.4'
end

def use_react_native!(options={})
  # Simplified implementation for fallback
  pod 'React', :path => options[:path]
  pod 'React-Core', :path => "#{options[:path]}/React-Core"
  pod 'React-CoreModules', :path => "#{options[:path]}/React-CoreModules"
  pod 'React-RCTActionSheet', :path => "#{options[:path]}/React-RCTActionSheet"
  pod 'React-RCTAnimation', :path => "#{options[:path]}/React-RCTAnimation"
  pod 'React-RCTBlob', :path => "#{options[:path]}/React-RCTBlob"
  pod 'React-RCTImage', :path => "#{options[:path]}/React-RCTImage"
  pod 'React-RCTLinking', :path => "#{options[:path]}/React-RCTLinking"
  pod 'React-RCTNetwork', :path => "#{options[:path]}/React-RCTNetwork"
  pod 'React-RCTSettings', :path => "#{options[:path]}/React-RCTSettings"
  pod 'React-RCTText', :path => "#{options[:path]}/React-RCTText"
  pod 'React-RCTVibration', :path => "#{options[:path]}/React-RCTVibration"
end

def prepare_react_native_project!
  # No implementation needed for fallback
end

def react_native_post_install(installer, react_native_path, options={})
  # Simplified post-install for fallback
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_ios_version_supported
    end
  end
end
