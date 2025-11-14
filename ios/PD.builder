require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

ENV['RCT_NEW_ARCH_ENABLED'] = podfile_properties['newArchEnabled'] == 'true' ? '1' : '0'
ENV['EX_DEV_CLIENT_NETWORK_INSPECTOR'] = podfile_properties['EX_DEV_CLIENT_NETWORK_INSPECTOR']

platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'

# Necessário para bibliotecas Swift como o Firebase.
use_modular_headers!

install! 'cocoapods',
  :deterministic_uuids => false

prepare_react_native_project!

# Hook para corrigir conflitos de vinculação com o React Native.
# Força os pods principais do React a serem bibliotecas estáticas.
pre_install do |installer|
  # Workaround para https://github.com/facebook/react-native/issues/34116
  Pod::Installer::Xcode::TargetValidator.send(:define_method, :verify_no_static_framework_transitive_dependencies) {}

  pods_to_fix = [
    'React-Core',
    'React-cxxreact',
    'React-jsi',
    'React-jsiexecutor',
    'React-jsinspector',
    'React-perflogger',
    'ReactCommon',
    'Yoga',
    'glog',
    'Folly'
  ]

  installer.pod_targets.each do |pod|
    if pods_to_fix.include?(pod.name)
      def pod.build_type;
        Pod::BuildType.static_library
      end
    end
  end
end

target 'CMPacatuba' do
  use_expo_modules!
  config = use_native_modules!

  # use_frameworks! deve ser usado com cuidado. Se precisar, use :linkage => :dynamic
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => podfile_properties['apple.ccacheEnabled'] == 'true',
    )

    # Correção para evitar problemas de assinatura de código em bundles de recursos
    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
        target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
          resource_bundle_target.build_configurations.each do |config|
            config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
          end
        end
      end
  end
end
